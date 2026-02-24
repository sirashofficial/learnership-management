/**
 * Validation Utility Functions
 * Centralized validation logic for common patterns
 */

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Check if a value is required (not null, undefined, or empty string)
 */
export function validateRequired(
  value: any,
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }
  return { valid: true, errors: [] };
}

/**
 * Validate email format
 */
export function validateEmail(
  email: string | null | undefined,
  fieldName: string = 'email'
): ValidationResult {
  if (!email) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: 'Invalid email format' }],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate date is in valid format and is a real date
 */
export function validateDate(
  date: any,
  fieldName: string
): ValidationResult {
  if (!date) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: 'Invalid date format' }],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate date range (start before end)
 */
export function validateDateRange(
  startDate: any,
  endDate: any,
  startFieldName: string = 'startDate',
  endFieldName: string = 'endDate'
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!startDate) {
    errors.push({ field: startFieldName, message: `${startFieldName} is required` });
  }
  if (!endDate) {
    errors.push({ field: endFieldName, message: `${endFieldName} is required` });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push({ field: startFieldName, message: 'Invalid start date format' });
  }
  if (isNaN(end.getTime())) {
    errors.push({ field: endFieldName, message: 'Invalid end date format' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  if (start >= end) {
    errors.push({
      field: endFieldName,
      message: 'End date must be after start date',
    });
  }

  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}

/**
 * Validate value is in allowed enum values
 */
export function validateEnum<T extends string>(
  value: any,
  allowedValues: T[],
  fieldName: string
): ValidationResult {
  if (!value) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }

  if (!allowedValues.includes(value)) {
    return {
      valid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        },
      ],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate number is within range
 */
export function validateNumberRange(
  value: any,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (value === null || value === undefined) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }

  const num = Number(value);
  if (isNaN(num)) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} must be a number` }],
    };
  }

  if (num < min || num > max) {
    return {
      valid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be between ${min} and ${max}`,
        },
      ],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: any,
  minLength: number,
  maxLength: number,
  fieldName: string
): ValidationResult {
  if (!value) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }

  const str = String(value);
  if (str.length < minLength || str.length > maxLength) {
    return {
      valid: false,
      errors: [
        {
          field: fieldName,
          message: `${fieldName} must be between ${minLength} and ${maxLength} characters`,
        },
      ],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate UUID format
 */
export function validateUUID(value: any, fieldName: string): ValidationResult {
  if (!value) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: `${fieldName} is required` }],
    };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(String(value))) {
    return {
      valid: false,
      errors: [{ field: fieldName, message: 'Invalid UUID format' }],
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Combine multiple validation results
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Format validation errors into a single error message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return `Multiple errors: ${errors.map((e) => e.message).join('; ')}`;
}

/**
 * Create a validation error object
 */
export function createValidationError(field: string, message: string): ValidationError {
  return { field, message };
}

/**
 * Check if validation result has specific field error
 */
export function hasFieldError(result: ValidationResult, fieldName: string): boolean {
  return result.errors.some((e) => e.field === fieldName);
}

/**
 * Get errors for a specific field
 */
export function getFieldErrors(result: ValidationResult, fieldName: string): string[] {
  return result.errors.filter((e) => e.field === fieldName).map((e) => e.message);
}
