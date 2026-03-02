// ============================================================
// TIPOS DEL DOMINIO — CMRP Mastery Simulation
// ============================================================

// ─── Pilares SMRP ────────────────────────────────────────────
export type PillarCode = '1.0' | '2.0' | '3.0' | '4.0' | '5.0'

export const PILLAR_NAMES: Record<PillarCode, string> = {
  '1.0': 'Negocios y Administración',
  '2.0': 'Confiabilidad de Procesos',
  '3.0': 'Confiabilidad del Equipo',
  '4.0': 'Organización y Liderazgo',
  '5.0': 'Administración del Trabajo',
}

export const PILLAR_CODES = Object.keys(PILLAR_NAMES) as PillarCode[]

export type Difficulty = 'Fácil' | 'Media' | 'Difícil'
export type AnswerLetter = 'A' | 'B' | 'C' | 'D'

// ─── Pregunta ─────────────────────────────────────────────────
export interface Question {
  id: string
  question_code: string        // "CMRP-001"
  pillar_code: PillarCode
  pillar_name: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: AnswerLetter
  explanation: string | null
  difficulty: Difficulty
  is_active: boolean
  created_at: string
}

// Versión sin correct_answer para mostrar al usuario durante el examen
export type QuestionForExam = Omit<Question, 'correct_answer' | 'explanation'>

// ─── Sesión de Examen ─────────────────────────────────────────
export type ExamSessionStatus = 'in_progress' | 'completed' | 'timed_out' | 'abandoned'

export interface ExamSession {
  id: string
  user_id: string
  status: ExamSessionStatus
  total_questions: number
  started_at: string
  submitted_at: string | null
  time_limit_minutes: number
  score_total: number | null
  score_pillar_1: number | null
  score_pillar_2: number | null
  score_pillar_3: number | null
  score_pillar_4: number | null
  score_pillar_5: number | null
  created_at: string
}

// ─── Respuesta por sesión ─────────────────────────────────────
export interface SessionAnswer {
  id: string
  session_id: string
  question_id: string
  question_order: number
  selected_answer: AnswerLetter | null
  is_flagged: boolean
  is_correct: boolean | null
  answered_at: string | null
  created_at: string
}

// ─── Tipos compuestos (con relaciones) ────────────────────────

/** Una respuesta con los datos completos de la pregunta (para el runner) */
export interface SessionAnswerWithQuestion extends SessionAnswer {
  question: Question
}

/** Una sesión con todas sus respuestas + preguntas cargadas */
export interface ExamSessionWithAnswers extends ExamSession {
  answers: SessionAnswerWithQuestion[]
}

// ─── Resultados de examen ─────────────────────────────────────
export interface PillarScore {
  code: PillarCode
  name: string
  correct: number
  total: number
  percentage: number
}

export interface ExamResults {
  session: ExamSession
  score_total: number          // 0-100
  pillar_scores: PillarScore[]
  answers: SessionAnswerWithQuestion[]
  passed: boolean              // >= 70% para aprobar CMRP
  total_correct: number
  total_questions: number
}

// ─── Constantes del examen ────────────────────────────────────
export const EXAM_CONSTANTS = {
  TOTAL_QUESTIONS: 110,
  TIME_LIMIT_MINUTES: 150,     // 2.5 horas
  PASSING_SCORE: 70,           // 70% para aprobar
  BANK_SIZE: 296,
} as const
