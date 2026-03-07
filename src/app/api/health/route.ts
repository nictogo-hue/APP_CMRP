import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: 'ok',
        version: '1.0.1-diag',
        timestamp: new Date().toISOString(),
        env: {
            GOOGLE: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
            SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_ROLE: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
    })
}
