import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Genera flashcards desde las preguntas incorrectas de una sesión
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await request.json() as { sessionId: string }

  // Obtener respuestas incorrectas de la sesión
  const { data: wrongAnswers } = await supabase
    .from('session_answers')
    .select('question_id, questions(id, pillar_code, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation)')
    .eq('session_id', sessionId)
    .eq('is_correct', false)

  if (!wrongAnswers || wrongAnswers.length === 0) {
    return NextResponse.json({ created: 0 })
  }

  let created = 0
  for (const answer of wrongAnswers) {
    const q = (Array.isArray(answer.questions) ? answer.questions[0] : answer.questions) as unknown as {
      id: string; pillar_code: string; question_text: string
      option_a: string; option_b: string; option_c: string; option_d: string
      correct_answer: string; explanation: string | null
    }
    if (!q) continue

    const optionMap: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d }
    const correctText = optionMap[q.correct_answer] ?? ''
    const back = q.explanation
      ? `${q.correct_answer}) ${correctText}\n\n${q.explanation}`
      : `${q.correct_answer}) ${correctText}`

    const { error } = await supabase
      .from('flashcards')
      .upsert({
        user_id: user.id,
        question_id: q.id,
        front: q.question_text,
        back,
        pillar_code: q.pillar_code,
        next_review_at: new Date().toISOString(),
      }, { onConflict: 'user_id,question_id', ignoreDuplicates: true })

    if (!error) created++
  }

  return NextResponse.json({ created })
}
