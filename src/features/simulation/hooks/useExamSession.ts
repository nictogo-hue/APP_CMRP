'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useExamStore, selectFormattedTime } from '../store/examStore'
import {
  getSessionWithQuestions,
  saveAnswer,
  toggleFlag,
  submitSession,
} from '../services/examService'
import type { AnswerLetter } from '../types'

interface UseExamSessionOptions {
  sessionId: string
}

/**
 * Hook principal del examen activo.
 * Responsabilidades:
 * - Cargar la sesión desde el servidor al montar
 * - Manejar el cronómetro regresivo
 * - Sincronizar respuestas con la DB en tiempo real
 * - Manejar el submit manual y por timeout
 */
export function useExamSession({ sessionId }: UseExamSessionOptions) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoSubmitCalledRef = useRef(false)

  const initSession    = useExamStore((s) => s.initSession)
  const tickTimer      = useExamStore((s) => s.tickTimer)
  const selectAnswerStore = useExamStore((s) => s.selectAnswer)
  const toggleFlagStore   = useExamStore((s) => s.toggleFlag)
  const setSubmitting  = useExamStore((s) => s.setSubmitting)
  const setSubmitError = useExamStore((s) => s.setSubmitError)
  const reset          = useExamStore((s) => s.reset)

  const session        = useExamStore((s) => s.session)
  const secondsRemaining = useExamStore((s) => s.secondsRemaining)
  const formattedTime  = useExamStore(selectFormattedTime)
  const isSubmitting   = useExamStore((s) => s.isSubmitting)
  const submitError    = useExamStore((s) => s.submitError)

  // ─── Cargar sesión al montar ─────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      const data = await getSessionWithQuestions(sessionId)
      if (cancelled || !data) return

      // Si la sesión ya está finalizada, redirigir a resultados
      if (data.status !== 'in_progress') {
        router.replace(`/exam/${sessionId}/results`)
        return
      }

      initSession(data)
    }

    load()
    return () => { cancelled = true }
  }, [sessionId, initSession, router])

  // ─── Cronómetro ──────────────────────────────────────────
  useEffect(() => {
    // Solo arrancar el timer una vez que la sesión esté cargada y en curso
    if (!session || session.status !== 'in_progress') return

    timerRef.current = setInterval(() => {
      tickTimer()
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [session, tickTimer])

  // ─── Auto-submit cuando el timer llega a 0 ───────────────
  useEffect(() => {
    if (secondsRemaining === 0 && session && !autoSubmitCalledRef.current) {
      autoSubmitCalledRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      handleSubmit(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining, session])

  // ─── Guardar respuesta (optimistic + DB sync) ────────────
  const handleSelectAnswer = useCallback(
    async (questionId: string, answer: AnswerLetter) => {
      // 1. Actualizar store inmediatamente (optimistic UI)
      selectAnswerStore(questionId, answer)
      // 2. Persistir en DB en background
      try {
        await saveAnswer(sessionId, questionId, answer)
      } catch {
        // Silencioso: la respuesta ya está en el store.
        // En una iteración futura se puede agregar retry.
      }
    },
    [sessionId, selectAnswerStore]
  )

  // ─── Toggle flag ─────────────────────────────────────────
  const handleToggleFlag = useCallback(
    async (questionId: string, currentFlag: boolean) => {
      toggleFlagStore(questionId)
      try {
        await toggleFlag(sessionId, questionId, !currentFlag)
      } catch {
        // Silencioso — revertir en próxima carga si falla
      }
    },
    [sessionId, toggleFlagStore]
  )

  // ─── Submit ──────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (timedOut = false) => {
      if (isSubmitting) return
      setSubmitting(true)
      setSubmitError(null)

      try {
        await submitSession(sessionId, timedOut)
        reset()
        router.push(`/exam/${sessionId}/results`)
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : 'Error al enviar el examen'
        )
        setSubmitting(false)
      }
    },
    [sessionId, isSubmitting, setSubmitting, setSubmitError, reset, router]
  )

  return {
    session,
    formattedTime,
    secondsRemaining,
    isSubmitting,
    submitError,
    isLoaded: session !== null,
    handleSelectAnswer,
    handleToggleFlag,
    handleSubmit,
  }
}
