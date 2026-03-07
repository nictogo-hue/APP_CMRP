'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { StudyPlan, StudyDay } from '../types'

interface Props {
  plan: StudyPlan
  hasData: boolean
  examDate?: string | null
}

export function StudyPlanView({ plan, hasData, examDate }: Props) {
  const progress = plan.totalDays > 0
    ? Math.round((plan.daysCompleted / plan.totalDays) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Banner sin fecha de examen */}
      {!examDate && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-400 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-yellow-300">Sin fecha de examen configurada</p>
            <p className="text-xs text-yellow-200/70 mt-0.5">
              El plan usa 28 días por defecto. Configura tu fecha de examen al registrarte o contacta al soporte.
            </p>
          </div>
        </div>
      )}

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
        // Check if 3+ study days in this week are completed → show mini-exam badge
        const completedStudyDays = week.days.filter(d => d.type === 'study' && d.isCompleted).length
        const showMiniExamBadge = completedStudyDays >= 3

        return (
          <div key={week.weekNumber} className={`rounded-2xl border overflow-hidden ${
            hasActiveDay ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-border'
          }`}>
            {/* Header semana */}
            <div className={`px-5 py-3 flex items-center justify-between ${
              hasActiveDay ? 'bg-blue-600/10' : 'bg-surface'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{week.label}</span>
                {hasActiveDay && (
                  <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    Semana actual
                  </span>
                )}
                {showMiniExamBadge && (
                  <Link
                    href="/exam/new"
                    className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full hover:bg-purple-500/30 transition-colors"
                  >
                    📋 Hacer mini-examen
                  </Link>
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
          href="/flashcards"
          className="flex-1 flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border text-foreground px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          <span>📇</span> Repasar Flashcards
        </Link>
      </div>
    </div>
  )
}

function DayRow({ day }: { day: StudyDay }) {
  const [completed, setCompleted] = useState(day.isCompleted ?? false)
  const [loading, setLoading] = useState(false)

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

  const handleMarkDone = async () => {
    setLoading(true)
    try {
      await fetch('/api/study-plan/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicKey: day.topicKey }),
      })
      setCompleted(true)
    } catch {
      // silently fail — UI stays in current state
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`
      flex items-center gap-4 px-5 py-3 transition-colors
      ${config.bg}
      ${day.isToday ? 'bg-blue-500/10' : ''}
      ${day.isPast && !day.isToday && !completed ? 'opacity-50' : ''}
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
          <span>{completed ? '✅' : config.icon}</span>
          <p className={`text-sm font-medium truncate ${config.color} ${day.isToday ? 'text-blue-200' : ''} ${completed ? 'line-through opacity-60' : ''}`}>
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

      {/* Botón marcar como estudiado */}
      {day.type === 'study' && !completed && !day.isPast && (
        <button
          onClick={handleMarkDone}
          disabled={loading}
          className="text-[11px] text-green-400 hover:text-green-300 shrink-0 px-2 py-1 bg-green-600/10 hover:bg-green-600/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '...' : '✓ Estudiar'}
        </button>
      )}

      {/* Botón estudiar → flashcards */}
      {day.type === 'study' && !completed && day.isPast && (
        <Link
          href="/flashcards"
          className="text-[11px] text-blue-400 hover:text-blue-300 shrink-0 px-2 py-1 bg-blue-600/10 hover:bg-blue-600/20 rounded-lg transition-colors"
        >
          Repasar →
        </Link>
      )}

      {/* Botón simulacro */}
      {day.type === 'exam' && !day.isPast && !completed && (
        <Link
          href="/exam/new"
          className="text-[11px] text-purple-400 hover:text-purple-300 shrink-0 px-2 py-1 bg-purple-600/10 hover:bg-purple-600/20 rounded-lg transition-colors"
        >
          Iniciar →
        </Link>
      )}

      {/* Check si completado */}
      {completed && (
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
