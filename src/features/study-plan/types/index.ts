import type { PillarCode } from '@/features/simulation/types'

export interface StudyDay {
  dayNumber: number       // 1–28
  date: Date
  type: 'study' | 'exam' | 'rest'
  pillarCode?: PillarCode
  pillarName?: string
  topic: string
  durationMinutes: number
  isToday: boolean
  isPast: boolean
  topicKey: string        // unique key for tracking progress
  isCompleted?: boolean   // true if marked as studied
}

export interface StudyWeek {
  weekNumber: number      // 1–4
  label: string
  focus: string
  days: StudyDay[]
}

export interface StudyPlan {
  weeks: StudyWeek[]
  startDate: Date
  endDate: Date
  totalDays: number
  daysCompleted: number
  daysRemaining: number
}
