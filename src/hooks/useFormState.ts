/**
 * Custom Hook: useFormState
 * Manages form state with validation, error handling, and submission
 */

import { useState, useCallback, useRef } from 'react';

export interface FormError {
  field: string;
  message: string;
}

export type ValidationRule<T> = (value: any, formValues: T) => string | true;

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T> | ValidationRule<T>[];
};

interface UseFormStateOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => Promise<void> | void;
  validate?: ValidationRules<T>;
  onSuccess?: () => void;
}

/**
 * Hook for comprehensive form state management
 * 
 * Usage:
 * ```typescript
 * const form = useFormState({
 *   initialValues: { email: '', password: '' },
 *   validate: {
 *     email: (value) => !value.includes('@') ? 'Invalid email' : true,
 *   },
 *   onSubmit: async (values) => {
 *     await submitForm(values);
 *   },
 * });
 * 
 * <input value={form.values.email} onChange={form.handleChange} />
 * ```
 */
export function useFormState<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  onSuccess,
}: UseFormStateOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [touched, setTouched] = useState<Set<keyof T>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValuesRef = useRef(initialValues);

  const validateField = useCallback(
    (fieldName: keyof T, fieldValue: any): string | null => {
      if (!validate) return null;

      const rules = validate[fieldName];
      if (!rules) return null;

      const ruleArray = Array.isArray(rules) ? rules : [rules];

      for (const rule of ruleArray) {
        const result = rule(fieldValue, values);
        if (result !== true) {
          return result;
        }
      }

      return null;
    },
    [validate, values]
  );

  const validateAllFields = useCallback((): boolean => {
    const newErrors = new Map<string, string>();
    let isValid = true;

    Object.keys(values).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T, values[fieldName as keyof T]);
      if (error) {
        newErrors.set(fieldName, error);
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value, type } = e.target;
      const fieldName = name as keyof T;

      // Handle checkbox and radio differently
      const fieldValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [fieldName]: fieldValue,
      }));

      // Clear error when user starts typing
      if (errors.has(String(fieldName))) {
        const newErrors = new Map(errors);
        newErrors.delete(String(fieldName));
        setErrors(newErrors);
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (
      e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name } = e.target;
      const fieldName = name as keyof T;

      setTouched((prev) => new Set([...prev, fieldName]));

      // Validate on blur
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        const newErrors = new Map(errors);
        newErrors.set(String(fieldName), error);
        setErrors(newErrors);
      }
    },
    [errors, values, validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateAllFields()) {
        return;
      }

      setIsSubmitting(true);

      try {
        if (onSubmit) {
          await onSubmit(values);
        }
        onSuccess?.();
      } catch (error) {
        // onSubmit should handle its own errors
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAllFields, onSubmit, onSuccess]
  );

  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  const setFieldError = useCallback((fieldName: keyof T, error: string | null) => {
    setErrors((prev) => {
      const newErrors = new Map(prev);
      if (error) {
        newErrors.set(String(fieldName), error);
      } else {
        newErrors.delete(String(fieldName));
      }
      return newErrors;
    });
  }, []);

  const resetForm = useCallback((newValues?: Partial<T>) => {
    setValues({ ...initialValuesRef.current, ...newValues });
    setErrors(new Map());
    setTouched(new Set());
  }, []);

  const getFieldProps = useCallback(
    (fieldName: keyof T) => ({
      name: String(fieldName),
      value: values[fieldName],
      onChange: handleChange,
      onBlur: handleBlur,
      error: touched.has(fieldName) ? errors.get(String(fieldName)) : undefined,
    }),
    [values, handleChange, handleBlur, errors, touched]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    getFieldProps,
    isValid: errors.size === 0,
    isDirty:
      JSON.stringify(values) !== JSON.stringify(initialValuesRef.current),
  };
}
