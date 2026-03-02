'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ExamResults, AnswerLetter } from '../types'
import { EXAM_CONSTANTS } from '../types'
import { TutorExplainer } from '@/features/tutor/components/TutorExplainer'

const ANSWER_LABELS: Record<AnswerLetter, string> = {
  A: 'option_a',
  B: 'option_b',
  C: 'option_c',
  D: 'option_d',
}

const PILLAR_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  '1.0': { bar: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
  '2.0': { bar: 'bg-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-700'   },
  '3.0': { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' },
  '4.0': { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  '5.0': { bar: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700'  },
}

interface ExamResultsProps {
  results: ExamResults
}

export function ExamResults({ results }: ExamResultsProps) {
  const [showIncorrect, setShowIncorrect] = useState(false)

  const { score_total, pillar_scores, answers, passed, total_correct, total_questions } = results

  const incorrectAnswers = answers.filter((a) => !a.is_correct)
  const statusLabel      = results.session.status === 'timed_out' ? 'Tiempo agotado' : 'Completado'

  // Formato de duración
  const startedAt   = new Date(results.session.started_at)
  const submittedAt = new Date(results.session.submitted_at ?? Date.now())
  const durationMs  = submittedAt.getTime() - startedAt.getTime()
  const durationMin = Math.floor(durationMs / 60000)
  const durationSec = Math.floor((durationMs % 60000) / 1000)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-foreground-muted mb-6">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-foreground">Resultados del Simulacro</span>
        </div>
        <h1 className="text-display-sm text-foreground">Resultados del Examen</h1>
        <p className="text-foreground-secondary mt-1">{statusLabel} · {durationMin}m {durationSec}s</p>
      </div>

      {/* Score principal */}
      <div className={`
        rounded-2xl p-8 text-center border-2 relative overflow-hidden
        ${passed
          ? 'bg-success-50 border-success-500'
          : 'bg-error-50 border-error-500'
        }
      `}>
        {/* Badge aprobado / reprobado */}
        <div className={`
          inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4
          ${passed ? 'bg-success-500 text-white' : 'bg-error-500 text-white'}
        `}>
          {passed ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              APROBADO
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              NO APROBADO
            </>
          )}
        </div>

        <p className={`text-7xl font-black mb-2 ${passed ? 'text-success-600' : 'text-error-600'}`}>
          {score_total.toFixed(1)}%
        </p>
        <p className="text-foreground-secondary">
          {total_correct} respuestas correctas de {total_questions} preguntas
        </p>
        <p className="text-sm text-foreground-muted mt-1">
          Mínimo para aprobar: {EXAM_CONSTANTS.PASSING_SCORE}%
        </p>
      </div>

      {/* Scores por pilar */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
        <h2 className="text-base font-semibold text-foreground mb-5">Rendimiento por Pilar SMRP</h2>
        <div className="space-y-4">
          {pillar_scores.map((pillar) => {
            const colors = PILLAR_COLORS[pillar.code] ?? { bar: 'bg-gray-500', bg: 'bg-gray-50', text: 'text-gray-700' }
            const isPillarPassing = pillar.percentage >= EXAM_CONSTANTS.PASSING_SCORE

            return (
              <div key={pillar.code}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {pillar.code}
                    </span>
                    <span className="text-sm font-medium text-foreground">{pillar.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted">
                      {pillar.correct}/{pillar.total}
                    </span>
                    <span className={`text-sm font-bold ${isPillarPassing ? 'text-success-600' : 'text-error-600'}`}>
                      {pillar.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                    style={{ width: `${pillar.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Línea de mínimo */}
        <div className="mt-4 flex items-center gap-2 text-xs text-foreground-muted">
          <div className="w-4 h-px border-t-2 border-dashed border-foreground-muted" />
          <span>Línea de aprobación: {EXAM_CONSTANTS.PASSING_SCORE}%</span>
        </div>
      </div>

      {/* Respuestas incorrectas */}
      {incorrectAnswers.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowIncorrect((v) => !v)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-border-light transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-error-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Respuestas incorrectas ({incorrectAnswers.length})
                </h2>
                <p className="text-xs text-foreground-muted">
                  Revisa y aprende de cada error
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-foreground-muted transition-transform ${showIncorrect ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showIncorrect && (
            <div className="divide-y divide-border">
              {incorrectAnswers.map((answer, idx) => {
                const q = answer.question
                const correctText = q[ANSWER_LABELS[q.correct_answer] as keyof typeof q] as string
                const selectedText = answer.selected_answer
                  ? q[ANSWER_LABELS[answer.selected_answer] as keyof typeof q] as string
                  : null
                const colors = PILLAR_COLORS[q.pillar_code] ?? { bg: 'bg-gray-50', text: 'text-gray-700' }

                return (
                  <div key={answer.id} className="p-6 animate-fade-in">
                    {/* Cabecera */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-error-100 text-error-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {q.pillar_name}
                          </span>
                          <span className="text-xs text-foreground-muted">{q.question_code}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">{q.question_text}</p>
                      </div>
                    </div>

                    {/* Tu respuesta vs correcta */}
                    <div className="ml-9 space-y-2">
                      {selectedText && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-error-50 border border-error-200">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-error-500 text-white text-xs font-bold flex items-center justify-center">
                            {answer.selected_answer}
                          </span>
                          <span className="text-xs text-error-700">{selectedText}</span>
                        </div>
                      )}
                      {!selectedText && (
                        <p className="text-xs text-foreground-muted italic">Sin responder</p>
                      )}
                      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-success-50 border border-success-100">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-success-500 text-white text-xs font-bold flex items-center justify-center">
                          {q.correct_answer}
                        </span>
                        <span className="text-xs text-success-700 font-medium">{correctText}</span>
                      </div>

                      {/* Explicación */}
                      {q.explanation && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary-50 border border-primary-100">
                          <svg className="w-3.5 h-3.5 text-primary-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-primary-700">{q.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Tutor IA */}
                    {answer.selected_answer && (
                      <TutorExplainer
                        questionText={q.question_text}
                        options={{ a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d }}
                        correctAnswer={q.correct_answer.toLowerCase()}
                        userAnswer={answer.selected_answer.toLowerCase()}
                        explanation={q.explanation ?? undefined}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/exam/new"
          className="
            flex-1 py-3 px-5 rounded-xl font-semibold text-white text-center
            bg-gradient-to-r from-primary-500 to-accent-500
            hover:from-primary-600 hover:to-accent-600
            transition-all shadow-sm hover:shadow-md
          "
        >
          Nuevo simulacro
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 py-3 px-5 rounded-xl font-medium text-foreground-secondary text-center border border-border hover:bg-border-light transition-colors"
        >
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}
