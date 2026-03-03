import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamResults } from '@/features/simulation/components/ExamResults'
import { buildExamResults } from '@/features/simulation/services/scoringService'
import type { ExamSession, SessionAnswerWithQuestion } from '@/features/simulation/types'

interface Props {
  params: Promise<{ sessionId: string }>
}

export async function generateMetadata({ params }: Props) {
  const { sessionId } = await params
  return { title: `Resultados · ${sessionId.slice(0, 8)}` }
}

export default async function ResultsPage({ params }: Props) {
  const { sessionId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener sesión
  const { data: session, error: sError } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sError || !session) return notFound()
  if (session.user_id !== user.id) return notFound()

  // Si aún está en curso, redirigir al examen
  if (session.status === 'in_progress') {
    redirect(`/exam/${sessionId}`)
  }

  // Obtener respuestas con preguntas completas
  const { data: answers, error: aError } = await supabase
    .from('session_answers')
    .select(`
      *,
      question:questions(*)
    `)
    .eq('session_id', sessionId)
    .order('question_order', { ascending: true })

  if (aError || !answers) return notFound()

  // Supabase devuelve relaciones como array — normalizar
  const normalizedAnswers = answers.map((a) => ({
    ...a,
    question: Array.isArray(a.question) ? a.question[0] : a.question,
  })) as SessionAnswerWithQuestion[]

  const results = buildExamResults(session as ExamSession, normalizedAnswers)

  // Auto-generar flashcards desde respuestas incorrectas (fire & forget)
  const wrongCount = normalizedAnswers.filter(a => a.is_correct === false).length
  if (wrongCount > 0) {
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {/* non-blocking */})
  }

  return <ExamResults results={results} />
}
