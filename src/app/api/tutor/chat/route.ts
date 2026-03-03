import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { google, MODELS } from '@/lib/ai/google'
import { findRelevantChunks, formatContext } from '@/lib/ai/rag'

// Edge Runtime: 30s timeout en Vercel Hobby (vs 10s en serverless)
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body as { messages: UIMessage[] }

    if (!messages || messages.length === 0) {
      return new Response('Missing messages', { status: 400 })
    }

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    const query = lastUserMsg?.parts
      ?.find((p) => p.type === 'text')
      ?.text ?? ''

    // RAG con timeout agresivo de 4s para no bloquear la respuesta principal
    let context = ''
    if (query) {
      try {
        const chunks = await Promise.race([
          findRelevantChunks(query, 0.35, 5),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('RAG timeout')), 4000)
          )
        ])
        context = formatContext(chunks)
      } catch (e) {
        console.error('RAG Fallback:', e instanceof Error ? e.message : e)
        // Continúa sin contexto si falla
      }
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

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Hubo un error procesando tu consulta.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
