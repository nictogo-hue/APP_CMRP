// ============================================================
// TIPOS DEL DOMINIO — Analytics / Progreso CMRP
// ============================================================

export interface PillarStat {
  code: string    // '1.0'–'5.0'
  name: string    // Nombre completo del pilar
  average: number // 0–100 (porcentaje promedio entre exámenes)
  attempts: number
}

export interface ExamHistoryRow {
  id: string
  date: string             // ISO string (submitted_at)
  score: number            // score_total (0–100)
  total: number            // total_questions
  durationSeconds: number | null
  passed: boolean          // score >= 70
}

export interface AnalyticsData {
  hasData: boolean
  totalExams: number
  avgScore: number
  bestScore: number
  streak: number           // exámenes consecutivos aprobados (>= 70%) desde el más reciente
  weakestPillar: string | null  // nombre del pilar con menor promedio
  pillarAverages: PillarStat[]
  history: ExamHistoryRow[]    // últimos 10
}
