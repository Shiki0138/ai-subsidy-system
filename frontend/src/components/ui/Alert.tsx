import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  variant?: 'filled' | 'outlined' | 'subtle' | 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClose?: () => void;
  closable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const alertVariants = {
  info: {
    filled: 'bg-blue-600 text-white border-blue-600',
    outlined: 'bg-white text-blue-800 border-blue-300',
    subtle: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  success: {
    filled: 'bg-green-600 text-white border-green-600',
    outlined: 'bg-white text-green-800 border-green-300',
    subtle: 'bg-green-50 text-green-800 border-green-200'
  },
  warning: {
    filled: 'bg-yellow-600 text-white border-yellow-600',
    outlined: 'bg-white text-yellow-800 border-yellow-300',
    subtle: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  },
  error: {
    filled: 'bg-red-600 text-white border-red-600',
    outlined: 'bg-white text-red-800 border-red-300',
    subtle: 'bg-red-50 text-red-800 border-red-200'
  }
};

const iconVariants = {
  info: {
    filled: 'text-white',
    outlined: 'text-blue-600',
    subtle: 'text-blue-600'
  },
  success: {
    filled: 'text-white',
    outlined: 'text-green-600',
    subtle: 'text-green-600'
  },
  warning: {
    filled: 'text-white',
    outlined: 'text-yellow-600',
    subtle: 'text-yellow-600'
  },
  error: {
    filled: 'text-white',
    outlined: 'text-red-600',
    subtle: 'text-red-600'
  }
};

const alertSizes = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-sm',
  lg: 'p-6 text-base'
};

const defaultIcons = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon
};

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  variant = 'subtle',
  title,
  children,
  icon: CustomIcon,
  onClose,
  closable = false,
  size = 'md',
  className,
}) => {
  // If variant is a type (error, success, etc.), use it as type and default to subtle
  const resolvedType = ['info', 'success', 'warning', 'error'].includes(variant as string) ? variant as 'info' | 'success' | 'warning' | 'error' : type;
  const resolvedVariant = ['filled', 'outlined', 'subtle'].includes(variant as string) ? variant as 'filled' | 'outlined' | 'subtle' : 'subtle';
  
  const Icon = CustomIcon || defaultIcons[resolvedType];

  const alertClasses = cn(
    'rounded-lg border flex items-start space-x-3 transition-all duration-200',
    alertVariants[resolvedType][resolvedVariant],
    alertSizes[size],
    className
  );

  const iconClasses = cn(
    'flex-shrink-0 w-5 h-5 mt-0.5',
    iconVariants[resolvedType][resolvedVariant]
  );

  const closeButtonClasses = cn(
    'flex-shrink-0 ml-auto -m-1 p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'text-white hover:bg-white/20 focus:ring-white': resolvedVariant === 'filled',
      'text-gray-400 hover:text-gray-600 focus:ring-gray-500': resolvedVariant !== 'filled',
    }
  );

  return (
    <div className={alertClasses} role="alert">
      {/* Icon */}
      <Icon className={iconClasses} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-medium mb-1">
            {title}
          </h3>
        )}
        <div className={cn({ 'text-sm opacity-90': resolvedVariant === 'filled' })}>
          {children}
        </div>
      </div>

      {/* Close Button */}
      {(closable || onClose) && (
        <button
          type="button"
          onClick={onClose}
          className={closeButtonClasses}
          aria-label="閉じる"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Specific alert components for convenience
export const InfoAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="info" {...props} />
);

export const SuccessAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="success" {...props} />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="warning" {...props} />
);

export const ErrorAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="error" {...props} />
);

// shadcn/ui style exports
export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn('text-sm', className)}>
    {children}
  </div>
);