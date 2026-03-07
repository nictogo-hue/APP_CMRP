'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Tipos ────────────────────────────────────────────────────

type ChatStatus = 'idle' | 'searching' | 'streaming'

interface RagResult {
  context: string
  sources: string[]
  found: boolean
  error: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: string[]      // fuentes usadas de la biblioteca
  ragNoContext?: boolean  // RAG ok pero sin chunks relevantes
  ragError?: boolean      // RAG falló (timeout / error de red)
}

// ─── RAG fetch con 5s timeout ────────────────────────────────

async function fetchRagContext(query: string): Promise<RagResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch('/api/tutor/rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return { context: '', sources: [], found: false, error: true }
    const data = await res.json() as { context: string; sources: string[]; found: boolean }
    return { ...data, error: false }
  } catch {
    return { context: '', sources: [], found: false, error: true }
  }
}

// ─── Constantes ───────────────────────────────────────────────

const STARTER_QUESTIONS = [
  '¿Cuál es la diferencia entre mantenimiento preventivo y predictivo?',
  '¿Qué es RCM y cuáles son sus 7 preguntas fundamentales?',
  '¿Cómo se calcula el OEE y qué factores lo componen?',
  '¿Qué es FMEA y cómo se aplica en mantenimiento?',
]

// ─── Componente principal ─────────────────────────────────────

export function TutorChat({ initialTopic }: { initialTopic?: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<ChatStatus>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sentInitial = useRef(false)
  const sendTextRef = useRef<((text: string) => Promise<void>) | undefined>(undefined)

  const isLoading = status !== 'idle'
  const isSearching = status === 'searching'
  const isStreaming = status === 'streaming'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSearching])

  const sendText = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: trimmed }

    // Construir historial para la API ANTES de actualizar el estado
    const apiMessages = [...messages, userMsg].map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: m.text }],
      metadata: {} as Record<string, unknown>,
    }))

    setMessages(prev => [...prev, userMsg])
    setStatus('searching')

    // Buscar contexto en la biblioteca (5s máximo)
    const rag = await fetchRagContext(trimmed)

    // Añadir placeholder del asistente con metadata RAG
    const assistantId = crypto.randomUUID()
    setStatus('streaming')
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      text: '',
      sources: !rag.error && rag.found ? rag.sources : undefined,
      ragNoContext: !rag.error && !rag.found,
      ragError: rag.error,
    }])

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, context: rag.context }),
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue

          if (line.startsWith('0:')) {
            try {
              const parsed = JSON.parse(line.slice(2))
              if (typeof parsed === 'string') {
                accumulated += parsed
                setMessages(prev =>
                  prev.map(m => m.id === assistantId ? { ...m, text: accumulated } : m)
                )
              }
            } catch { /* ignorar tramas malformadas */ }
          } else {
            // Fallback para texto plano (toTextStreamResponse)
            accumulated += line
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, text: accumulated } : m)
            )
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, text: 'Error al procesar tu consulta. Por favor, inténtalo de nuevo.' }
            : m
        )
      )
    } finally {
      setStatus('idle')
    }
  }, [messages, isLoading])

  // Mantener ref siempre actualizado (para initialTopic effect)
  useEffect(() => { sendTextRef.current = sendText }, [sendText])

  // Enviar tema inicial automáticamente
  useEffect(() => {
    if (initialTopic && !sentInitial.current) {
      sentInitial.current = true
      setTimeout(() => {
        void sendTextRef.current?.(
          `Explícame el concepto de ${initialTopic} en el contexto de la certificación CMRP`
        )
      }, 300)
    }
  }, [initialTopic])

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    void sendText(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0 && !isSearching

  return (
    <div className="flex flex-col h-full">

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {isEmpty ? (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Tutor CMRP</h2>
            <p className="text-sm text-foreground-secondary max-w-xs mb-8">
              Pregúntame sobre cualquier concepto del cuerpo de conocimiento SMRP.
              Busco primero en tus <strong className="text-foreground">22 libros indexados</strong> antes de responder.
            </p>
            <div className="w-full max-w-sm space-y-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  className="
                    w-full text-left px-4 py-3 rounded-xl text-sm
                    bg-surface border border-border
                    hover:border-primary-300 hover:bg-primary-50
                    text-foreground-secondary hover:text-foreground
                    transition-all group
                  "
                >
                  <span className="text-primary-400 group-hover:text-primary-500 mr-2">→</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Mensajes */
          messages.map((msg) => {
            // Omitir mensajes de asistente vacíos ya terminados
            if (msg.role === 'assistant' && !msg.text && !isStreaming) return null

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Ícono asistente */}
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Burbuja de mensaje */}
                <div
                  className={`
                    max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-tr-sm'
                      : 'bg-surface border border-border text-foreground rounded-tl-sm'
                    }
                  `}
                >
                  {/* Puntos de carga mientras el texto llega */}
                  {msg.role === 'assistant' && !msg.text && isStreaming ? (
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                    </div>
                  ) : (
                    <>
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* ── Footer de fuentes ── */}
                      {msg.role === 'assistant' && msg.text && (
                        <div className="mt-3 pt-2 border-t border-border/50">
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex items-start gap-1.5">
                              <span className="text-green-400 text-[11px] shrink-0 mt-0.5">📚</span>
                              <div>
                                <p className="text-[11px] text-green-400 font-medium">Fuentes de tu biblioteca:</p>
                                <p className="text-[10px] text-foreground-muted mt-0.5 leading-relaxed">
                                  {msg.sources.join(' · ')}
                                </p>
                              </div>
                            </div>
                          )}
                          {msg.ragNoContext && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-yellow-400 text-[11px]">⚠</span>
                              <p className="text-[10px] text-yellow-400/80">
                                Sin contexto relevante en la biblioteca — respuesta basada en conocimiento general de Gemini
                              </p>
                            </div>
                          )}
                          {msg.ragError && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-yellow-400 text-[11px]">⚠</span>
                              <p className="text-[10px] text-yellow-400/80">
                                Biblioteca no disponible — respuesta basada en conocimiento general de Gemini
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Ícono usuario */}
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-border flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-3.5 h-3.5 text-foreground-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })
        )}

        {/* Indicador: buscando en biblioteca */}
        {isSearching && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="bg-surface border border-green-500/30 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-xs text-green-400 animate-pulse">
                Buscando en tu biblioteca de 22 libros CMRP...
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre mantenimiento, confiabilidad, CMRP..."
            rows={1}
            disabled={isLoading}
            className="
              flex-1 resize-none rounded-xl border border-border
              bg-surface px-4 py-3 text-sm text-foreground
              placeholder:text-foreground-muted
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              max-h-32 overflow-y-auto
              disabled:opacity-60
            "
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 128) + 'px'
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="
              w-10 h-10 rounded-xl flex items-center justify-center shrink-0
              bg-primary-500 text-white
              hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-foreground-muted mt-2 text-center">
          Busca primero en 22 libros CMRP · Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
