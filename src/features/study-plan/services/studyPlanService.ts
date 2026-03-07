import type { PillarCode } from '@/features/simulation/types'
import type { PillarStat } from '@/features/analytics/types'
import type { StudyDay, StudyPlan, StudyWeek } from '../types'

// ─── Temario por pilar ────────────────────────────────────────

const PILLAR_TOPICS: Record<PillarCode, string[]> = {
  '1.0': [
    'Gestión de activos físicos (ISO 55000)',
    'KPIs de mantenimiento: OEE, disponibilidad, confiabilidad',
    'Presupuesto y control de costos de mantenimiento',
    'Análisis de ciclo de vida del activo (LCA)',
    'Gestión de contratos y proveedores',
  ],
  '2.0': [
    'RCM — Mantenimiento Centrado en Confiabilidad',
    'FMEA/FMECA — Análisis de modos de falla',
    'RCA — Análisis de causa raíz (árbol de fallas)',
    'Mantenimiento preventivo vs predictivo',
    'Análisis de criticidad de equipos',
  ],
  '3.0': [
    'Curva de bañera y distribución de Weibull',
    'Técnicas predictivas: vibraciones y ultrasonido',
    'Termografía infrarroja y análisis de aceites',
    'MTBF, MTTR, disponibilidad y confiabilidad',
    'Mantenimiento basado en condición (CBM)',
  ],
  '4.0': [
    'Gestión del cambio organizacional',
    'Desarrollo y liderazgo de equipos de mantenimiento',
    'Cultura de confiabilidad y mejora continua',
    'Comunicación efectiva entre operaciones y mantenimiento',
    'Auditorías y evaluación del programa de mantenimiento',
  ],
  '5.0': [
    'Planificación y programación de trabajos (backlog)',
    'Gestión de órdenes de trabajo (OTs)',
    'Sistemas CMMS/EAM — uso y optimización',
    'Gestión de repuestos y almacén de mantenimiento',
    'Indicadores de gestión del trabajo (schedule compliance)',
  ],
}

const PILLAR_NAMES_SHORT: Record<PillarCode, string> = {
  '1.0': 'Negocios y Administración',
  '2.0': 'Confiabilidad de Procesos',
  '3.0': 'Confiabilidad del Equipo',
  '4.0': 'Organización y Liderazgo',
  '5.0': 'Administración del Trabajo',
}

// ─── Config interface ─────────────────────────────────────────

export interface StudyPlanConfig {
  pillarAverages: PillarStat[]
  examDate?: Date | null
  studyHoursPerDay?: number | null
  completedTopics?: string[]
  anchorDate?: Date
}

// ─── Lógica principal ─────────────────────────────────────────

/**
 * Genera un plan de estudio dinámico basado en la fecha de examen
 * y horas de estudio disponibles por día. Si no hay fecha de examen,
 * usa 28 días como fallback.
 */
