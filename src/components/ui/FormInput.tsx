'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    label, 
    error, 
    success, 
    helperText, 
    icon, 
    required = false,
    disabled = false,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              // Base styles
              "w-full px-3 py-2 text-sm border rounded-lg transition-colors duration-150 outline-none",
              // Light mode
              "bg-white dark:bg-slate-800",
              "border-slate-300 dark:border-slate-600",
              "text-slate-900 dark:text-white",
              "placeholder:text-slate-500 dark:placeholder:text-slate-400",
              // Focus state
              "focus:ring-2 focus:ring-offset-0 dark:focus:ring-offset-0",
              "focus-visible:ring-emerald-500/20 dark:focus-visible:ring-emerald-500/30",
              // Error state
              error && "border-red-500 dark:border-red-500 focus:ring-red-500/20",
              // Success state
              success && "border-green-500 dark:border-green-500 focus:ring-green-500/20",
              // Disabled state
              disabled && "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60",
              // Icon padding
              icon && "pl-9",
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {/* Success icon */}
          {success && !error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
          
          {/* Error icon */}
          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
