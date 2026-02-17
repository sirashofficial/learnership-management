import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * ============================================================================
 * STANDARDIZED API RESPONSE TYPES
 * ============================================================================
 */

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: Pagination;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * ============================================================================
 * RESPONSE BUILDERS
 * ============================================================================
 */

/**
 * Build a successful response with optional message
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || 'Request successful',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Build a successful paginated response
 */
export function successPaginatedResponse<T>(
  data: T[],
  pagination: Pagination,
  message?: string,
  status: number = 200
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
      message: message || 'Request successful',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Build an error response with standardized format
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code: code || getErrorCode(status),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Handle validation errors from Zod or manual validation
 */
export function validationErrorResponse(
  errors: ValidationError[] | ZodError,
  status: number = 400
): NextResponse<ApiResponse> {
  let formattedErrors: ValidationError[] = [];

  if (errors instanceof ZodError) {
    formattedErrors = errors.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else {
    formattedErrors = errors;
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      data: formattedErrors,
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Handle API errors with proper logging and standardization
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof ZodError) {
    return validationErrorResponse(error, 422);
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('not found')) {
      return errorResponse(error.message, 404, 'NOT_FOUND');
    }

    if (error.message.includes('Unique constraint failed')) {
      return errorResponse('Resource already exists', 409, 'CONFLICT');
    }

    if (error.message.includes('unauthorized')) {
      return errorResponse('Unauthorized access', 401, 'UNAUTHORIZED');
    }

    if (error.message.includes('forbidden')) {
      return errorResponse('Access forbidden', 403, 'FORBIDDEN');
    }

    return errorResponse(error.message, 500, 'INTERNAL_ERROR');
  }

  return errorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

/**
 * Extract pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || '20'))
  );
  const skip = (page - 1) * pageSize;

  return { page, pageSize, skip };
}

/**
 * Create pagination metadata
 */
export function createPagination(
  page: number,
  pageSize: number,
  total: number
): Pagination {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Extract filter parameters from request
 */
export function getFilterParams(
  request: NextRequest,
  allowedFilters: string[]
): Record<string, any> {
  const { searchParams } = new URL(request.url);
  const filters: Record<string, any> = {};

  for (const filter of allowedFilters) {
    const value = searchParams.get(filter);
    if (value) {
      filters[filter] = value;
    }
  }

  return filters;
}

/**
 * Extract sort parameters from request
 */
export function getSortParams(
  request: NextRequest,
  defaultSort?: { field: string; order: 'asc' | 'desc' }
): { field: string; order: 'asc' | 'desc' } {
  const { searchParams } = new URL(request.url);

  const sortField = searchParams.get('sortBy');
  const sortOrder = searchParams.get('sortOrder');

  if (!sortField) {
    return defaultSort || { field: 'createdAt', order: 'desc' };
  }

  return {
    field: sortField,
    order: (sortOrder as 'asc' | 'desc') || 'asc',
  };
}

/**
 * Get HTTP status code from error code
 */
function getErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };

  return codes[status] || 'ERROR';
}
