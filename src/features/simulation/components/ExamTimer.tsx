'use client'

import { useExamStore, selectFormattedTime } from '../store/examStore'

interface ExamTimerProps {
  className?: string
}

export function ExamTimer({ className = '' }: ExamTimerProps) {
  const secondsRemaining = useExamStore((s) => s.secondsRemaining)
  const formattedTime = useExamStore(selectFormattedTime)

  const isWarning = secondsRemaining <= 1800 && secondsRemaining > 600  // < 30 min
  const isDanger  = secondsRemaining <= 600                              // < 10 min

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-semibold text-lg
        transition-colors duration-500
        ${isDanger
          ? 'bg-error-50 text-error-600 border border-error-500 animate-pulse'
          : isWarning
            ? 'bg-warning-50 text-warning-700 border border-warning-500'
            : 'bg-primary-50 text-primary-500 border border-primary-200'
        }
        ${className}
      `}
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
        <polyline points="12 6 12 12 16 14" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span aria-label={`Tiempo restante: ${formattedTime}`}>{formattedTime}</span>
    </div>
  )
}