export function generateStudyPlan(
  pillarAveragesOrConfig: PillarStat[] | StudyPlanConfig,
  anchorDateArg: Date = new Date(),
): StudyPlan {
  // Support both old signature (array) and new (config object)
  let pillarAverages: PillarStat[]
  let examDate: Date | null = null
  let studyHoursPerDay = 1.5
  let completedTopics: string[] = []
  let anchorDate = anchorDateArg

  if (Array.isArray(pillarAveragesOrConfig)) {
    pillarAverages = pillarAveragesOrConfig
  } else {
    pillarAverages = pillarAveragesOrConfig.pillarAverages
    examDate = pillarAveragesOrConfig.examDate ?? null
    studyHoursPerDay = pillarAveragesOrConfig.studyHoursPerDay ?? 1.5
    completedTopics = pillarAveragesOrConfig.completedTopics ?? []
    anchorDate = pillarAveragesOrConfig.anchorDate ?? anchorDateArg
  }

  // Normaliza anchor al inicio del día
  const startDate = new Date(anchorDate)
  startDate.setHours(0, 0, 0, 0)

  // Calcular días hasta el examen (mínimo 7, máximo 180)
  let totalDays = 28
  if (examDate) {
    const examDateNorm = new Date(examDate)
    examDateNorm.setHours(0, 0, 0, 0)
    const diffMs = examDateNorm.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    totalDays = Math.max(7, Math.min(180, diffDays))
  }

  // Duración de sesión según horas de estudio
  const durationMinutes = Math.round(studyHoursPerDay * 60)

  // Distribuye días según debilidad
  const totalStudyDays = countStudyDays(totalDays)
  const orderedPillars = buildPillarSchedule(pillarAverages, totalStudyDays)

  // Genera todos los días
  const allDays: StudyDay[] = []
  let pillarIndex = 0
  const topicCounters: Record<PillarCode, number> = {
    '1.0': 0, '2.0': 0, '3.0': 0, '4.0': 0, '5.0': 0,
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const dayOfWeek = i % 7 // 0=Lun … 6=Dom
    const isToday = date.getTime() === today.getTime()
    const isPast = date < today

    if (dayOfWeek === 5) {
      // Sábado — simulacro
      const topicKey = `exam_week${Math.floor(i / 7) + 1}_day${i + 1}`
      allDays.push({
        dayNumber: i + 1,
        date,
        type: 'exam',
        topic: 'Simulacro de práctica CMRP',
        durationMinutes: Math.min(durationMinutes, 150),
        isToday,
        isPast,
        topicKey,
        isCompleted: completedTopics.includes(topicKey),
      })
    } else if (dayOfWeek === 6) {
      // Domingo — descanso
      const topicKey = `rest_week${Math.floor(i / 7) + 1}_day${i + 1}`
      allDays.push({
        dayNumber: i + 1,
        date,
        type: 'rest',
        topic: 'Descanso — repasa tus apuntes',
        durationMinutes: 0,
        isToday,
        isPast,
        topicKey,
        isCompleted: completedTopics.includes(topicKey),
      })
    } else {
      // Lunes–Viernes — estudio
      const pillarCode = orderedPillars[pillarIndex % orderedPillars.length] as PillarCode
      const topics = PILLAR_TOPICS[pillarCode]
      const topic = topics[topicCounters[pillarCode] % topics.length]
      topicCounters[pillarCode]++
      pillarIndex++

      const topicKey = `study_p${pillarCode}_w${Math.floor(i / 7) + 1}_d${i + 1}`
      allDays.push({
        dayNumber: i + 1,
        date,
        type: 'study',
        pillarCode,
        pillarName: PILLAR_NAMES_SHORT[pillarCode],
        topic,
        durationMinutes,
        isToday,
        isPast,
        topicKey,
        isCompleted: completedTopics.includes(topicKey),
      })
    }
  }

  // Agrupa en semanas
  const numWeeks = Math.ceil(totalDays / 7)
  const weeks: StudyWeek[] = []
  for (let w = 0; w < numWeeks; w++) {
    const weekDays = allDays.slice(w * 7, w * 7 + 7)
    const studyPillars = weekDays
      .filter(d => d.type === 'study')
      .map(d => d.pillarName!)
    const uniquePillars = [...new Set(studyPillars)]

    weeks.push({
      weekNumber: w + 1,
      label: `Semana ${w + 1}`,
      focus: uniquePillars.slice(0, 2).join(' · ') || 'Repaso general',
      days: weekDays,
    })
  }

  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + totalDays - 1)

  const diffMs = today.getTime() - startDate.getTime()
  const daysCompleted = Math.max(0, Math.min(totalDays, Math.floor(diffMs / (1000 * 60 * 60 * 24))))

  return {
    weeks,
    startDate,
    endDate,
    totalDays,
    daysCompleted,
    daysRemaining: Math.max(0, totalDays - daysCompleted),
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function countStudyDays(totalDays: number): number {
  let count = 0
  for (let i = 0; i < totalDays; i++) {
    const dayOfWeek = i % 7
    if (dayOfWeek !== 5 && dayOfWeek !== 6) count++
  }
  return count
}

/**
 * Construye una lista ordenada de pilares para asignar a días de estudio.
 * Los pilares más débiles aparecen más veces.
 */
function buildPillarSchedule(pillarAverages: PillarStat[], totalStudyDays: number): PillarCode[] {
  const CODES: PillarCode[] = ['1.0', '2.0', '3.0', '4.0', '5.0']

  // Si no hay datos, distribuye equitativamente
  const hasData = pillarAverages.some(p => p.attempts > 0)
  if (!hasData) {
    const schedule: PillarCode[] = []
    for (let i = 0; i < totalStudyDays; i++) {
      schedule.push(CODES[i % 5])
    }
    return schedule
  }

  // Score inverso: pilares con menor average reciben más peso
  const sorted = [...pillarAverages].sort((a, b) => a.average - b.average)

  // Distribuye proporcionalmente: más débil = más slots
  const totalWeight = 5 + 4 + 4 + 4 + 3 // 20
  const baseWeights = [5, 4, 4, 4, 3]
  const schedule: PillarCode[] = []

  sorted.forEach((p, idx) => {
    const code = p.code as PillarCode
    const slots = Math.round((baseWeights[idx] / totalWeight) * totalStudyDays)
    for (let j = 0; j < slots; j++) {
      schedule.push(code)
    }
  })

  // Fill any gap due to rounding
  while (schedule.length < totalStudyDays) {
    schedule.push(sorted[0].code as PillarCode)
  }

  // Intercala para que no queden pilares agrupados
  return interleave(schedule).slice(0, totalStudyDays)
}

function interleave(arr: PillarCode[]): PillarCode[] {
  const result: PillarCode[] = []
  const remaining = [...arr]

  while (remaining.length > 0) {
    const lastAdded = result[result.length - 1]
    const idx = remaining.findIndex(c => c !== lastAdded)
    if (idx === -1) {
      result.push(...remaining.splice(0))
    } else {
      result.push(remaining.splice(idx, 1)[0])
    }
  }

  return result
}
