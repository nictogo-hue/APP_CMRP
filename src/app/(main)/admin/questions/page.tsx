import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuestionsManager } from './QuestionsManager'

export const metadata = { title: 'Banco de Preguntas | CMRP Mastery' }

export default async function AdminQuestionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_code, pillar_code, pillar_name, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, is_active')
    .order('pillar_code', { ascending: true })
    .order('question_code', { ascending: true })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banco de Preguntas</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            {questions?.length ?? 0} preguntas totales · Gestiona el banco CMRP
          </p>
        </div>
      </div>
      <QuestionsManager initialQuestions={questions ?? []} />
    </div>
  )
}
