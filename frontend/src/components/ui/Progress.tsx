import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  showPercentage?: boolean;
  showLabel?: boolean;
  label?: string;
  striped?: boolean;
  animated?: boolean;
  className?: string;
}

const progressSizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
  xl: 'h-4'
};

const progressVariants = {
  default: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  error: 'bg-red-600',
  info: 'bg-indigo-600'
};

const backgroundVariants = {
  default: 'bg-blue-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  error: 'bg-red-100',
  info: 'bg-indigo-100'
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  showPercentage = false,
  showLabel = true,
  label,
  striped = false,
  animated = false,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayValue = Math.round(percentage);

  const containerClasses = cn(
    'w-full rounded-full overflow-hidden',
    progressSizes[size],
    backgroundVariants[variant],
    className
  );

  const progressClasses = cn(
    'h-full transition-all duration-300 ease-out rounded-full',
    progressVariants[variant],
    {
      'bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:30px_100%] animate-pulse': striped && animated,
      'bg-gradient-to-r from-current via-white/20 to-current bg-[length:20px_100%]': striped && !animated,
    }
  );

  // 動的な色変更（値に基づく）
  const getDynamicVariant = () => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'default';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  const dynamicVariant = variant === 'default' ? getDynamicVariant() : variant;

  return (
    <div className="w-full">
      {/* Label and Value */}
      {(showLabel && (label || showValue || showPercentage)) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {(showValue || showPercentage) && (
            <span className="text-sm text-gray-500">
              {showValue && `${value}/${max}`}
              {showValue && showPercentage && ' '}
              {showPercentage && `(${displayValue}%)`}
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div 
        className={cn(
          containerClasses,
          backgroundVariants[dynamicVariant]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `進捗: ${displayValue}%`}
      >
        <div
          className={cn(
            progressClasses,
            progressVariants[dynamicVariant]
          )}
          style={{
            width: `${percentage}%`,
            transition: 'width 0.3s ease-out'
          }}
        />
      </div>

      {/* Screen Reader Only Text */}
      <span className="sr-only">
        {label && `${label}: `}
        {displayValue}% 完了
      </span>
    </div>
  );
};

// Circular Progress Component
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showValue?: boolean;
  label?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  label,
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colors = {
    default: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#6366F1'
  };

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          
          {/* Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors[variant]}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Content */}
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-semibold text-gray-700">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <span className="mt-2 text-sm font-medium text-gray-700 text-center">
          {label}
        </span>
      )}
    </div>
  );
};