import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard'

export const metadata = { title: 'Mi Progreso | CMRP Mastery' }

export default function AnalyticsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Progreso</h1>
        <p className="text-sm text-foreground-secondary mt-1">
          Análisis de tu rendimiento en los 5 pilares SMRP
        </p>
      </div>
      <AnalyticsDashboard />
    </div>
  )
}
