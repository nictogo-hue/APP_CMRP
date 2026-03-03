import type { FlashcardRating, SM2Result } from '../types'

/**
 * Algoritmo SM-2 (SuperMemo 2) para repetición espaciada.
 * Rating: 0=Again, 1=Hard, 2=Good, 3=Easy
 */
export function calculateSM2(
  rating: FlashcardRating,
  currentEaseFactor: number,
  currentInterval: number,
  currentRepetitions: number,
): SM2Result {
  let ease = currentEaseFactor
  let interval = currentInterval
  let reps = currentRepetitions

  if (rating === 0) {
    // Again — resetear
    reps = 0
    interval = 0
    // ease_factor baja
    ease = Math.max(1.3, ease - 0.2)
  } else {
    // Hard / Good / Easy
    const quality = rating === 1 ? 3 : rating === 2 ? 4 : 5

    if (reps === 0) {
      interval = 1
    } else if (reps === 1) {
      interval = 3
    } else {
      interval = Math.round(interval * ease)
    }

    reps += 1
    ease = Math.max(1.3, ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  }

  const next = new Date()
  next.setDate(next.getDate() + Math.max(1, interval))
  next.setHours(0, 0, 0, 0)

  return {
    ease_factor: Math.round(ease * 100) / 100,
    interval_days: interval,
    repetitions: reps,
    next_review_at: next,
  }
}
