/**
 * API Response Handling Utility
 * Provides safe accessors for API responses with null checks
 * Helps prevent "Cannot read property of undefined" errors
 */

export interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error?: string;
  message?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Safely extract data from API response
 * Returns undefined if response is malformed or failed
 */
export function getApiData<T>(
  response: any
): T | undefined {
  if (!response) return undefined;
  if (response.success === false) return undefined;
  return response.data ?? response;
}

/**
 * Safely extract array from API response
 * Returns empty array if response is malformed
 */
export function getApiArray<T>(
  response: any
): T[] {
  const data = getApiData<T[]>(response);
  if (Array.isArray(data)) return data;
  return [];
}

/**
 * Safely get a single item from API response
 * Returns undefined if not found
 */
export function getApiItem<T>(response: any): T | undefined {
  const data = getApiData<T>(response);
  if (!data || typeof data === 'object' && !Array.isArray(data)) return data;
  return undefined;
}

/**
 * Get error message from API response
 */
export function getApiError(response: any): string {
  if (!response) return 'Unknown error';
  return response.error || response.message || 'Unknown error';
}

/**
 * Check if API response was successful
 */
export function isApiSuccess(response: any): response is ApiSuccessResponse<any> {
  return response?.success === true || (response && !response.success && response.data);
}

/**
 * Safely access nested property with null checks
 * Example: safeGet(response, 'data.user.name', 'Unknown')
 */
export function safeGet(
  obj: any,
  path: string,
  defaultValue: any = undefined
): any {
  try {
    const value = path
      .split('.')
      .reduce((acc, part) => acc?.[part], obj);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Flatten an object with null safety
 * Converts nested object to flat key-value pairs
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  function flatten(current: any, path: string) {
    if (current === null || current === undefined) {
      return;
    }

    if (typeof current === 'object' && !Array.isArray(current)) {
      for (const key in current) {
        if (current.hasOwnProperty(key)) {
          flatten(current[key], path ? `${path}.${key}` : key);
        }
      }
    } else {
      result[path] = current;
    }
  }

  flatten(obj, prefix);
  return result;
}
