import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
    const auth = request.headers.get('x-debug-secret')
    if (auth !== 'cmrp-brain-debug') {
        return new Response('Unauthorized', { status: 401 })
    }

    const results = {
        env: {
            GOOGLE_KEY: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            GOOGLE_KEY_START: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.slice(0, 10),
        },
        database: {
            connected: false,
            chunks: 0,
            sources: 0,
            error: null as string | null
        }
    }

    try {
        const supabase = createServiceClient()
        const { count: chunks, error: e1 } = await supabase.from('document_chunks').select('*', { count: 'exact', head: true })
        const { count: sources, error: e2 } = await supabase.from('document_sources').select('*', { count: 'exact', head: true })

        results.database.chunks = chunks || 0
        results.database.sources = sources || 0
        results.database.connected = !e1 && !e2
        results.database.error = e1?.message || e2?.message || null
    } catch (err) {
        results.database.error = err instanceof Error ? err.message : String(err)
    }

    return NextResponse.json(results)
}
