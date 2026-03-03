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

// ─── Lógica principal ─────────────────────────────────────────

/**
 * Genera un plan de 4 semanas (28 días) basado en los promedios
 * por pilar. Los pilares más débiles reciben más días de estudio.
 */
export function generateStudyPlan(
  pillarAverages: PillarStat[],
  anchorDate: Date = new Date(),
): StudyPlan {
  // Normaliza anchor al inicio del día
  const startDate = new Date(anchorDate)
  startDate.setHours(0, 0, 0, 0)

  // Distribuye días según debilidad (más días al pilar con menor score)
  const orderedPillars = buildPillarSchedule(pillarAverages)

  // Genera los 28 días (4 semanas × 7 días)
  const allDays: StudyDay[] = []
  let pillarIndex = 0
  let topicCounters: Record<PillarCode, number> = {
    '1.0': 0, '2.0': 0, '3.0': 0, '4.0': 0, '5.0': 0,
  }

  for (let i = 0; i < 28; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const dayOfWeek = i % 7 // 0=Lun … 6=Dom

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isToday = date.getTime() === today.getTime()
    const isPast = date < today

    if (dayOfWeek === 5) {
      // Sábado — simulacro
      allDays.push({
        dayNumber: i + 1,
        date,
        type: 'exam',
        topic: 'Simulacro de práctica CMRP',
        durationMinutes: 60,
        isToday,
        isPast,
      })
    } else if (dayOfWeek === 6) {
      // Domingo — descanso
      allDays.push({
        dayNumber: i + 1,
        date,
        type: 'rest',
        topic: 'Descanso — repasa tus apuntes',
        durationMinutes: 0,
        isToday,
        isPast,
      })
    } else {
      // Lunes–Viernes — estudio
      const pillarCode = orderedPillars[pillarIndex % orderedPillars.length] as PillarCode
      const topics = PILLAR_TOPICS[pillarCode]
      const topic = topics[topicCounters[pillarCode] % topics.length]
      topicCounters[pillarCode]++
      pillarIndex++

      allDays.push({
        dayNumber: i + 1,
        date,
        type: 'study',
        pillarCode,
        pillarName: PILLAR_NAMES_SHORT[pillarCode],
        topic,
        durationMinutes: 45,
        isToday,
        isPast,
      })
    }
  }

  // Agrupa en semanas
  const weeks: StudyWeek[] = []
  for (let w = 0; w < 4; w++) {
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
  endDate.setDate(startDate.getDate() + 27)

  const today2 = new Date()
  today2.setHours(0, 0, 0, 0)
  const diffMs = today2.getTime() - startDate.getTime()
  const daysCompleted = Math.max(0, Math.min(28, Math.floor(diffMs / (1000 * 60 * 60 * 24))))

  return {
    weeks,
    startDate,
    endDate,
    totalDays: 28,
    daysCompleted,
    daysRemaining: Math.max(0, 28 - daysCompleted),
  }
}

/**
 * Construye una lista ordenada de pilares para asignar a días de estudio.
 * Los pilares más débiles aparecen más veces (20 slots para 5 días/semana × 4 semanas).
 */
function buildPillarSchedule(pillarAverages: PillarStat[]): PillarCode[] {
  const CODES: PillarCode[] = ['1.0', '2.0', '3.0', '4.0', '5.0']
  const TOTAL_STUDY_DAYS = 20 // 5 días × 4 semanas

  // Si no hay datos, distribuye equitativamente
  const hasData = pillarAverages.some(p => p.attempts > 0)
  if (!hasData) {
    const schedule: PillarCode[] = []
    for (let i = 0; i < TOTAL_STUDY_DAYS; i++) {
      schedule.push(CODES[i % 5])
    }
    return schedule
  }

  // Score inverso: pilares con menor average reciben más peso
  const sorted = [...pillarAverages].sort((a, b) => a.average - b.average)

  // Pesos: el más débil = 5 slots, el segundo = 4, …, el más fuerte = 2
  const weights = [5, 4, 4, 4, 3]
  const schedule: PillarCode[] = []

  sorted.forEach((p, idx) => {
    const code = p.code as PillarCode
    const count = weights[idx] ?? 2
    for (let j = 0; j < count; j++) {
      schedule.push(code)
    }
  })

  // Intercala para que no queden pilares agrupados
  return interleave(schedule)
}

function interleave(arr: PillarCode[]): PillarCode[] {
  const result: PillarCode[] = []
  const seen = new Set<PillarCode>()
  const remaining = [...arr]

  while (remaining.length > 0) {
    const lastAdded = result[result.length - 1]
    const idx = remaining.findIndex(c => c !== lastAdded)
    if (idx === -1) {
      result.push(...remaining.splice(0))
    } else {
      result.push(remaining.splice(idx, 1)[0])
    }
    seen.add(result[result.length - 1])
  }

  return result
}
