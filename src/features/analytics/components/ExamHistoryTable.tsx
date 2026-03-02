import type { ExamHistoryRow } from '../types'

interface Props {
  history: ExamHistoryRow[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function ExamHistoryTable({ history }: Props) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Historial de Simulacros</h3>
        <p className="text-xs text-foreground-muted mt-0.5">Últimos {history.length} exámenes completados</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                Fecha
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                Score
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                Preguntas
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                Tiempo
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wide">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map((row) => (
              <tr key={row.id} className="hover:bg-background/50 transition-colors">
                <td className="px-6 py-3 text-foreground-secondary">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="font-semibold"
                    style={{ color: row.passed ? '#22c55e' : '#ef4444' }}
                  >
                    {row.score}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-foreground-secondary">
                  {row.total}
                </td>
                <td className="px-4 py-3 text-center text-foreground-secondary">
                  {formatDuration(row.durationSeconds)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={
                      row.passed
                        ? { backgroundColor: '#dcfce7', color: '#15803d' }
                        : { backgroundColor: '#fee2e2', color: '#dc2626' }
                    }
                  >
                    {row.passed ? 'Aprobado' : 'Reprobado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
