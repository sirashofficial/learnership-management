import { PrismaClient } from '@prisma/client';
import { queueGroupRefresh } from './calculations/materializedViewManager';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool configuration for production load (5000+ students)
  // PgBouncer already handles pooling at infrastructure level,
  // but Prisma needs its own pool for application-level connection management
});

// Models that support soft delete
const SOFT_DELETABLE_MODELS = ['User', 'Group', 'Student', 'Assessment', 'Attendance'];

// Middleware to automatically filter soft-deleted records
prisma.$use(async (params, next) => {
  // Only apply soft delete filter to models that support it
  if (SOFT_DELETABLE_MODELS.includes(params.model || '')) {
    // For findMany and findFirst queries, automatically exclude soft-deleted records
    // unless explicitly requested via includeDeleted flag
    if (params.action === 'findMany' || params.action === 'findFirst') {
      // Check if query explicitly wants deleted records
      const includeDeleted = params.args?.where?.includeDeleted;
      
      if (includeDeleted !== undefined) {
        // Remove the includeDeleted flag from the query (it's not a real field)
        delete params.args.where.includeDeleted;
      }
      
      // If not explicitly including deleted, filter them out
      if (!includeDeleted) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        
        // Add isDeleted: false filter
        params.args.where = {
          ...params.args.where,
          isDeleted: false,
        };
      }
    }
    
    // For count operations, also exclude soft-deleted records
    if (params.action === 'count') {
      const includeDeleted = params.args?.where?.includeDeleted;
      
      if (includeDeleted !== undefined) {
        delete params.args.where.includeDeleted;
      }
      
      if (!includeDeleted) {
        params.args = params.args || {};
        params.args.where = params.args.where || {};
        params.args.where = {
          ...params.args.where,
          isDeleted: false,
        };
      }
    }
  }
  
  return next(params);
});

// Middleware to auto-refresh materialized views when data changes
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Only trigger on create, update, delete operations
  if (!['create', 'update', 'delete', 'deleteMany', 'updateMany'].includes(params.action)) {
    return result;
  }

  try {
    // Queue refresh when Assessment records change
    if (params.model === 'Assessment') {
      if (params.action === 'create' || params.action === 'update') {
        // Get groupId from the student
        const assessment = result;
        if (assessment?.studentId) {
          const student = await prisma.student.findUnique({
            where: { id: assessment.studentId },
            select: { groupId: true },
          });
          if (student?.groupId) {
            queueGroupRefresh(student.groupId);
          }
        }
      } else if (params.action === 'delete') {
        // For delete, params.where contains the id
        if (params.args?.where?.id) {
          const assessment = await prisma.assessment.findUnique({
            where: { id: params.args.where.id },
            include: { student: { select: { groupId: true } } },
          });
          if (assessment?.student?.groupId) {
            queueGroupRefresh(assessment.student.groupId);
          }
        }
      }
    }

    // Queue refresh when Attendance records change
    if (params.model === 'Attendance') {
      if (params.action === 'create' || params.action === 'update') {
        const attendance = result;
        if (attendance?.groupId) {
          queueGroupRefresh(attendance.groupId);
        }
      } else if (params.action === 'delete') {
        if (params.args?.where?.id) {
          const attendance = await prisma.attendance.findUnique({
            where: { id: params.args.where.id },
            select: { groupId: true },
          });
          if (attendance?.groupId) {
            queueGroupRefresh(attendance.groupId);
          }
        }
      } else if (params.action === 'updateMany' || params.action === 'deleteMany') {
        // For bulk operations, refresh all affected groups
        if (params.args?.where?.groupId) {
          queueGroupRefresh(params.args.where.groupId);
        }
      }
    }

    // Queue refresh when Student progress fields change
    if (params.model === 'Student') {
      if (params.action === 'update' || params.action === 'updateMany') {
        // Check if progress or totalCreditsEarned changed
        const data = params.args?.data;
        if (data?.progress !== undefined || data?.totalCreditsEarned !== undefined) {
          if (params.args?.where?.id) {
            const student = await prisma.student.findUnique({
              where: { id: params.args.where.id },
              select: { groupId: true },
            });
            if (student?.groupId) {
              queueGroupRefresh(student.groupId);
            }
          } else if (params.args?.where?.groupId) {
            queueGroupRefresh(params.args.where.groupId);
          }
        }
      }
    }
  } catch (error) {
    // Don't throw - logging only. Materialized view refresh failures shouldn't break operations
    console.error('Error in materialized view middleware:', error);
  }

  return result;
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
