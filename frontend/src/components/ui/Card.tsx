import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

const Card = ({ className, padding = 'md', children, ...props }: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  return (
    <div
      className={cn('card-base', paddingStyles[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ className, children, ...props }: CardHeaderProps) => (
  <div className={cn('border-b border-gray-200 pb-4 mb-4', className)} {...props}>
    {children}
  </div>
)

const CardBody = ({ className, children, ...props }: CardBodyProps) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
)

const CardFooter = ({ className, children, ...props }: CardFooterProps) => (
  <div className={cn('border-t border-gray-200 pt-4 mt-4', className)} {...props}>
    {children}
  </div>
)

const CardTitle = ({ className, children, ...props }: CardHeaderProps) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props}>
    {children}
  </h3>
)

const CardContent = ({ className, children, ...props }: CardBodyProps) => (
  <div className={cn('pt-0', className)} {...props}>
    {children}
  </div>
)

const CardDescription = ({ className, children, ...props }: CardHeaderProps) => (
  <p className={cn('text-sm text-muted-foreground', className)} {...props}>
    {children}
  </p>
)

export { Card, CardHeader, CardBody, CardFooter, CardTitle, CardContent, CardDescription }