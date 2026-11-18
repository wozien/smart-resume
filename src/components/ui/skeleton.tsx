'use client'

import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-[#E7E9F3]/75 dark:bg-[#23283B]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
