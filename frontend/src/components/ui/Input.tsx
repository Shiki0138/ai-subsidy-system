import React, { forwardRef, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  rightIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  showCharCount?: boolean;
  isLoading?: boolean;
  variant?: 'default' | 'filled' | 'flushed';
  size?: 'sm' | 'md' | 'lg';
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  minRows?: number;
  maxRows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
  placeholder?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    icon: Icon,
    rightIcon: RightIcon,
    showCharCount = false,
    isLoading = false,
    variant = 'default',
    size = 'md',
    type = 'text',
    className,
    maxLength,
    value = '',
    disabled,
    required,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const currentLength = String(value).length;

    const inputSizes = {
      sm: 'h-8 text-sm px-3',
      md: 'h-10 text-sm px-3',
      lg: 'h-12 text-base px-4'
    };

    const variants = {
      default: 'input-base',
      filled: 'border-0 rounded-lg bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500',
      flushed: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-blue-500'
    };

    const baseInputClasses = cn(
      'w-full transition-all duration-200 placeholder-gray-400',
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      inputSizes[size],
      variants[variant],
      {
        'border-red-500 focus:border-red-500 focus:ring-red-500': error,
        'pl-10': Icon,
        'pr-10': RightIcon || isPassword,
      },
      className
    );

    const labelClasses = cn(
      'block text-sm font-medium mb-1',
      {
        'text-gray-700': !error,
        'text-red-700': error,
      }
    );

    return (
      <div className="w-full">
        {label && (
          <label className={labelClasses}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              <Icon className="w-5 h-5" />
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            value={value}
            maxLength={maxLength}
            disabled={disabled || isLoading}
            required={required}
            className={baseInputClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            )}

            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            )}

            {RightIcon && !isPassword && (
              <div className="text-gray-400 pointer-events-none">
                <RightIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-start mt-1">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>

          {showCharCount && maxLength && (
            <p className={cn(
              'text-xs ml-2 flex-shrink-0',
              {
                'text-gray-500': currentLength < maxLength * 0.8,
                'text-yellow-600': currentLength >= maxLength * 0.8 && currentLength < maxLength,
                'text-red-600': currentLength >= maxLength,
              }
            )}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    helperText,
    showCharCount = false,
    minRows = 3,
    maxRows = 10,
    resize = 'vertical',
    className,
    maxLength,
    value = '',
    disabled,
    required,
    ...props
  }, ref) => {
    const currentLength = String(value).length;

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize'
    };

    const baseTextareaClasses = cn(
      'w-full px-3 py-2 text-sm transition-all duration-200',
      'border border-gray-300 rounded-lg bg-white placeholder-gray-400',
      'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      resizeClasses[resize],
      {
        'border-red-500 focus:border-red-500 focus:ring-red-500': error,
      },
      className
    );

    const labelClasses = cn(
      'block text-sm font-medium mb-1',
      {
        'text-gray-700': !error,
        'text-red-700': error,
      }
    );

    return (
      <div className="w-full">
        {label && (
          <label className={labelClasses}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          rows={minRows}
          className={baseTextareaClasses}
          style={{
            minHeight: `${minRows * 1.5}rem`,
            maxHeight: maxRows ? `${maxRows * 1.5}rem` : undefined,
          }}
          {...props}
        />

        <div className="flex justify-between items-start mt-1">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>

          {showCharCount && maxLength && (
            <p className={cn(
              'text-xs ml-2 flex-shrink-0',
              {
                'text-gray-500': currentLength < maxLength * 0.8,
                'text-yellow-600': currentLength >= maxLength * 0.8 && currentLength < maxLength,
                'text-red-600': currentLength >= maxLength,
              }
            )}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    helperText,
    options = [],
    placeholder,
    className,
    disabled,
    required,
    children,
    ...props
  }, ref) => {
    const baseSelectClasses = cn(
      'w-full h-10 px-3 text-sm transition-all duration-200',
      'border border-gray-300 rounded-lg bg-white',
      'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      'appearance-none cursor-pointer',
      {
        'border-red-500 focus:border-red-500 focus:ring-red-500': error,
      },
      className
    );

    const labelClasses = cn(
      'block text-sm font-medium mb-1',
      {
        'text-gray-700': !error,
        'text-red-700': error,
      }
    );

    return (
      <div className="w-full">
        {label && (
          <label className={labelClasses}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            required={required}
            className={baseSelectClasses}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {children}
          </select>

          {/* Select Arrow */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {(error || helperText) && (
          <div className="mt-1">
            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
Textarea.displayName = 'Textarea';
Select.displayName = 'Select';

export { Input, Textarea, Select };