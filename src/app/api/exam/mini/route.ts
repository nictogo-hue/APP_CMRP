import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PillarCode } from '@/features/simulation/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pillarCode, examSize = 15 } = await request.json() as {
    pillarCode: PillarCode
    examSize: number
  }

  // Seleccionar preguntas aleatorias del pilar
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('pillar_code', pillarCode)
    .eq('is_active', true)

  if (!questions || questions.length < 5) {
    return NextResponse.json({ error: 'Not enough questions' }, { status: 400 })
  }

  // Mezclar y tomar las primeras examSize
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, examSize)

  // Crear sesión de examen
  const { data: session, error } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: user.id,
      status: 'in_progress',
      total_questions: shuffled.length,
      time_limit_minutes: 20,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Crear session_answers
  const answers = shuffled.map((q, idx) => ({
    session_id: session.id,
    question_id: q.id,
    question_order: idx + 1,
    selected_answer: null,
    is_flagged: false,
    is_correct: null,
  }))

  await supabase.from('session_answers').insert(answers)

  return NextResponse.json({ sessionId: session.id })
}
