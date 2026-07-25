import { forwardRef, type InputHTMLAttributes } from 'react'

/**
 * Input component with proper accessibility and visual states.
 * Focus ring for keyboard navigation (WCAG requirement).
 * Error state with semantic red coloring.
 * Minimum 48px height for touch accessibility.
 * 8px grid: padding 12px vertical (rounded to grid), 16px horizontal.
 */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold text-slate-700 dark:text-zinc-200"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            'min-h-12 w-full px-4 py-3 rounded-lg text-sm',
            'border bg-white text-slate-900 placeholder:text-slate-400',
            'dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
            'dark:focus-visible:ring-offset-zinc-900',
            error
              ? 'border-red-400 dark:border-red-600'
              : 'border-slate-300 dark:border-zinc-600 hover:border-slate-400 dark:hover:border-zinc-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          ].join(' ')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500 dark:text-zinc-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
