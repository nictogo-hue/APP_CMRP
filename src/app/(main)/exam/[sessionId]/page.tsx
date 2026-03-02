import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamRunner } from '@/features/simulation/components/ExamRunner'

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { sessionId } = await params
  return { title: `Examen · ${sessionId.slice(0, 8)}` }
}

export default async function ExamPage({ params }: Props) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar que la sesión existe y pertenece al usuario
  const { data: session, error } = await supabase
    .from('exam_sessions')
    .select('id, status, user_id')
    .eq('id', sessionId)
    .single()

  if (error || !session) return notFound()
  if (session.user_id !== user.id) return notFound()

  // Si ya está completada, redirigir a resultados
  if (session.status !== 'in_progress') {
    redirect(`/exam/${sessionId}/results`)
  }

  return <ExamRunner sessionId={sessionId} />
}
