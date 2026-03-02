import type { AnalyticsData } from '../types'

interface Props {
  data: AnalyticsData
}

export function StatsCards({ data }: Props) {
  const cards = [
    {
      label: 'Total Simulacros',
      value: data.totalExams.toString(),
      sub: 'completados',
      color: '#3b82f6',
    },
    {
      label: 'Score Promedio',
      value: `${data.avgScore}%`,
      sub: data.avgScore >= 70 ? 'Nivel aprobatorio' : 'Por debajo de 70%',
      color: data.avgScore >= 70 ? '#22c55e' : '#ef4444',
    },
    {
      label: 'Mejor Score',
      value: `${data.bestScore}%`,
      sub: 'máximo alcanzado',
      color: '#8b5cf6',
    },
    {
      label: 'Racha Actual',
      value: data.streak.toString(),
      sub: data.streak === 1 ? 'aprobado consecutivo' : 'aprobados consecutivos',
      color: '#f59e0b',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-border rounded-2xl p-5"
        >
          <p className="text-xs text-foreground-secondary uppercase tracking-wide mb-2">
            {card.label}
          </p>
          <p
            className="text-3xl font-bold mb-1"
            style={{ color: card.color }}
          >
            {card.value}
          </p>
          <p className="text-xs text-foreground-muted">{card.sub}</p>
        </div>
      ))}

      {data.weakestPillar && (
        <div className="col-span-2 lg:col-span-4 bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#fef3c7' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#d97706" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-foreground-secondary uppercase tracking-wide">Pilar más débil</p>
            <p className="font-semibold text-foreground">{data.weakestPillar}</p>
            <p className="text-xs text-foreground-muted">Enfoca tu estudio en este área para mejorar tu score</p>
          </div>
        </div>
      )}
    </div>
  )
}
