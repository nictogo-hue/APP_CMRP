'use client'

import { useExamNavigation } from '../hooks/useExamNavigation'

interface ExamNavigationProps {
  onSubmit: () => void
  isSubmitting: boolean
}

export function ExamNavigation({ onSubmit, isSubmitting }: ExamNavigationProps) {
  const nav = useExamNavigation()
  if (!nav) return null

  const {
    currentIndex,
    totalQuestions,
    answeredCount,
    flaggedCount,
    unansweredCount,
    questionStatuses,
    goTo,
    goToNext,
    goToPrev,
    isFirst,
    isLast,
  } = nav

  const statusStyles = {
    answered:   'bg-accent-500 text-white border-accent-500',
    flagged:    'bg-warning-500 text-white border-warning-500',
    unanswered: 'bg-surface text-foreground-secondary border-border hover:border-primary-300',
  }

  return (
    <div className="bg-surface rounded-2xl shadow-card border border-border p-5 space-y-5">

      {/* Resumen */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Navegación</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-accent-50 p-2">
            <p className="text-lg font-bold text-accent-500">{answeredCount}</p>
            <p className="text-xs text-foreground-muted">Respondidas</p>
          </div>
          <div className="rounded-lg bg-border-light p-2">
            <p className="text-lg font-bold text-foreground-secondary">{unansweredCount}</p>
            <p className="text-xs text-foreground-muted">Pendientes</p>
          </div>
          <div className="rounded-lg bg-warning-50 p-2">
            <p className="text-lg font-bold text-warning-700">{flaggedCount}</p>
            <p className="text-xs text-foreground-muted">Revisión</p>
          </div>
        </div>
      </div>

      {/* Grilla de preguntas */}
      <div>
        <p className="text-xs text-foreground-muted mb-2">
          Pregunta {currentIndex + 1} de {totalQuestions}
        </p>
        <div className="grid grid-cols-10 gap-1">
          {questionStatuses.map(({ index, status }) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir a pregunta ${index + 1} — ${status}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              className={`
                w-full aspect-square text-xs font-medium rounded border-2 transition-all
                ${statusStyles[status]}
                ${index === currentIndex ? 'ring-2 ring-offset-1 ring-primary-500 scale-110 z-10' : ''}
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {[
            { color: 'bg-accent-500', label: 'Respondida' },
            { color: 'bg-warning-500', label: 'En revisión' },
            { color: 'bg-border border border-border-dark', label: 'Sin responder' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-sm ${color}`} />
              <span className="text-xs text-foreground-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={goToPrev}
          disabled={isFirst}
          className="flex-1 py-2 px-3 text-sm font-medium rounded-xl border border-border text-foreground-secondary hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={isLast}
          className="flex-1 py-2 px-3 text-sm font-medium rounded-xl border border-border text-foreground-secondary hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente →
        </button>
      </div>

      {/* Botón de entregar */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="
          w-full py-3 px-4 rounded-xl font-semibold text-sm text-white
          bg-gradient-to-r from-primary-500 to-accent-500
          hover:from-primary-600 hover:to-accent-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all shadow-sm hover:shadow-md
          flex items-center justify-center gap-2
        "
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Entregando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Entregar examen
          </>
        )}
      </button>

      {unansweredCount > 0 && (
        <p className="text-xs text-warning-700 text-center">
          Tienes {unansweredCount} pregunta{unansweredCount !== 1 ? 's' : ''} sin responder
        </p>
      )}
    </div>
  )
}
