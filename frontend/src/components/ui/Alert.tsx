import { type ReactNode } from 'react'

/**
 * Alert component with semantic colors for states.
 * Red for errors, Green for success, Yellow for warnings.
 * All text-to-background combos pass WCAG AA (4.5:1 contrast).
 * 8px grid: 16px padding all around.
 */

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant: AlertVariant
  children: ReactNode
  className?: string
}

const alertStyles: Record<AlertVariant, string> = {
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
}

export function Alert({ variant, children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'p-4 rounded-xl border text-sm',
        alertStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
