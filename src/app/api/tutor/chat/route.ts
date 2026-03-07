import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { google, MODELS } from '@/lib/ai/google'

// Edge Runtime: sin dependencias de Supabase ni cookies
// El contexto RAG llega pre-calculado desde el cliente
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json() as {
      messages: UIMessage[]
      context?: string
    }

    if (!messages?.length) {
      return new Response('Missing messages', { status: 400 })
    }

    const systemPrompt = `Eres el Tutor CMRP, un experto en mantenimiento y confiabilidad industrial especializado en el cuerpo de conocimiento SMRP y los 5 pilares de la certificación CMRP.

Tu rol es ayudar a candidatos a prepararse para el examen CMRP de SMRP.
Responde en español. Usa terminología técnica correcta. Sé preciso y pedagógico.

${context ? `Usa este contexto técnico para tu respuesta:\n${context}` : 'Responde con tu conocimiento general de CMRP SMRP.'}`

    const result = streamText({
      model: google(MODELS.chat),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Hubo un error procesando tu consulta.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
