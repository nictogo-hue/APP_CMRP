'use client'

import { useExamStore, selectCurrentAnswer, selectAnsweredCount, selectFlaggedCount } from '../store/examStore'
import type { AnswerLetter } from '../types'

/**
 * Hook de navegación — expone todo lo que necesita la UI del wizard.
 * Se mantiene separado del timer/submit para tener responsabilidades claras.
 */
export function useExamNavigation() {
  const session       = useExamStore((s) => s.session)
  const currentIndex  = useExamStore((s) => s.currentIndex)
  const answers       = useExamStore((s) => s.answers)
  const flagged       = useExamStore((s) => s.flagged)
  const currentAnswer = useExamStore(selectCurrentAnswer)
  const answeredCount = useExamStore(selectAnsweredCount)
  const flaggedCount  = useExamStore(selectFlaggedCount)

  const goTo     = useExamStore((s) => s.goTo)
  const goToNext = useExamStore((s) => s.goToNext)
  const goToPrev = useExamStore((s) => s.goToPrev)
  const selectAnswer = useExamStore((s) => s.selectAnswer)
  const toggleFlagStore = useExamStore((s) => s.toggleFlag)

  if (!session) {
    return null
  }

  const totalQuestions = session.answers.length
  const currentQuestion = currentAnswer?.question ?? null
  const selectedAnswer: AnswerLetter | null = currentQuestion
    ? (answers[currentQuestion.id] ?? null)
    : null
  const isCurrentFlagged: boolean = currentQuestion
    ? (flagged[currentQuestion.id] ?? false)
    : false

  /**
   * Estado de cada pregunta para el mapa de navegación.
   * 'answered' | 'flagged' | 'unanswered'
   */
  const questionStatuses = session.answers.map((a) => ({
    index: a.question_order - 1,
    questionId: a.question_id,
    status: (
      flagged[a.question_id]
        ? 'flagged'
        : answers[a.question_id] != null
          ? 'answered'
          : 'unanswered'
    ) as 'answered' | 'flagged' | 'unanswered',
  }))

  return {
    // Estado actual
    currentIndex,
    currentQuestion,
    selectedAnswer,
    isCurrentFlagged,
    totalQuestions,
    answeredCount,
    flaggedCount,
    unansweredCount: totalQuestions - answeredCount,
    isFirst: currentIndex === 0,
    isLast: currentIndex === totalQuestions - 1,

    // Mapa de estado por pregunta (para la grilla de navegación)
    questionStatuses,

    // Acciones
    goTo,
    goToNext,
    goToPrev,
    selectAnswer,
    toggleFlag: toggleFlagStore,
  }
}
