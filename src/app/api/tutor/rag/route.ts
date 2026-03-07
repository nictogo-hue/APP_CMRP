import { NextRequest, NextResponse } from 'next/server'
import { findRelevantChunks, formatContext } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json() as { query: string }
    if (!query?.trim()) return NextResponse.json({ context: '', sources: [], found: false })

    const chunks = await findRelevantChunks(query.trim(), 0.35, 5)
    const context = formatContext(chunks)
    const sources = [...new Set(chunks.map(c => c.source_display_name).filter(Boolean))]

    return NextResponse.json({ context, sources, found: chunks.length > 0 })
  } catch {
    return NextResponse.json({ context: '', sources: [], found: false })
  }
}
