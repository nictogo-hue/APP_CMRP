'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'

const STARTER_QUESTIONS = [
  '¿Cuál es la diferencia entre mantenimiento preventivo y predictivo?',
  '¿Qué es RCM y cuáles son sus 7 preguntas fundamentales?',
  '¿Cómo se calcula el OEE y qué factores lo componen?',
  '¿Qué es FMEA y cómo se aplica en mantenimiento?',
]

function getTextFromMessage(msg: UIMessage): string {
  if (!msg.parts) return ''
  for (const part of msg.parts) {
    if (part.type === 'text') return part.text
  }
  return ''
}

export function TutorChat() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/tutor/chat' }),
  })

  const isLoading  = status === 'streaming' || status === 'submitted'
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await sendMessage({ text })
  }

  function handleStarterClick(question: string) {
    setInput(question)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Tutor CMRP</h2>
            <p className="text-sm text-foreground-secondary max-w-xs mb-8">
              Pregúntame sobre cualquier concepto del cuerpo de conocimiento SMRP. Tengo contexto de 22 libros de la biblioteca CMRP.
            </p>

            {/* Starter questions */}
            <div className="w-full max-w-sm space-y-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleStarterClick(q)}
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
          messages.map((msg) => {
            const text = getTextFromMessage(msg)
            if (!text && msg.role === 'assistant' && !isLoading) return null
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div
                  className={`
                    max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-tr-sm'
                      : 'bg-surface border border-border text-foreground rounded-tl-sm'
                    }
                  `}
                >
                  <div className="whitespace-pre-wrap">{text}</div>
                </div>

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

        {/* Loading indicator */}
        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="bg-surface border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
              </div>
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
            className="
              flex-1 resize-none rounded-xl border border-border
              bg-surface px-4 py-3 text-sm text-foreground
              placeholder:text-foreground-muted
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              max-h-32 overflow-y-auto
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
          Respaldado por 22 libros CMRP · Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
