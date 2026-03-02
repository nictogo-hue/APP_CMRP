import { NextRequest } from 'next/server'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { google, MODELS } from '@/lib/ai/google'
import { findRelevantChunks, formatContext } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { messages } = body as { messages: UIMessage[] }

  if (!messages || messages.length === 0) {
    return new Response('Missing messages', { status: 400 })
  }

  // Build search query from the last user message
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const query = lastUserMsg?.parts
    ?.find((p) => p.type === 'text')
    ?.text ?? ''

  const chunks = query ? await findRelevantChunks(query, 0.35, 6) : []
  const context = formatContext(chunks)

  const systemPrompt = `Eres el Tutor CMRP, un experto en mantenimiento y confiabilidad industrial especializado en el cuerpo de conocimiento SMRP y los 5 pilares de la certificación CMRP:

1. Gestión del Negocio y Organización del Mantenimiento
2. Gestión de los Equipos y Procesos de Mantenimiento
3. Confiabilidad de los Equipos y Gestión de Activos
4. Gestión de las Personas
5. Gestión y Sistemas de Información

Tu rol es ayudar a candidatos a prepararse para el examen CMRP de SMRP. Puedes:
- Explicar conceptos del Body of Knowledge
- Responder preguntas sobre mantenimiento y confiabilidad
- Crear analogías y ejemplos prácticos
- Aclarar diferencias entre conceptos similares (PM vs PdM, FMEA vs RCM, etc.)

Responde en español. Usa terminología técnica correcta. Sé preciso y pedagógico.
${context ? `\nContexto relevante de la biblioteca CMRP para esta consulta:\n${context}` : ''}`

  const result = streamText({
    model: google(MODELS.chat),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
