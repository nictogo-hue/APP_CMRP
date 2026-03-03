'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlashcardDeck } from '@/features/flashcards/components/FlashcardDeck'
import type { Flashcard } from '@/features/flashcards/types'

export function FlashcardsClient({ cards }: { cards: Flashcard[] }) {
  const router = useRouter()
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="text-center py-16 border border-green-500/30 bg-green-500/5 rounded-2xl">
        <p className="text-4xl mb-3">✅</p>
        <h3 className="text-lg font-semibold text-foreground mb-1">Sesión completada</h3>
        <p className="text-sm text-foreground-secondary mb-6">
          Revisaste {cards.length} flashcard{cards.length !== 1 ? 's' : ''}. El sistema programó las próximas revisiones.
        </p>
        <button
          onClick={() => router.refresh()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Ver mazo actualizado
        </button>
      </div>
    )
  }

  return <FlashcardDeck cards={cards} onComplete={() => setDone(true)} />
}
