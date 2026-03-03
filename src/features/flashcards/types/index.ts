export interface Flashcard {
  id: string
  user_id: string
  question_id: string
  front: string
  back: string
  pillar_code: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_reviewed_at: string | null
  created_at: string
}

// SM-2 ratings
export type FlashcardRating = 0 | 1 | 2 | 3  // 0=Again, 1=Hard, 2=Good, 3=Easy

export interface SM2Result {
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: Date
}
