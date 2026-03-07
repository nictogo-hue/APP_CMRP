import { NextRequest, NextResponse } from 'next/server'
import { findRelevantChunksEdge, formatContext } from '@/lib/ai/rag'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json() as { query: string }
    if (!query?.trim()) return NextResponse.json({ context: '', sources: [], found: false })

    // Usar la versión Edge para evitar problemas con cookies en Vercel
    const chunks = await findRelevantChunksEdge(query.trim(), 0.35, 5)

    const context = formatContext(chunks)
    const sources = [...new Set(chunks.map(c => c.source_display_name).filter(Boolean))]

    return NextResponse.json({
      context,
      sources,
      found: chunks.length > 0
    })
  } catch (err) {
    console.error('RAG Route Error:', err)
    return NextResponse.json({ context: '', sources: [], found: false, error: true })
  }
}
