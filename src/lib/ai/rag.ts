import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from './embeddings'

export interface RelevantChunk {
  id: string
  content: string
  source_filename: string
  source_display_name: string
  similarity: number
}

/**
 * Busca chunks relevantes en la base de conocimiento usando similitud coseno.
 * @param query     Texto de la pregunta o tema a buscar
 * @param threshold Umbral mínimo de similitud (0-1). Default: 0.4
 * @param limit     Número máximo de resultados. Default: 6
 */
export async function findRelevantChunks(
  query: string,
  threshold = 0.4,
  limit = 6
): Promise<RelevantChunk[]> {
  const supabase = await createClient()

  const queryEmbedding = await generateEmbedding(query)

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('RAG search error:', error)
    return []
  }

  return (data ?? []) as RelevantChunk[]
}

/**
 * Formatea chunks encontrados como contexto para el LLM.
 * Incluye la fuente de cada fragmento.
 */
export function formatContext(chunks: RelevantChunk[]): string {
  if (chunks.length === 0) return ''

  return chunks
    .map((c, i) =>
      `[Fuente ${i + 1}: ${c.source_display_name}]\n${c.content}`
    )
    .join('\n\n---\n\n')
}
