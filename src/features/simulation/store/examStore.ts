import { create } from 'zustand'
import type { ExamSessionWithAnswers, AnswerLetter } from '../types'

// ─── Estado ───────────────────────────────────────────────────
interface ExamState {
  // Datos de sesión cargados desde DB
  session: ExamSessionWithAnswers | null

  // Navegación
  currentIndex: number          // 0-based: índice de la pregunta activa

  // Respuestas en memoria (sincronizadas con DB on-the-fly)
  // key: question_id → selected answer
  answers: Record<string, AnswerLetter | null>

  // Preguntas marcadas para revisión
  // key: question_id → boolean
  flagged: Record<string, boolean>

  // Estado del timer (gestionado por useExamSession)
  secondsRemaining: number

  // Estado de submit
  isSubmitting: boolean
  submitError: string | null
}

// ─── Acciones ─────────────────────────────────────────────────
interface ExamActions {
  // Inicializar con datos del servidor
  initSession: (session: ExamSessionWithAnswers) => void

  // Navegación
  goTo: (index: number) => void
  goToNext: () => void
  goToPrev: () => void

  // Respuestas
  selectAnswer: (questionId: string, answer: AnswerLetter) => void

  // Flags de revisión
  toggleFlag: (questionId: string) => void

  // Timer
  setSecondsRemaining: (seconds: number) => void
  tickTimer: () => void

  // Submit
  setSubmitting: (value: boolean) => void
  setSubmitError: (error: string | null) => void

  // Reset para nueva sesión
  reset: () => void
}

// ─── Estado inicial ───────────────────────────────────────────
const initialState: ExamState = {
  session: null,
  currentIndex: 0,
  answers: {},
  flagged: {},
  secondsRemaining: 0,
  isSubmitting: false,
  submitError: null,
}

// ─── Store ────────────────────────────────────────────────────
export const useExamStore = create<ExamState & ExamActions>((set, get) => ({
  ...initialState,

  initSession: (session) => {
    // Hidratar answers y flagged desde los datos del servidor
    const answers: Record<string, AnswerLetter | null> = {}
    const flagged: Record<string, boolean> = {}

    for (const answer of session.answers) {
      answers[answer.question_id] = answer.selected_answer
      flagged[answer.question_id] = answer.is_flagged
    }

    const elapsed = Math.floor(
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    )
    const totalSeconds = session.time_limit_minutes * 60
    const secondsRemaining = Math.max(0, totalSeconds - elapsed)

    set({
      session,
      currentIndex: 0,
      answers,
      flagged,
      secondsRemaining,
      isSubmitting: false,
      submitError: null,
    })
  },

  // ─── Navegación ───────────────────────────────────────────
  goTo: (index) => {
    const { session } = get()
    if (!session) return
    const max = session.answers.length - 1
    set({ currentIndex: Math.max(0, Math.min(index, max)) })
  },

  goToNext: () => {
    const { currentIndex, session } = get()
    if (!session) return
    if (currentIndex < session.answers.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  goToPrev: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  // ─── Respuestas ───────────────────────────────────────────
  selectAnswer: (questionId, answer) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    }))
  },

  // ─── Flags ────────────────────────────────────────────────
  toggleFlag: (questionId) => {
    set((state) => ({
      flagged: {
        ...state.flagged,
        [questionId]: !state.flagged[questionId],
      },
    }))
  },

  // ─── Timer ────────────────────────────────────────────────
  setSecondsRemaining: (seconds) => set({ secondsRemaining: seconds }),

  tickTimer: () => {
    set((state) => ({
      secondsRemaining: Math.max(0, state.secondsRemaining - 1),
    }))
  },

  // ─── Submit ───────────────────────────────────────────────
  setSubmitting: (value) => set({ isSubmitting: value }),
  setSubmitError: (error) => set({ submitError: error }),

  // ─── Reset ────────────────────────────────────────────────
  reset: () => set(initialState),
}))

// ─── Selectores derivados ─────────────────────────────────────

/** Pregunta actualmente visible */
export const selectCurrentAnswer = (state: ExamState & ExamActions) => {
  if (!state.session) return null
  return state.session.answers[state.currentIndex] ?? null
}

/** Total de preguntas respondidas */
export const selectAnsweredCount = (state: ExamState & ExamActions) =>
  Object.values(state.answers).filter((a) => a !== null).length

/** Total de preguntas marcadas para revisión */
export const selectFlaggedCount = (state: ExamState & ExamActions) =>
  Object.values(state.flagged).filter(Boolean).length

/** ¿Está la pregunta N respondida? */
export const selectIsAnswered = (questionId: string) =>
  (state: ExamState & ExamActions) =>
    state.answers[questionId] !== null && state.answers[questionId] !== undefined

/** Tiempo restante formateado como "HH:MM:SS" */
export const selectFormattedTime = (state: ExamState & ExamActions) => {
  const s = state.secondsRemaining
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map((n) => String(n).padStart(2, '0')).join(':')
}
