'use client'

import { useExamStore, selectAnsweredCount } from '../store/examStore'

export function ExamProgressBar() {
  const session       = useExamStore((s) => s.session)
  const answeredCount = useExamStore(selectAnsweredCount)

  if (!session) return null

  const total      = session.total_questions
  const percentage = Math.round((answeredCount / total) * 100)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-foreground-secondary font-medium">
          Progreso
        </span>
        <span className="text-xs text-foreground-secondary font-medium">
          {answeredCount} / {total} respondidas ({percentage}%)
        </span>
      </div>
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
    </div>
  )
}
