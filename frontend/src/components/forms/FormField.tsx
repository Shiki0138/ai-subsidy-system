import { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  children: ReactNode
  required?: boolean
  error?: string
  description?: string
  className?: string
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  rows?: number
}

export function FormField({
  label,
  children,
  required = false,
  error,
  description,
  className
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
      
      {children}
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, error, rows = 4, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical',
        error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  )
}