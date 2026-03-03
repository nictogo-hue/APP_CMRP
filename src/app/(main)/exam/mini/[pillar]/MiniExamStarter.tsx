'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PillarCode } from '@/features/simulation/types'

export function MiniExamStarter({ pillarCode, examSize, userId }: {
  pillarCode: PillarCode
  examSize: number
  userId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function start() {
    setLoading(true)
    const res = await fetch('/api/exam/mini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pillarCode, examSize }),
    })
    if (res.ok) {
      const { sessionId } = await res.json()
      router.push(`/exam/${sessionId}`)
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={start}
      disabled={loading}
      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
    >
      {loading ? 'Preparando examen...' : `Iniciar Mini-Examen (${examSize} preguntas)`}
    </button>
  )
}
