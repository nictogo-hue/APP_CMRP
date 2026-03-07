import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import PDFDocument from 'pdfkit'

interface QuestionRow {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  pillar_name: string
  pillar_code: string
}

interface AnswerRow {
  id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  question: QuestionRow
}

interface SessionRow {
  id: string
  score_total: number | null
  submitted_at: string | null
  started_at: string
  total_questions: number
  user_id: string
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch session
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .select('id, score_total, submitted_at, started_at, total_questions, user_id')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const sessionData = session as SessionRow

  // Ensure user owns this session (or is admin)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (sessionData.user_id !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch answers with question data
  const { data: answers, error: answersError } = await supabase
    .from('session_answers')
    .select(`
      id,
      question_id,
      selected_answer,
      is_correct,
      question:questions (
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        pillar_name,
        pillar_code
      )
    `)
    .eq('session_id', sessionId)
    .order('question_order')

  if (answersError) {
    return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 })
  }

  const answersData = (answers ?? []) as unknown as AnswerRow[]

  // Build PDF
  const chunks: Buffer[] = []
  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  doc.on('data', (chunk: Buffer) => chunks.push(chunk))

  const pdfDone = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  // ── Header ──────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(20).text('CMRP Mastery — Reporte de Examen', { align: 'center' })
  doc.moveDown(0.5)

  const sessionDate = sessionData.submitted_at
    ? new Date(sessionData.submitted_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'En progreso'
  const scoreText = sessionData.score_total != null ? `${sessionData.score_total.toFixed(1)}%` : '—'
  const passed = (sessionData.score_total ?? 0) >= 70

  doc.font('Helvetica').fontSize(11)
  doc.text(`Fecha: ${sessionDate}`, { align: 'center' })
  doc.text(`Puntaje: ${scoreText}  |  ${passed ? 'APROBADO' : 'NO APROBADO'}`, { align: 'center' })
  doc.text(`Total de preguntas: ${sessionData.total_questions}`, { align: 'center' })
  doc.moveDown(1)

  // ── Summary by pillar ────────────────────────────────────────
  const pillarStats: Record<string, { name: string; correct: number; total: number }> = {}
  for (const a of answersData) {
    const code = a.question?.pillar_code ?? 'N/A'
    const name = a.question?.pillar_name ?? 'N/A'
    if (!pillarStats[code]) pillarStats[code] = { name, correct: 0, total: 0 }
    pillarStats[code].total++
    if (a.is_correct) pillarStats[code].correct++
  }

  doc.font('Helvetica-Bold').fontSize(13).text('Resumen por Pilar SMRP')
  doc.moveDown(0.3)

  for (const [code, stat] of Object.entries(pillarStats).sort()) {
    const pct = stat.total > 0 ? ((stat.correct / stat.total) * 100).toFixed(1) : '—'
    doc.font('Helvetica').fontSize(10)
      .text(`  Pilar ${code} — ${stat.name}: ${stat.correct}/${stat.total} (${pct}%)`)
  }
  doc.moveDown(1)

  // ── Answer table ─────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(13).text('Detalle de Respuestas')
  doc.moveDown(0.5)

  const ANSWER_LABEL: Record<string, string> = { A: 'option_a', B: 'option_b', C: 'option_c', D: 'option_d' }

  answersData.forEach((a, idx) => {
    const q = a.question
    if (!q) return

    const correct = a.is_correct === true
    const correctKey = q.correct_answer?.toUpperCase() as string
    const selectedKey = a.selected_answer?.toUpperCase() as string | undefined
    const correctText = q[ANSWER_LABEL[correctKey] as keyof QuestionRow] as string
    const selectedText = selectedKey ? q[ANSWER_LABEL[selectedKey] as keyof QuestionRow] as string : 'Sin responder'

    // Add new page if near bottom
    if (doc.y > 700) doc.addPage()

    doc.font('Helvetica-Bold').fontSize(9)
      .fillColor(correct ? '#166534' : '#991b1b')
      .text(`${idx + 1}. [${correct ? 'OK' : 'X'}] ${q.question_text}`, { width: 500 })

    doc.font('Helvetica').fontSize(8).fillColor('#374151')
    if (!correct) {
      doc.text(`   Tu respuesta: ${selectedKey ?? '—'}) ${selectedText}`, { width: 490 })
    }
    doc.text(`   Correcta: ${correctKey}) ${correctText}`, { width: 490 })
    doc.moveDown(0.4)
  })

  doc.end()

  const pdfBuffer = await pdfDone

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="cmrp-reporte-${sessionId.slice(0, 8)}.pdf"`,
    },
  })
}
