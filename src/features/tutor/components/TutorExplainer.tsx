'use client'

import { useState, useRef } from 'react'

interface TutorExplainerProps {
  questionText: string
  options: { a: string; b: string; c: string; d: string }
  correctAnswer: string
  userAnswer: string
  explanation?: string
}

export function TutorExplainer({
  questionText,
  options,
  correctAnswer,
  userAnswer,
  explanation,
}: TutorExplainerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function handleAsk() {
    if (loading) return
    if (isOpen && text) { setIsOpen(false); return }

    setIsOpen(true)
    setLoading(true)
    setText('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/tutor/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText, options, correctAnswer, userAnswer, explanation }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Error del servidor')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Parse text/plain stream chunks
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.trim()) continue

          if (line.startsWith('0:')) {
            // AI SDK text stream format: 0:"text"
            try {
              const parsed = JSON.parse(line.slice(2))
              if (typeof parsed === 'string') setText((prev) => prev + parsed)
            } catch {
              // ignore malformed chunks
            }
          } else {
            // Fallback para texto plano
            setText((prev) => prev + line)
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setText('Error al conectar con el tutor. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    abortRef.current?.abort()
    setIsOpen(false)
    setText('')
  }

  return (
    <div className="mt-3 ml-9">
      <button
        type="button"
        onClick={handleAsk}
        className="
          inline-flex items-center gap-1.5 text-xs font-medium
          text-primary-600 hover:text-primary-700 transition-colors
          px-2.5 py-1.5 rounded-lg
          bg-primary-50 hover:bg-primary-100
          border border-primary-200
        "
      >
        {loading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analizando...
          </>
        ) : isOpen && text ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Ocultar explicación
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Explicar con Tutor IA
          </>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200 p-4 text-xs text-foreground leading-relaxed relative animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-primary-600 font-semibold">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Tutor CMRP
            </div>
            {!loading && (
              <button
                type="button"
                onClick={handleClose}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          {text ? (
            <div className="whitespace-pre-wrap text-foreground-secondary">
              {text}
              {loading && <span className="inline-block w-1 h-3 bg-primary-500 ml-0.5 animate-pulse" />}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-foreground-muted">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Buscando contexto en la biblioteca CMRP...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
