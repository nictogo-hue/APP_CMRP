import type {
  SessionAnswerWithQuestion,
  PillarScore,
  ExamResults,
  ExamSession,
  PillarCode,
} from '../types'
import { PILLAR_CODES, PILLAR_NAMES, EXAM_CONSTANTS } from '../types'

/**
 * Calcula el score total y por pilar dado un array de respuestas con preguntas.
 * Lógica pura — sin side effects, testeable de forma aislada.
 */
export function calculateScores(
  answers: SessionAnswerWithQuestion[]
): {
  score_total: number
  score_pillar_1: number
  score_pillar_2: number
  score_pillar_3: number
  score_pillar_4: number
  score_pillar_5: number
  pillar_scores: PillarScore[]
  total_correct: number
} {
  let total_correct = 0

  // Contadores por pilar: { '1.0': { correct: 0, total: 0 }, ... }
  const pillarCounters: Record<PillarCode, { correct: number; total: number }> = {
    '1.0': { correct: 0, total: 0 },
    '2.0': { correct: 0, total: 0 },
    '3.0': { correct: 0, total: 0 },
    '4.0': { correct: 0, total: 0 },
    '5.0': { correct: 0, total: 0 },
  }

  for (const answer of answers) {
    const pillar = answer.question.pillar_code as PillarCode
    const isCorrect = answer.selected_answer === answer.question.correct_answer

    pillarCounters[pillar].total++
    if (isCorrect) {
      pillarCounters[pillar].correct++
      total_correct++
    }
  }

  const total = answers.length || 1 // Evitar división por cero
  const score_total = Math.round((total_correct / total) * 100 * 100) / 100

  const pct = (p: PillarCode) => {
    const { correct, total: t } = pillarCounters[p]
    return t === 0 ? 0 : Math.round((correct / t) * 100 * 100) / 100
  }

  const pillar_scores: PillarScore[] = PILLAR_CODES.map((code) => ({
    code,
    name: PILLAR_NAMES[code],
    correct: pillarCounters[code].correct,
    total: pillarCounters[code].total,
    percentage: pct(code),
  }))

  return {
    score_total,
    score_pillar_1: pct('1.0'),
    score_pillar_2: pct('2.0'),
    score_pillar_3: pct('3.0'),
    score_pillar_4: pct('4.0'),
    score_pillar_5: pct('5.0'),
    pillar_scores,
    total_correct,
  }
}

/**
 * Construye el objeto ExamResults completo a partir de una sesión y sus respuestas.
 */
export function buildExamResults(
  session: ExamSession,
  answers: SessionAnswerWithQuestion[]
): ExamResults {
  const {
    score_total,
    pillar_scores,
    total_correct,
  } = calculateScores(answers)

  return {
    session,
    score_total,
    pillar_scores,
    answers,
    passed: score_total >= EXAM_CONSTANTS.PASSING_SCORE,
    total_correct,
    total_questions: answers.length,
  }
}
