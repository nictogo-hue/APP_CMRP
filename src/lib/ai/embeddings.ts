const EMBED_MODEL = 'gemini-embedding-001'
const OUTPUT_DIMS = 768

function getApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!key) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
  return key
}

/** Genera embedding de un texto. Retorna vector de 768 dimensiones. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text])
  return embeddings[0]
}

/** Genera embeddings de múltiples textos en batch. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = getApiKey()
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${EMBED_MODEL}`,
          content: { parts: [{ text: text.slice(0, 2048) }] },
          outputDimensionality: OUTPUT_DIMS,
        })),
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Embeddings error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as { embeddings: Array<{ values: number[] }> }
  return data.embeddings.map((e) => e.values)
}
