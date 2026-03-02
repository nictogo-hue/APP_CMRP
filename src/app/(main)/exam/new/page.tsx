import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createExamSession } from '@/features/simulation/services/examService'
import { EXAM_CONSTANTS, PILLAR_NAMES, PILLAR_CODES } from '@/features/simulation/types'
import Link from 'next/link'

export const metadata = { title: 'Nuevo Simulacro CMRP' }

// ─── Server Action ────────────────────────────────────────────
async function startExam() {
  'use server'
  const { sessionId } = await createExamSession()
  redirect(`/exam/${sessionId}`)
}

// ─── Page ─────────────────────────────────────────────────────
export default async function NewExamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const hours = Math.floor(EXAM_CONSTANTS.TIME_LIMIT_MINUTES / 60)
  const mins  = EXAM_CONSTANTS.TIME_LIMIT_MINUTES % 60

  const rules = [
    `${EXAM_CONSTANTS.TOTAL_QUESTIONS} preguntas de opción múltiple`,
    `Tiempo límite: ${hours}h ${mins}m`,
    'Puedes navegar libremente entre preguntas',
    'Puedes marcar preguntas para revisión posterior',
    'Tus respuestas se guardan automáticamente',
    `Puntaje mínimo de aprobación: ${EXAM_CONSTANTS.PASSING_SCORE}%`,
  ]

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-foreground-muted mb-8">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground">Nuevo Simulacro</span>
      </div>

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-display-sm text-foreground">Simulacro de Examen CMRP</h1>
        <p className="mt-2 text-foreground-secondary max-w-md mx-auto">
          Replica las condiciones reales del examen de certificación CMRP de SMRP.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Reglas */}
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Reglas del examen
          </h2>
          <ul className="space-y-2.5">
            {rules.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5 text-sm text-foreground-secondary">
                <svg className="w-4 h-4 text-success-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Pilares SMRP */}
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Pilares SMRP evaluados
          </h2>
          <ul className="space-y-2">
            {PILLAR_CODES.map((code) => (
              <li key={code} className="flex items-center gap-2.5 text-sm">
                <span className="w-7 h-7 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary-500">
                  {code.split('.')[0]}
                </span>
                <span className="text-foreground-secondary">{PILLAR_NAMES[code]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <form action={startExam}>
        <button
          type="submit"
          className="
            w-full py-4 px-6 rounded-2xl font-bold text-lg text-white
            bg-gradient-to-r from-primary-500 to-accent-500
            hover:from-primary-600 hover:to-accent-600
            transition-all shadow-elevated hover:shadow-modal
            flex items-center justify-center gap-3
          "
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Iniciar Simulacro
        </button>
      </form>

      <p className="text-center text-xs text-foreground-muted mt-4">
        Una vez iniciado, el cronómetro no se puede pausar.
      </p>
    </div>
  )
}
