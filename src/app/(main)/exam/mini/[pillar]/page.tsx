import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { PILLAR_NAMES } from '@/features/simulation/types'
import type { PillarCode } from '@/features/simulation/types'
import { MiniExamStarter } from './MiniExamStarter'

const VALID_PILLARS = ['1.0', '2.0', '3.0', '4.0', '5.0']

interface Props {
  params: Promise<{ pillar: string }>
}

export async function generateMetadata({ params }: Props) {
  const { pillar } = await params
  const name = PILLAR_NAMES[pillar as PillarCode] ?? 'Pilar'
  return { title: `Mini-Examen · ${name} | CMRP Mastery` }
}

export default async function MiniExamPage({ params }: Props) {
  const { pillar } = await params
  if (!VALID_PILLARS.includes(pillar)) return notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const pillarCode = pillar as PillarCode
  const pillarName = PILLAR_NAMES[pillarCode]

  // Contar preguntas disponibles en este pilar
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('pillar_code', pillarCode)
    .eq('is_active', true)

  const available = count ?? 0
  const examSize = Math.min(15, available)

  return (
    <div className="p-6 max-w-xl mx-auto space-y-8">
      <div>
        <Link href="/analytics" className="text-xs text-foreground-secondary hover:text-foreground mb-4 inline-flex items-center gap-1">
          ← Volver a Mi Progreso
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Mini-Examen de Refuerzo</h1>
        <p className="text-sm text-foreground-secondary mt-1">Pilar {pillarCode} — {pillarName}</p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{examSize}</p>
            <p className="text-xs text-foreground-secondary">preguntas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">20</p>
            <p className="text-xs text-foreground-secondary">minutos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">70%</p>
            <p className="text-xs text-foreground-secondary">para aprobar</p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-foreground-secondary leading-relaxed">
            Este mini-examen evalúa exclusivamente el <strong className="text-foreground">Pilar {pillarCode}: {pillarName}</strong>.
            Las respuestas incorrectas generan flashcards automáticamente.
          </p>
        </div>

        {available < 5 ? (
          <p className="text-sm text-yellow-400">No hay suficientes preguntas para este pilar ({available} disponibles).</p>
        ) : (
          <MiniExamStarter pillarCode={pillarCode} examSize={examSize} userId={user.id} />
        )}
      </div>
    </div>
  )
}
