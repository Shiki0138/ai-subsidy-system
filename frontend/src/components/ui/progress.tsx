"use client"

import * as React from "react"
// import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../utils/cn"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
        style={{ width: `${value || 0}%` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }