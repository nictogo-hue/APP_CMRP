import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { google, MODELS } from '@/lib/ai/google'
import { findRelevantChunks, formatContext } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { questionText, options, correctAnswer, userAnswer, explanation } = body as {
    questionText: string
    options: { a: string; b: string; c: string; d: string }
    correctAnswer: string
    userAnswer: string
    explanation?: string
  }

  if (!questionText || !correctAnswer || !userAnswer) {
    return new Response('Missing required fields', { status: 400 })
  }

  // Build search query for RAG
  const searchQuery = `${questionText} ${options[correctAnswer as keyof typeof options] ?? ''}`
  const chunks = await findRelevantChunks(searchQuery, 0.35, 5)
  const context = formatContext(chunks)

  const systemPrompt = `Eres el Tutor CMRP, un experto en mantenimiento y confiabilidad industrial con dominio del cuerpo de conocimiento SMRP y los 5 pilares CMRP. Tu rol es ayudar a candidatos a aprobar el examen de certificación CMRP.

Cuando explicas una pregunta incorrecta:
1. Explica por qué la respuesta correcta es correcta (conciso, 2-3 líneas)
2. Explica por qué la respuesta del candidato era incorrecta (1-2 líneas)
3. Menciona el concepto clave que hay que recordar
4. Si hay contexto de la biblioteca, úsalo para dar una explicación más profunda

Responde en español. Sé directo y pedagógico. Usa terminología técnica correcta del SMRP Body of Knowledge.`

  const userMessage = `El candidato respondió incorrectamente esta pregunta:

**Pregunta:** ${questionText}

**Opciones:**
A) ${options.a}
B) ${options.b}
C) ${options.c}
D) ${options.d}

**Respuesta del candidato:** ${userAnswer.toUpperCase()}) ${options[userAnswer as keyof typeof options]}
**Respuesta correcta:** ${correctAnswer.toUpperCase()}) ${options[correctAnswer as keyof typeof options]}
${explanation ? `\n**Explicación del banco de preguntas:** ${explanation}` : ''}
${context ? `\n**Contexto relevante de la biblioteca CMRP:**\n${context}` : ''}

Explica por qué la respuesta correcta es la correcta y ayuda al candidato a entender el concepto.`

  const result = streamText({
    model: google(MODELS.chat),
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  return result.toTextStreamResponse()
}
