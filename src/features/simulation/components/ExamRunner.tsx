'use client'

import { useState } from 'react'
import { useExamSession } from '../hooks/useExamSession'
import { useExamNavigation } from '../hooks/useExamNavigation'
import { QuestionCard } from './QuestionCard'
import { ExamTimer } from './ExamTimer'
import { ExamProgressBar } from './ExamProgressBar'
import { ExamNavigation } from './ExamNavigation'
import type { AnswerLetter } from '../types'

interface ExamRunnerProps {
  sessionId: string
}

export function ExamRunner({ sessionId }: ExamRunnerProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    isLoaded,
    isSubmitting,
    submitError,
    handleSelectAnswer,
    handleToggleFlag,
    handleSubmit,
  } = useExamSession({ sessionId })

  const nav = useExamNavigation()

  // ─── Loading ─────────────────────────────────────────────
  if (!isLoaded || !nav) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-accent-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-foreground-secondary font-medium">Cargando examen...</p>
        </div>
      </div>
    )
  }

  const { currentQuestion, selectedAnswer, isCurrentFlagged, currentIndex, totalQuestions } = nav

  if (!currentQuestion) return null

  const handleSelectAnswerWrapper = (answer: AnswerLetter) => {
    handleSelectAnswer(currentQuestion.id, answer)
  }

  const handleToggleFlagWrapper = () => {
    handleToggleFlag(currentQuestion.id, isCurrentFlagged)
  }

  const handleSubmitClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmSubmit = () => {
    setShowConfirm(false)
    handleSubmit(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header fijo con timer + progreso */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">Simulacro CMRP</p>
              <p className="text-xs text-foreground-muted">{totalQuestions} preguntas</p>
            </div>
          </div>

          <div className="flex-1 max-w-xs hidden sm:block">
            <ExamProgressBar />
          </div>

          <ExamTimer />
        </div>

        {/* Barra de progreso mobile */}
        <div className="sm:hidden px-4 pb-2">
          <ExamProgressBar />
        </div>
      </header>

      {/* Cuerpo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Pregunta — 2/3 del ancho */}
          <div className="lg:col-span-2">
            {submitError && (
              <div className="mb-4 p-4 rounded-xl bg-error-50 border border-error-500 text-error-700 text-sm">
                {submitError}
              </div>
            )}
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={selectedAnswer}
              isFlagged={isCurrentFlagged}
              onSelectAnswer={handleSelectAnswerWrapper}
              onToggleFlag={handleToggleFlagWrapper}
            />

            {/* Botones de navegación mobile */}
            <div className="flex gap-3 mt-4 lg:hidden">
              <button
                type="button"
                onClick={nav.goToPrev}
                disabled={nav.isFirst}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-border text-foreground-secondary hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                type="button"
                onClick={nav.goToNext}
                disabled={nav.isLast}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-border text-foreground-secondary hover:bg-border-light disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>

          {/* Panel lateral con navegación — 1/3 del ancho */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <ExamNavigation
                onSubmit={handleSubmitClick}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Botón de entrega mobile */}
        <div className="lg:hidden mt-6">
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className="
              w-full py-3.5 px-4 rounded-xl font-semibold text-white
              bg-gradient-to-r from-primary-500 to-accent-500
              hover:from-primary-600 hover:to-accent-600
              disabled:opacity-50 transition-all shadow-sm
            "
          >
            {isSubmitting ? 'Entregando...' : 'Entregar examen'}
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-modal p-6 max-w-md w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-warning-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">¿Entregar el examen?</h3>
                <p className="text-sm text-foreground-secondary mt-1">
                  Tienes <strong>{nav.answeredCount}</strong> de <strong>{totalQuestions}</strong> preguntas respondidas.
                  {nav.unansweredCount > 0 && (
                    <span className="text-warning-700"> Las {nav.unansweredCount} sin responder quedarán vacías.</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground-secondary font-medium hover:bg-border-light transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
              >
                Sí, entregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
