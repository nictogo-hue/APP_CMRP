import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAnalyticsData } from '@/features/analytics/services/analyticsService'

export const metadata = { title: 'Dashboard | CMRP Mastery' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.email?.split('@')[0] || 'Usuario'
  const analytics = await getAnalyticsData()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {userName}
        </h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Tu panel de preparación para la certificación CMRP
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Exámenes realizados"
          value={analytics.totalExams}
          suffix=""
          color="blue"
        />
        <StatCard
          label="Promedio general"
          value={analytics.avgScore}
          suffix="%"
          color={analytics.avgScore >= 70 ? 'green' : analytics.avgScore > 0 ? 'yellow' : 'gray'}
        />
        <StatCard
          label="Mejor puntaje"
          value={analytics.bestScore}
          suffix="%"
          color={analytics.bestScore >= 70 ? 'green' : analytics.bestScore > 0 ? 'yellow' : 'gray'}
        />
        <StatCard
          label="Racha actual"
          value={analytics.streak}
          suffix={analytics.streak === 1 ? ' aprobado' : ' aprobados'}
          color={analytics.streak >= 3 ? 'green' : analytics.streak > 0 ? 'yellow' : 'gray'}
        />
      </div>

      {/* Alert: pilar débil */}
      {analytics.hasData && analytics.weakestPillar && analytics.avgScore < 70 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-400 text-xl">⚠</span>
          <div>
            <p className="text-sm font-medium text-yellow-300">Área de mejora detectada</p>
            <p className="text-sm text-yellow-200/70 mt-0.5">
              Tu pilar más débil es <strong className="text-yellow-300">{analytics.weakestPillar}</strong>.
              Consulta al Tutor IA para reforzarlo.
            </p>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            href="/exam/new"
            icon="📋"
            title="Iniciar Simulacro"
            description="110 preguntas · 150 minutos"
            primary
          />
          <QuickAction
            href="/tutor"
            icon="🤖"
            title="Tutor IA"
            description="Preguntas con RAG sobre PDFs CMRP"
          />
          <QuickAction
            href="/analytics"
            icon="📊"
            title="Mi Progreso"
            description="Análisis por los 5 pilares SMRP"
          />
        </div>
      </div>

      {/* Historial reciente */}
      {analytics.history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground-secondary uppercase tracking-wider">
              Últimos exámenes
            </h2>
            <Link href="/analytics" className="text-xs text-blue-400 hover:text-blue-300">
              Ver todo →
            </Link>
          </div>
          <div className="space-y-2">
            {analytics.history.slice(0, 5).map((exam) => {
              const date = exam.date ? new Date(exam.date).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'short', year: 'numeric'
              }) : '—'
              const mins = exam.durationSeconds ? Math.round(exam.durationSeconds / 60) : null
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${exam.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{date}</p>
                      {mins && (
                        <p className="text-xs text-foreground-secondary">{mins} min · {exam.total} preguntas</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${exam.passed ? 'text-green-400' : 'text-red-400'}`}>
                      {exam.score}%
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      exam.passed
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {exam.passed ? 'Aprobado' : 'No aprobado'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!analytics.hasData && (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-4xl mb-3">🎯</p>
          <h3 className="text-lg font-semibold text-foreground mb-1">Empieza tu preparación</h3>
          <p className="text-sm text-foreground-secondary mb-4">
            Completa tu primer simulacro para ver tus estadísticas aquí.
          </p>
          <Link
            href="/exam/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Iniciar primer simulacro
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────

function StatCard({
  label,
  value,
  suffix,
  color,
}: {
  label: string
  value: number
  suffix: string
  color: 'blue' | 'green' | 'yellow' | 'gray'
}) {
  const colors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    gray: 'text-foreground-secondary',
  }
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-foreground-secondary mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>
        {value > 0 ? `${value}${suffix}` : '—'}
      </p>
    </div>
  )
}

function QuickAction({
  href,
  icon,
  title,
  description,
  primary = false,
}: {
  href: string
  icon: string
  title: string
  description: string
  primary?: boolean
}) {
  return (
    <Link
      href={href}
      className={`
        flex items-start gap-4 p-4 rounded-xl border transition-all duration-200
        ${primary
          ? 'bg-blue-600/20 border-blue-600/40 hover:bg-blue-600/30'
          : 'bg-surface border-border hover:border-blue-600/40 hover:bg-surface-hover'
        }
      `}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`font-semibold text-sm ${primary ? 'text-blue-300' : 'text-foreground'}`}>
          {title}
        </p>
        <p className="text-xs text-foreground-secondary mt-0.5">{description}</p>
      </div>
    </Link>
  )
}
