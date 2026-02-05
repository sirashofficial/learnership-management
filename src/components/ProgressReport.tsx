'use client';

import React from 'react';
import { CalendarDays, Users, BookOpen, TrendingUp, TrendingDown } from 'lucide-react';

interface ProgressReportProps {
  groups: Array<{
    id: string;
    name: string;
    company: string;
    startDate: string;
    endDate: string;
    status: string;
    overallProgress: number;
    daysElapsed: number;
    totalDays: number;
    _count: { students: number };
    courses: Array<{
      id: string;
      plannedStartDate: string;
      plannedEndDate: string;
      status: string;
      course: { name: string; totalDuration: number };
      progress: Array<{
        status: string;
        student: { id: string; firstName: string; lastName: string };
      }>;
    }>;
  }>;
}

export default function ProgressReport({ groups }: ProgressReportProps) {
  const calculateVariance = (group: any) => {
    const timeProgress = (group.daysElapsed / group.totalDays) * 100;
    const variance = group.overallProgress - timeProgress;
    return { variance, timeProgress };
  };

  const getStatusColor = (variance: number) => {
    if (variance > 10) return 'text-green-600';
    if (variance > -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (variance: number) => {
    if (variance > 10) return { color: 'bg-green-100 text-green-800', label: 'Ahead' };
    if (variance > -5) return { color: 'bg-yellow-100 text-yellow-800', label: 'On Track' };
    return { color: 'bg-red-100 text-red-800', label: 'Behind' };
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Groups</p>
              <p className="text-3xl font-bold text-gray-900">{groups.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">
                {groups.reduce((sum, group) => sum + group._count.students, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Progress</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(groups.reduce((sum, group) => sum + group.overallProgress, 0) / groups.length)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Behind Schedule</p>
              <p className="text-3xl font-bold text-gray-900">
                {groups.filter(group => calculateVariance(group).variance < -5).length}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Group Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => {
          const { variance, timeProgress } = calculateVariance(group);
          const statusBadge = getStatusBadge(variance);
          
          return (
            <div key={group.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.company}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span className="font-medium">{group.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${group.overallProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time Progress</span>
                    <span className="font-medium">{Math.round(timeProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-500 h-2 rounded-full transition-all" 
                      style={{ width: `${timeProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Variance Indicator */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Progress vs Timeline:</span>
                <div className={`flex items-center gap-1 ${getStatusColor(variance)}`}>
                  {variance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {variance >= 0 ? '+' : ''}{Math.round(variance)}%
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{group._count.students}</span>
                  </div>
                  <p className="text-xs text-gray-500">Students</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CalendarDays className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{group.daysElapsed}</span>
                  </div>
                  <p className="text-xs text-gray-500">Days Elapsed</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{group.courses.length}</span>
                  </div>
                  <p className="text-xs text-gray-500">Courses</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Started: {new Date(group.startDate).toLocaleDateString()}</span>
                  <span>Ends: {new Date(group.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {groups.filter(group => calculateVariance(group).variance < -5).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Groups Requiring Attention</h3>
          <div className="space-y-2">
            {groups
              .filter(group => calculateVariance(group).variance < -5)
              .map(group => (
                <div key={group.id} className="text-sm">
                  <strong>{group.name}</strong> is {Math.abs(Math.round(calculateVariance(group).variance))}% behind schedule.
                  Consider additional support or timeline adjustment.
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GroupProgressData {
  id: string;
  name: string;
  company: string;
  startDate: string;
  endDate: string;
  status: string;
  overallProgress: number;
  daysElapsed: number;
  totalDays: number;
  _count: {
    students: number;
  };
  courses: Array<{
    id: string;
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate?: string;
    actualEndDate?: string;
    status: string;
    course: {
      name: string;
      totalDuration?: number;
    };
    progress: Array<{
      status: string;
      student: {
        id: string;
        firstName: string;
        lastName: string;
      };
    }>;
  }>;
}

interface GroupProgressCardProps {
  group: GroupProgressData;
}

export function GroupProgressCard({ group }: GroupProgressCardProps) {
  const progressPercentage = (group.daysElapsed / group.totalDays) * 100;
  const isOnTrack = group.overallProgress >= progressPercentage;
  const variance = Math.abs(group.overallProgress - progressPercentage);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-500', label: 'Active' },
      PENDING: { color: 'bg-yellow-500', label: 'Pending' },
      COMPLETED: { color: 'bg-blue-500', label: 'Completed' },
      ARCHIVED: { color: 'bg-gray-500', label: 'Archived' },
      INACTIVE: { color: 'bg-red-500', label: 'Inactive' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {group.company}
          </CardDescription>
        </div>
        {getStatusBadge(group.status)}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{group._count.students} Students</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{group.courses.length} Courses</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Day {group.daysElapsed} of {group.totalDays}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isOnTrack ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
              {isOnTrack ? 'On Track' : 'Behind Schedule'}
            </span>
          </div>
        </div>

        {/* Progress Tracking */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Planned Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span>Actual Progress</span>
            <span>{group.overallProgress}%</span>
          </div>
          <Progress value={group.overallProgress} className="h-2" />
          
          {variance > 5 && (
            <div className={`text-sm p-2 rounded ${isOnTrack ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <strong>Variance:</strong> {isOnTrack ? 'Ahead by' : 'Behind by'} {Math.round(variance)}%
              {!isOnTrack && ' - Consider additional support or schedule adjustment'}
            </div>
          )}
        </div>

        {/* Course Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Course Progress:</h4>
          {group.courses.map((groupCourse) => {
            const completedStudents = groupCourse.progress.filter(p => p.status === 'COMPLETED').length;
            const totalStudents = group._count.students;
            const courseProgress = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
            
            return (
              <div key={groupCourse.id} className="flex justify-between items-center text-sm">
                <span className="truncate">{groupCourse.course.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{completedStudents}/{totalStudents}</span>
                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${courseProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <div className="flex justify-between">
            <span>Start: {new Date(group.startDate).toLocaleDateString()}</span>
            <span>End: {new Date(group.endDate).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressReportProps {
  groups: GroupProgressData[];
}

export default function ProgressReport({ groups }: ProgressReportProps) {
  const totalGroups = groups.length;
  const activeGroups = groups.filter(g => g.status === 'ACTIVE').length;
  const onTrackGroups = groups.filter(g => {
    const progressPercentage = (g.daysElapsed / g.totalDays) * 100;
    return g.overallProgress >= progressPercentage - 5; // 5% tolerance
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalGroups}</div>
            <p className="text-xs text-muted-foreground">Total Groups</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{activeGroups}</div>
            <p className="text-xs text-muted-foreground">Active Groups</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{onTrackGroups}</div>
            <p className="text-xs text-muted-foreground">On Track Groups</p>
          </CardContent>
        </Card>
      </div>

      {/* Group Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {groups.map((group) => (
          <GroupProgressCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}