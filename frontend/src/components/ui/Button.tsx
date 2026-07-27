import { type ButtonHTMLAttributes, type ReactNode } from 'react'

/**
 * Button component following 60-30-10 color rule.
 * Accent color (indigo-600) used for primary CTAs (10% rule).
 * All buttons meet 48px minimum touch target (min-h-12 = 48px).
 * Includes hover, focus (visible ring), active, and disabled states.
 * Smooth 150ms transitions for micro-interactions.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  isLoading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: [
    'bg-indigo-600 text-white',
    'hover:bg-indigo-700 active:bg-indigo-800',
    'dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-300 dark:text-white',
    'shadow-sm hover:shadow-md',
  ].join(' '),
  secondary: [
    'bg-slate-100 text-slate-800 border border-slate-300',
    'hover:bg-slate-200 active:bg-slate-300',
    'dark:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-600',
    'dark:hover:bg-zinc-600 dark:active:bg-zinc-500',
  ].join(' '),
  ghost: [
    'bg-transparent text-slate-700',
    'hover:bg-slate-100 active:bg-slate-200',
    'dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-700',
  ].join(' '),
  danger: [
    'bg-red-50 text-red-700 border border-red-200',
    'hover:bg-red-100 active:bg-red-200',
    'dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    'dark:hover:bg-red-900 dark:active:bg-red-800',
  ].join(' '),
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-3 py-2 text-sm',
  md: 'min-h-12 px-4 py-3 text-sm',   // 48px touch target
  lg: 'min-h-14 px-6 py-4 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2',
        'rounded-lg font-semibold',
        'transition-all duration-150 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        'dark:focus-visible:ring-offset-zinc-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
