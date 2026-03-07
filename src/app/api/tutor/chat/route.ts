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

    console.log('[TutorChat] POST received. Messages:', messages?.length)
    console.log('[TutorChat] API Key exists:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    console.log('[TutorChat] Model:', MODELS.chat)

    if (!messages?.length) {
      return new Response('Missing messages', { status: 400 })
    }

    const systemPrompt = `Eres el Tutor CMRP, un experto en mantenimiento y confiabilidad industrial especializado en el cuerpo de conocimiento SMRP y los 5 pilares de la certificación CMRP.

Tu rol es ayudar a candidatos a prepararse para el examen CMRP de SMRP.
Responde en español. Usa terminología técnica correcta. Sé preciso y pedagógico.

${context ? `Usa este contexto técnico para tu respuesta:\n${context}` : 'Responde con tu conocimiento general de CMRP SMRP.'}`

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('ERROR: GOOGLE_GENERATIVE_AI_API_KEY is missing in production')
      return new Response(
        JSON.stringify({ error: 'Configuración incompleta: GOOGLE_GENERATIVE_AI_API_KEY no encontrada en Vercel.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = streamText({
      model: google(MODELS.chat),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })

    return result.toTextStreamResponse()
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Chat API Error:', errorMsg)
    return new Response(
      JSON.stringify({
        error: 'Hubo un error procesando tu consulta.',
        details: errorMsg
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
