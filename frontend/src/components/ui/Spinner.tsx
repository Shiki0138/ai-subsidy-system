import React from 'react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white' | 'gray';
  className?: string;
  label?: string;
}

const spinnerSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const spinnerVariants = {
  default: 'text-blue-600',
  primary: 'text-blue-600',
  white: 'text-white',
  gray: 'text-gray-600'
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  label = '読み込み中...'
}) => {
  return (
    <div className="inline-flex items-center">
      <svg
        className={cn(
          'animate-spin',
          spinnerSizes[size],
          spinnerVariants[variant],
          className
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-label={label}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Dots Spinner
export const DotsSpinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  label = '読み込み中...'
}) => {
  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  return (
    <div className={cn('inline-flex space-x-1', className)} role="status" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            dotSizes[size],
            spinnerVariants[variant]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Pulse Spinner
export const PulseSpinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  label = '読み込み中...'
}) => {
  return (
    <div
      className={cn(
        'rounded-full animate-ping',
        spinnerSizes[size],
        spinnerVariants[variant],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};