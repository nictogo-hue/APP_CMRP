import Link from 'next/link'
import { getAnalyticsData } from '../services/analyticsService'
import { StatsCards } from './StatsCards'
import { RadarChart } from './RadarChart'
import { ExamHistoryTable } from './ExamHistoryTable'

export async function AnalyticsDashboard() {
  const data = await getAnalyticsData()

  if (!data.hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-5 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Sin datos todavía</h2>
        <p className="text-foreground-secondary max-w-sm mb-8">
          Completa tu primer simulacro CMRP para ver tus estadísticas y progreso por pilar SMRP.
        </p>
        <Link
          href="/exam/new"
          className="px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
        >
          Comenzar Simulacro
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <StatsCards data={data} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RadarChart pillarAverages={data.pillarAverages} />
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Reforzamiento por Pilar</h3>
          <div className="space-y-3">
            {data.pillarAverages.map((p) => (
              <div key={p.code}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground-secondary truncate pr-2">{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: p.average >= 70 ? '#22c55e' : p.average >= 50 ? '#f59e0b' : '#ef4444' }}
                    >
                      {p.average}%
                    </span>
                    {p.attempts > 0 && p.average < 70 && (
                      <Link
                        href={`/exam/mini/${p.code}`}
                        className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-1.5 py-0.5 rounded"
                      >
                        Reforzar →
                      </Link>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.average}%`,
                      backgroundColor: p.average >= 70 ? '#22c55e' : p.average >= 50 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                {p.attempts > 0 && (
                  <p className="text-[10px] text-foreground-muted mt-0.5">{p.attempts} intento{p.attempts !== 1 ? 's' : ''}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex gap-2">
            <Link href="/flashcards" className="flex-1 text-center text-xs text-blue-400 hover:text-blue-300 py-2 bg-blue-600/10 rounded-lg">
              📇 Ver Flashcards
            </Link>
            <Link href="/study-plan" className="flex-1 text-center text-xs text-foreground-secondary hover:text-foreground py-2 bg-surface-hover rounded-lg">
              📅 Plan de Estudio
            </Link>
          </div>
        </div>
      </div>
      <ExamHistoryTable history={data.history} />
    </div>
  )
}
