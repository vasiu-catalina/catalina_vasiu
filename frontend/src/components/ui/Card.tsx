import { type HTMLAttributes, type ReactNode } from 'react'

/**
 * Card component — secondary color (30% rule).
 * Used for structural elements: content groups, data sections.
 * Consistent border-radius (16px), subtle border, and shadow.
 * 8px grid padding: 24px (3 * 8px).
 */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'interactive'
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const base = [
    'rounded-2xl p-6',
    'bg-white border border-slate-200',
    'dark:bg-zinc-800 dark:border-zinc-700',
  ].join(' ')

  const variants = {
    default: 'shadow-sm',
    elevated: 'shadow-lg',
    interactive: [
      'shadow-sm cursor-pointer',
      'transition-all duration-150',
      'hover:shadow-md hover:-translate-y-0.5',
      'active:translate-y-0',
    ].join(' '),
  }

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  )
}
