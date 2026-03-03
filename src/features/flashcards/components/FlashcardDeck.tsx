'use client'

import { useState } from 'react'
import type { Flashcard, FlashcardRating } from '../types'

interface Props {
  cards: Flashcard[]
  onComplete: () => void
}

const RATINGS: { value: FlashcardRating; label: string; color: string; desc: string }[] = [
  { value: 0, label: 'Otra vez', color: 'bg-red-600 hover:bg-red-700', desc: 'No lo recuerdo' },
  { value: 1, label: 'Difícil', color: 'bg-orange-600 hover:bg-orange-700', desc: '<1 día' },
  { value: 2, label: 'Bien', color: 'bg-blue-600 hover:bg-blue-700', desc: '~3 días' },
  { value: 3, label: 'Fácil', color: 'bg-green-600 hover:bg-green-700', desc: '~7 días' },
]

export function FlashcardDeck({ cards, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  const card = cards[index]
  const isLast = index >= cards.length - 1

  async function handleRating(rating: FlashcardRating) {
    if (submitting) return
    setSubmitting(true)
    await fetch('/api/flashcards/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcardId: card.id, rating }),
    })
    setReviewed(r => r + 1)
    setSubmitting(false)
    setFlipped(false)
    if (isLast) {
      onComplete()
    } else {
      setIndex(i => i + 1)
    }
  }

  if (!card) return null

  const progress = Math.round((index / cards.length) * 100)

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
      {/* Progreso */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-foreground-secondary mb-2">
          <span>{index + 1} de {cards.length}</span>
          <span>{reviewed} revisadas · Pilar {card.pillar_code}</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Tarjeta */}
      <div
        className="w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '240px',
          }}
        >
          {/* Frente */}
          <div
            className="absolute inset-0 bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-blue-400 mb-3 font-medium uppercase tracking-wider">Pregunta</p>
            <p className="text-foreground text-base leading-relaxed">{card.front}</p>
            {!flipped && (
              <p className="text-xs text-foreground-muted mt-6">Toca para ver la respuesta</p>
            )}
          </div>

          {/* Reverso */}
          <div
            className="absolute inset-0 bg-surface border border-blue-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-green-400 mb-3 font-medium uppercase tracking-wider">Respuesta</p>
            <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">{card.back}</p>
          </div>
        </div>
      </div>

      {/* Botones de calificación */}
      {flipped ? (
        <div className="w-full">
          <p className="text-xs text-center text-foreground-secondary mb-3">¿Qué tan bien lo recordaste?</p>
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map(r => (
              <button
                key={r.value}
                onClick={() => handleRating(r.value)}
                disabled={submitting}
                className={`${r.color} text-white rounded-xl py-3 px-2 text-center transition-colors disabled:opacity-50`}
              >
                <p className="text-xs font-semibold">{r.label}</p>
                <p className="text-[10px] opacity-70 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Ver respuesta
        </button>
      )}
    </div>
  )
}
