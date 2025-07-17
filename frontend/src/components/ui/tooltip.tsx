import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  disabled?: boolean;
  showArrow?: boolean;
  className?: string;
  contentClassName?: string;
}

const placementClasses = {
  top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
};

const arrowClasses = {
  top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
  right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
};

const variantClasses = {
  dark: {
    tooltip: 'bg-gray-900 text-white',
    arrow: 'border-gray-900'
  },
  light: {
    tooltip: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
    arrow: 'border-white'
  }
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base'
};

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  variant = 'dark',
  size = 'md',
  delay = 200,
  disabled = false,
  showArrow = true,
  className,
  contentClassName,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const tooltipClasses = cn(
    'absolute z-50 rounded-md pointer-events-none transition-all duration-200 whitespace-nowrap',
    'transform-gpu', // GPU acceleration for better performance
    placementClasses[placement],
    variantClasses[variant].tooltip,
    sizeClasses[size],
    {
      'opacity-100 visible': isVisible,
      'opacity-0 invisible': !isVisible,
    },
    contentClassName
  );

  const arrowVariantClasses = cn(
    'absolute w-0 h-0 pointer-events-none',
    'border-4',
    arrowClasses[placement],
    {
      [variantClasses[variant].arrow]: placement === 'top',
      [`border-t-${variantClasses[variant].arrow.split('-')[1]}`]: placement === 'bottom',
      [`border-l-${variantClasses[variant].arrow.split('-')[1]}`]: placement === 'right',
      [`border-r-${variantClasses[variant].arrow.split('-')[1]}`]: placement === 'left',
    }
  );

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      {content && (
        <div className={tooltipClasses} role="tooltip">
          {content}
          
          {showArrow && (
            <div
              className={cn(
                'absolute w-0 h-0 pointer-events-none border-4',
                {
                  // Top placement arrow
                  'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent':
                    placement === 'top',
                  [`border-t-gray-900`]: placement === 'top' && variant === 'dark',
                  [`border-t-white`]: placement === 'top' && variant === 'light',
                  
                  // Bottom placement arrow
                  'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent':
                    placement === 'bottom',
                  [`border-b-gray-900`]: placement === 'bottom' && variant === 'dark',
                  [`border-b-white`]: placement === 'bottom' && variant === 'light',
                  
                  // Left placement arrow
                  'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent':
                    placement === 'left',
                  [`border-l-gray-900`]: placement === 'left' && variant === 'dark',
                  [`border-l-white`]: placement === 'left' && variant === 'light',
                  
                  // Right placement arrow
                  'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent':
                    placement === 'right',
                  [`border-r-gray-900`]: placement === 'right' && variant === 'dark',
                  [`border-r-white`]: placement === 'right' && variant === 'light',
                }
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Higher-order component for easier usage
export const withTooltip = <P extends object>(
  Component: React.ComponentType<P>,
  tooltipProps: Omit<TooltipProps, 'children'>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <Tooltip {...tooltipProps}>
      <Component {...(props as any)} ref={ref} />
    </Tooltip>
  ));
};