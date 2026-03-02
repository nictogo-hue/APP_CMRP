'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateScores } from './scoringService'
import type {
  ExamSession,
  ExamSessionWithAnswers,
  SessionAnswerWithQuestion,
  AnswerLetter,
} from '../types'
import { EXAM_CONSTANTS } from '../types'

/**
 * Crea una nueva sesión de examen para el usuario autenticado.
 * Selecciona 110 preguntas aleatorias del banco y crea los registros
 * de session_answers vacíos.
 *
 * Returns: { sessionId } o lanza error
 */
export async function createExamSession(): Promise<{ sessionId: string }> {
  const supabase = await createClient()

  // 1. Verificar usuario autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Usuario no autenticado')

  // 2. Seleccionar 110 preguntas aleatorias del banco
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, pillar_code')
    .eq('is_active', true)
    .order('created_at') // orden base, luego shuffle en JS
    .limit(EXAM_CONSTANTS.BANK_SIZE)

  if (qError || !questions) throw new Error('No se pudieron cargar las preguntas')

  // Shuffle Fisher-Yates y tomar 110
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const selected = shuffled.slice(0, EXAM_CONSTANTS.TOTAL_QUESTIONS)

  // 3. Crear la sesión
  const { data: session, error: sError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      status: 'in_progress',
      total_questions: EXAM_CONSTANTS.TOTAL_QUESTIONS,
      time_limit_minutes: EXAM_CONSTANTS.TIME_LIMIT_MINUTES,
    })
    .select('id')
    .single()

  if (sError || !session) throw new Error('No se pudo crear la sesión de examen')

  // 4. Crear session_answers vacíos (una fila por pregunta)
  const sessionAnswers = selected.map((q, index) => ({
    session_id: session.id,
    question_id: q.id,
    question_order: index + 1,
    selected_answer: null,
    is_flagged: false,
    is_correct: null,
    answered_at: null,
  }))

  const { error: aError } = await supabase
    .from('session_answers')
    .insert(sessionAnswers)

  if (aError) {
    // Limpiar sesión huérfana
    await supabase.from('exam_sessions').delete().eq('id', session.id)
    throw new Error('No se pudieron crear las respuestas de la sesión')
  }

  return { sessionId: session.id }
}

/**
 * Obtiene una sesión con todas sus preguntas y respuestas actuales.
 * Solo accesible para el dueño de la sesión (RLS).
 */
export async function getSessionWithQuestions(
  sessionId: string
): Promise<ExamSessionWithAnswers | null> {
  const supabase = await createClient()

  // Obtener la sesión
  const { data: session, error: sError } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sError || !session) return null

  // Obtener respuestas con preguntas completas (incluye correct_answer para resultados)
  const { data: answers, error: aError } = await supabase
    .from('session_answers')
    .select(`
      *,
      question:questions(*)
    `)
    .eq('session_id', sessionId)
    .order('question_order', { ascending: true })

  if (aError || !answers) return null

  return {
    ...(session as ExamSession),
    answers: answers as SessionAnswerWithQuestion[],
  }
}

/**
 * Guarda o actualiza la respuesta del usuario para una pregunta.
 * Upsert basado en (session_id, question_id) — idempotente y seguro.
 */
export async function saveAnswer(
  sessionId: string,
  questionId: string,
  selectedAnswer: AnswerLetter
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('session_answers')
    .update({
      selected_answer: selectedAnswer,
      answered_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .eq('question_id', questionId)

  if (error) throw new Error('No se pudo guardar la respuesta')
}

/**
 * Alterna el flag de revisión de una pregunta.
 */
export async function toggleFlag(
  sessionId: string,
  questionId: string,
  flagged: boolean
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('session_answers')
    .update({ is_flagged: flagged })
    .eq('session_id', sessionId)
    .eq('question_id', questionId)

  if (error) throw new Error('No se pudo actualizar el flag')
}

/**
 * Finaliza la sesión de examen: calcula scores, marca respuestas como
 * correctas/incorrectas y actualiza exam_sessions.
 *
 * @param timedOut - true si fue enviado por timeout del cronómetro
 */
export async function submitSession(
  sessionId: string,
  timedOut = false
): Promise<ExamSession> {
  const supabase = await createClient()

  // 1. Obtener todas las respuestas con las preguntas (para tener correct_answer)
  const { data: answers, error: aError } = await supabase
    .from('session_answers')
    .select(`
      id,
      question_id,
      selected_answer,
      question:questions(correct_answer, pillar_code)
    `)
    .eq('session_id', sessionId)

  if (aError || !answers) throw new Error('No se pudieron obtener las respuestas')

  // Supabase devuelve relaciones como array — normalizar a objeto único
  type RawRow = {
    id: string
    question_id: string
    selected_answer: AnswerLetter | null
    question: { correct_answer: string; pillar_code: string }[] | { correct_answer: string; pillar_code: string }
  }
  const rawRows = answers as unknown as RawRow[]

  const normalized = rawRows.map((a) => {
    const q = Array.isArray(a.question) ? a.question[0] : a.question
    return {
      id: a.id,
      question_id: a.question_id,
      selected_answer: a.selected_answer,
      correct_answer: q.correct_answer as AnswerLetter,
      pillar_code: q.pillar_code as import('../types').PillarCode,
      is_correct: a.selected_answer === q.correct_answer,
    }
  })

  // 3. Calcular scores directamente sin construir objetos completos
  let total_correct = 0
  const pillarMap: Record<string, { correct: number; total: number }> = {}

  for (const row of normalized) {
    const p = row.pillar_code
    if (!pillarMap[p]) pillarMap[p] = { correct: 0, total: 0 }
    pillarMap[p].total++
    if (row.is_correct) {
      pillarMap[p].correct++
      total_correct++
    }
  }

  const totalAnswered = normalized.length || 1
  const pct = (code: string) => {
    const c = pillarMap[code]
    return c ? Math.round((c.correct / c.total) * 10000) / 100 : 0
  }

  const scores = {
    score_total: Math.round((total_correct / totalAnswered) * 10000) / 100,
    score_pillar_1: pct('1.0'),
    score_pillar_2: pct('2.0'),
    score_pillar_3: pct('3.0'),
    score_pillar_4: pct('4.0'),
    score_pillar_5: pct('5.0'),
  }

  // 4. Actualizar cada session_answer con is_correct
  const updates = normalized.map((a) =>
    supabase
      .from('session_answers')
      .update({ is_correct: a.is_correct })
      .eq('id', a.id)
  )
  await Promise.all(updates)

  // 5. Actualizar la sesión con scores y estado final
  const { data: updatedSession, error: uError } = await supabase
    .from('exam_sessions')
    .update({
      status: timedOut ? 'timed_out' : 'completed',
      submitted_at: new Date().toISOString(),
      score_total: scores.score_total,
      score_pillar_1: scores.score_pillar_1,
      score_pillar_2: scores.score_pillar_2,
      score_pillar_3: scores.score_pillar_3,
      score_pillar_4: scores.score_pillar_4,
      score_pillar_5: scores.score_pillar_5,
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (uError || !updatedSession) throw new Error('No se pudo actualizar la sesión')

  return updatedSession as ExamSession
}
