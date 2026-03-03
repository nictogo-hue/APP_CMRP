import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FlashcardsClient } from './FlashcardsClient'

export const metadata = { title: 'Flashcards | CMRP Mastery' }

export default async function FlashcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date().toISOString()

  // Tarjetas pendientes para hoy
  const { data: dueCards } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', user.id)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true })
    .limit(50)

  // Total de tarjetas
  const { count: total } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Repetición espaciada · Algoritmo SM-2
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-400">{dueCards?.length ?? 0}</p>
          <p className="text-xs text-foreground-secondary">pendientes hoy</p>
        </div>
      </div>

      {(dueCards?.length ?? 0) === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-4xl mb-3">🎉</p>
          <h3 className="text-lg font-semibold text-foreground mb-1">¡Al día!</h3>
          <p className="text-sm text-foreground-secondary mb-2">
            No tienes flashcards pendientes para hoy.
          </p>
          <p className="text-xs text-foreground-muted mb-6">
            {total ?? 0} tarjetas en total en tu mazo
          </p>
          {(total ?? 0) === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-foreground-secondary">
                Las flashcards se generan automáticamente desde tus respuestas incorrectas.
              </p>
              <Link href="/exam/new" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                Hacer un simulacro →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <FlashcardsClient cards={dueCards ?? []} />
      )}
    </div>
  )
}
