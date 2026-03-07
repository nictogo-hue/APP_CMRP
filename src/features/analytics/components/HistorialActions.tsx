'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sessionId: string
  isAdmin?: boolean
}

export function ReportButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/exam/report/${sessionId}`)
      if (!res.ok) throw new Error('Error generando reporte')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cmrp-reporte-${sessionId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al generar el reporte PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-xs px-2 py-1 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : '📄 Reporte'}
    </button>
  )
}

export function ClearHistoryButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClear = async () => {
    if (!confirm('¿Eliminar TODO el historial de exámenes? Esta acción no se puede deshacer.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/clear-history', { method: 'DELETE' })
      const data = await res.json() as { deleted?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Error')
      alert(`Historial eliminado (${data.deleted ?? 0} sesiones)`)
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error eliminando historial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600/20 transition-colors disabled:opacity-50"
    >
      {loading ? 'Eliminando...' : '🗑 Borrar historial'}
    </button>
  )
}
