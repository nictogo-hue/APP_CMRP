export interface TextChunk {
  content: string
  index: number
}

/**
 * Divide texto en chunks de ~500 chars con overlap de ~50 chars.
 * Intenta cortar en punto, coma o salto de línea para no romper frases.
 */
export function chunkText(text: string, maxSize = 500, overlap = 50): TextChunk[] {
  // Normalizar espacios y saltos de línea excesivos
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  if (normalized.length <= maxSize) {
    return normalized.length > 20 ? [{ content: normalized, index: 0 }] : []
  }

  const chunks: TextChunk[] = []
  let start = 0
  let idx = 0

  while (start < normalized.length) {
    let end = start + maxSize

    if (end >= normalized.length) {
      // Último chunk
      const content = normalized.slice(start).trim()
      if (content.length > 20) chunks.push({ content, index: idx++ })
      break
    }

    // Buscar punto de corte natural (hacia atrás desde end)
    let cutAt = end
    for (let i = end; i > start + maxSize / 2; i--) {
      const ch = normalized[i]
      if (ch === '\n' || ch === '.' || ch === ';') {
        cutAt = i + 1
        break
      }
    }

    const content = normalized.slice(start, cutAt).trim()
    if (content.length > 20) chunks.push({ content, index: idx++ })

    // Avanzar con overlap
    start = Math.max(start + 1, cutAt - overlap)
  }

  return chunks
}
