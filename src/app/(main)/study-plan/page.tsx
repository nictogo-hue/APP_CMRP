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

  const analytics = await getAnalyticsData()
  const plan = generateStudyPlan(analytics.pillarAverages)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plan de Estudio</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          4 semanas · adaptado a tus pilares más débiles
        </p>
      </div>
      <StudyPlanView plan={plan} hasData={analytics.hasData} />
    </div>
  )
}
