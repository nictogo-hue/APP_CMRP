import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAnalyticsData } from '@/features/analytics/services/analyticsService'
import { generateStudyPlan } from '@/features/study-plan/services/studyPlanService'
import { StudyPlanView } from '@/features/study-plan/components/StudyPlanView'

export const metadata = { title: 'Plan de Estudio | CMRP Mastery' }

export default async function StudyPlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [analytics, profileResult, progressResult] = await Promise.all([
    getAnalyticsData(),
    supabase.from('profiles').select('exam_date, study_hours_per_day').eq('id', user.id).single(),
    supabase.from('study_progress').select('topic_key').eq('user_id', user.id),
  ])

  const examDate = profileResult.data?.exam_date ?? null
  const studyHoursPerDay = profileResult.data?.study_hours_per_day ?? 1.5
  const completedTopics = (progressResult.data ?? []).map(r => r.topic_key)

  const plan = generateStudyPlan({
    pillarAverages: analytics.pillarAverages,
    examDate: examDate ? new Date(examDate) : null,
    studyHoursPerDay,
    completedTopics,
  })

  const daysUntilExam = examDate
    ? Math.max(0, Math.floor((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plan de Estudio</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          {examDate
            ? `${plan.totalDays} días hasta el examen · adaptado a tus pilares · ${studyHoursPerDay}h/día${daysUntilExam !== null ? ` · Faltan ${daysUntilExam} días` : ''}`
            : '4 semanas · adaptado a tus pilares más débiles'
          }
        </p>
      </div>
      <StudyPlanView plan={plan} hasData={analytics.hasData} examDate={examDate} />
    </div>
  )
}
