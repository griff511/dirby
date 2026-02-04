'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          {
            'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900':
              variant === 'default',
            'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100':
              variant === 'secondary',
            'border border-zinc-200 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100':
              variant === 'outline',
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100':
              variant === 'destructive',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
