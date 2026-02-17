'use client';

/**
 * Form Validation Utility with Visual Feedback
 * Provides instant, accessible validation with clear error messages
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  idNumber?: boolean;
  custom?: (value: string) => boolean;
  message?: string;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export function validateField(value: string, rules: ValidationRule): string | undefined {
  // Required check
  if (rules.required && (!value || value.trim() === '')) {
    return rules.message || 'This field is required';
  }

  // Skip other validations if empty and not required
  if (!value || value.trim() === '') {
    return undefined;
  }

  // Email validation
  if (rules.email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return rules.message || 'Please enter a valid email address';
    }
  }

  // Phone validation (South African format)
  if (rules.phone) {
    const phonePattern = /^(\+27|0)[6-8][0-9]{8}$/;
    if (!phonePattern.test(value.replace(/\s/g, ''))) {
      return rules.message || 'Please enter a valid phone number (e.g., 0821234567)';
    }
  }

  // ID Number validation (South African)
  if (rules.idNumber) {
    const idPattern = /^\d{13}$/;
    if (!idPattern.test(value)) {
      return rules.message || 'ID number must be 13 digits';
    }
  }

  // Min length
  if (rules.minLength && value.length < rules.minLength) {
    return rules.message || `Minimum ${rules.minLength} characters required`;
  }

  // Max length
  if (rules.maxLength && value.length > rules.maxLength) {
    return rules.message || `Maximum ${rules.maxLength} characters allowed`;
  }

  // Regex pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.message || 'Invalid format';
  }

  // Custom validation
  if (rules.custom && !rules.custom(value)) {
    return rules.message || 'Invalid value';
  }

  return undefined;
}

export function validateForm(
  data: Record<string, string>,
  rules: Record<string, ValidationRule>
): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach((field) => {
    const value = data[field] || '';
    const error = validateField(value, rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

/**
 * Common validation patterns
 */
export const commonValidations = {
  required: { required: true, message: 'This field is required' },
  email: { email: true, message: 'Please enter a valid email address' },
  phone: { phone: true, message: 'Please enter a valid phone number' },
  idNumber: { idNumber: true, message: 'Please enter a valid 13-digit ID number' },
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 100,
    message: 'Name must be 2-100 characters' 
  },
  password: { 
    required: true, 
    minLength: 8,
    message: 'Password must be at least 8 characters' 
  },
};
