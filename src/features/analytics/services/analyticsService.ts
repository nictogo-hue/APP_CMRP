import { createClient } from '@/lib/supabase/server'
import { PILLAR_CODES, PILLAR_NAMES, type PillarCode } from '@/features/simulation/types'
import type { AnalyticsData, ExamHistoryRow, PillarStat } from '../types'

const PILLAR_SCORE_COLUMNS: Record<PillarCode, string> = {
  '1.0': 'score_pillar_1',
  '2.0': 'score_pillar_2',
  '3.0': 'score_pillar_3',
  '4.0': 'score_pillar_4',
  '5.0': 'score_pillar_5',
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return emptyData()
  }

  const { data: sessions, error } = await supabase
    .from('exam_sessions')
    .select('id, score_total, total_questions, started_at, submitted_at, score_pillar_1, score_pillar_2, score_pillar_3, score_pillar_4, score_pillar_5')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: false })
    .limit(50)

  if (error || !sessions || sessions.length === 0) {
    return emptyData()
  }

  // — Stats globales —
  const totalExams = sessions.length
  const scores = sessions.map(s => s.score_total ?? 0)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalExams)
  const bestScore = Math.max(...scores)

  // — Racha (aprobados consecutivos desde el más reciente) —
  let streak = 0
  for (const s of sessions) {
    if ((s.score_total ?? 0) >= 70) streak++
    else break
  }

  // — Promedios por pilar —
  const pillarAverages: PillarStat[] = PILLAR_CODES.map((code) => {
    const col = PILLAR_SCORE_COLUMNS[code]
    const values = sessions
      .map(s => (s as Record<string, number | null>)[col])
      .filter((v): v is number => v !== null)
    const average = values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : 0
    return { code, name: PILLAR_NAMES[code], average, attempts: values.length }
  })

  // — Pilar más débil —
  const withData = pillarAverages.filter(p => p.attempts > 0)
  const weakest = withData.length > 0
    ? withData.reduce((min, p) => p.average < min.average ? p : min)
    : null
  const weakestPillar = weakest?.name ?? null

  // — Historial (últimos 10) —
  const history: ExamHistoryRow[] = sessions.slice(0, 10).map(s => {
    const durationSeconds = s.submitted_at && s.started_at
      ? Math.round((new Date(s.submitted_at).getTime() - new Date(s.started_at).getTime()) / 1000)
      : null
    return {
      id: s.id,
      date: s.submitted_at ?? s.started_at,
      score: s.score_total ?? 0,
      total: s.total_questions,
      durationSeconds,
      passed: (s.score_total ?? 0) >= 70,
    }
  })

  return {
    hasData: true,
    totalExams,
    avgScore,
    bestScore,
    streak,
    weakestPillar,
    pillarAverages,
    history,
  }
}

function emptyData(): AnalyticsData {
  return {
    hasData: false,
    totalExams: 0,
    avgScore: 0,
    bestScore: 0,
    streak: 0,
    weakestPillar: null,
    pillarAverages: PILLAR_CODES.map(code => ({
      code,
      name: PILLAR_NAMES[code],
      average: 0,
      attempts: 0,
    })),
    history: [],
  }
}
