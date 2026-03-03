import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSM2 } from '@/features/flashcards/services/sm2'
import type { FlashcardRating } from '@/features/flashcards/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { flashcardId, rating } = await request.json() as {
    flashcardId: string
    rating: FlashcardRating
  }

  const { data: card } = await supabase
    .from('flashcards')
    .select('ease_factor, interval_days, repetitions')
    .eq('id', flashcardId)
    .eq('user_id', user.id)
    .single()

  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = calculateSM2(rating, card.ease_factor, card.interval_days, card.repetitions)

  await supabase.from('flashcards').update({
    ease_factor: result.ease_factor,
    interval_days: result.interval_days,
    repetitions: result.repetitions,
    next_review_at: result.next_review_at.toISOString(),
    last_reviewed_at: new Date().toISOString(),
  }).eq('id', flashcardId).eq('user_id', user.id)

  return NextResponse.json({ ok: true, next_review: result.next_review_at })
}
