import Link from 'next/link'
import type { StudyPlan, StudyDay } from '../types'

interface Props {
  plan: StudyPlan
  hasData: boolean
}

export function StudyPlanView({ plan, hasData }: Props) {
  const progress = Math.round((plan.daysCompleted / plan.totalDays) * 100)

  return (
    <div className="space-y-6">
      {/* Header de progreso */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Progreso del plan</p>
            <p className="text-xs text-foreground-secondary mt-0.5">
              {plan.daysCompleted} de {plan.totalDays} días · {plan.daysRemaining} restantes
            </p>
          </div>
          <span className="text-2xl font-bold text-blue-400">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {!hasData && (
          <p className="text-xs text-yellow-400/80 mt-3 flex items-center gap-1.5">
            <span>⚠</span>
            Plan generado con distribución equitativa. Completa un simulacro para personalizarlo.
          </p>
        )}
      </div>

      {/* Semanas */}
      {plan.weeks.map((week) => {
        const hasActiveDay = week.days.some(d => d.isToday)
        return (
          <div key={week.weekNumber} className={`rounded-2xl border overflow-hidden ${
            hasActiveDay ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-border'
          }`}>
            {/* Header semana */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              hasActiveDay ? 'bg-blue-600/10' : 'bg-surface'
            }`}>
              <div>
                <span className="text-sm font-semibold text-foreground">{week.label}</span>
                {hasActiveDay && (
                  <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    Semana actual
                  </span>
                )}
              </div>
              <span className="text-xs text-foreground-secondary">{week.focus}</span>
            </div>

            {/* Días */}
            <div className="divide-y divide-border">
              {week.days.map((day) => (
                <DayRow key={day.dayNumber} day={day} />
              ))}
            </div>
          </div>
        )
      })}

      {/* CTA */}
      <div className="flex gap-3">
        <Link
          href="/exam/new"
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <span>📋</span> Hacer simulacro ahora
        </Link>
        <Link
          href="/tutor"
          className="flex-1 flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border text-foreground px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <span>🤖</span> Preguntar al Tutor IA
        </Link>
      </div>
    </div>
  )
}

function DayRow({ day }: { day: StudyDay }) {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const dayName = dayNames[(day.date.getDay() + 6) % 7]
  const dateStr = day.date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })

  const typeConfig = {
    study: { bg: '', icon: '📖', color: 'text-foreground' },
    exam: { bg: 'bg-purple-500/5', icon: '📋', color: 'text-purple-300' },
    rest: { bg: 'bg-gray-500/5', icon: '😌', color: 'text-foreground-secondary' },
  }

  const config = typeConfig[day.type]

  const pillarColor = day.pillarCode ? getPillarColor(day.pillarCode) : ''

  return (
    <div className={`
      flex items-center gap-4 px-5 py-3 transition-colors
      ${config.bg}
      ${day.isToday ? 'bg-blue-500/10' : ''}
      ${day.isPast && !day.isToday ? 'opacity-50' : ''}
    `}>
      {/* Fecha */}
      <div className="w-12 shrink-0 text-center">
        <p className={`text-[11px] font-semibold ${day.isToday ? 'text-blue-400' : 'text-foreground-secondary'}`}>
          {dayName}
        </p>
        <p className={`text-xs ${day.isToday ? 'text-blue-300' : 'text-foreground-secondary'}`}>
          {dateStr}
        </p>
      </div>

      {/* Indicador hoy */}
      <div className="w-1.5 h-1.5 rounded-full shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-blue-400' : 'bg-transparent'}`} />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <p className={`text-sm font-medium truncate ${config.color} ${day.isToday ? 'text-blue-200' : ''}`}>
            {day.topic}
          </p>
        </div>
        {day.pillarName && (
          <p className={`text-[11px] mt-0.5 ${pillarColor}`}>
            Pilar: {day.pillarName}
          </p>
        )}
      </div>

      {/* Duración */}
      {day.durationMinutes > 0 && (
        <span className="text-xs text-foreground-secondary shrink-0">
          {day.durationMinutes} min
        </span>
      )}

      {/* Botón estudiar */}
      {day.type === 'study' && !day.isPast && (
        <Link
          href={`/tutor?topic=${encodeURIComponent(day.topic)}`}
          className="text-[11px] text-blue-400 hover:text-blue-300 shrink-0 px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg transition-colors"
        >
          Estudiar →
        </Link>
      )}

      {/* Botón simulacro */}
      {day.type === 'exam' && !day.isPast && (
        <Link
          href="/exam/new"
          className="text-[11px] text-purple-400 hover:text-purple-300 shrink-0 px-2 py-1 bg-purple-600/10 hover:bg-purple-600/20 rounded-lg transition-colors"
        >
          Iniciar →
        </Link>
      )}

      {/* Check si pasó */}
      {day.isPast && (
        <span className="text-green-500 text-sm shrink-0">✓</span>
      )}
    </div>
  )
}

function getPillarColor(code: string): string {
  const colors: Record<string, string> = {
    '1.0': 'text-blue-400/70',
    '2.0': 'text-green-400/70',
    '3.0': 'text-yellow-400/70',
    '4.0': 'text-purple-400/70',
    '5.0': 'text-orange-400/70',
  }
  return colors[code] ?? 'text-foreground-secondary'
}
