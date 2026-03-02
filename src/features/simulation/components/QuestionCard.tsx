'use client'

import type { Question, AnswerLetter } from '../types'

const OPTIONS: AnswerLetter[] = ['A', 'B', 'C', 'D']

const optionLabel: Record<AnswerLetter, string> = {
  A: 'option_a',
  B: 'option_b',
  C: 'option_c',
  D: 'option_d',
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  selectedAnswer: AnswerLetter | null
  isFlagged: boolean
  onSelectAnswer: (answer: AnswerLetter) => void
  onToggleFlag: () => void
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onToggleFlag,
}: QuestionCardProps) {
  const pillarColors: Record<string, string> = {
    '1.0': 'bg-blue-50 text-blue-700 border-blue-200',
    '2.0': 'bg-teal-50 text-teal-700 border-teal-200',
    '3.0': 'bg-purple-50 text-purple-700 border-purple-200',
    '4.0': 'bg-orange-50 text-orange-700 border-orange-200',
    '5.0': 'bg-green-50 text-green-700 border-green-200',
  }

  const difficultyColors: Record<string, string> = {
    'Fácil':  'text-success-600',
    'Media':  'text-warning-700',
    'Difícil': 'text-error-600',
  }

  return (
    <div className="bg-surface rounded-2xl shadow-card border border-border p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground-muted">
            Pregunta {questionNumber} de {totalQuestions}
          </span>
          <span className="text-foreground-muted">·</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${pillarColors[question.pillar_code] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {question.pillar_name}
          </span>
          <span className={`text-xs font-medium ${difficultyColors[question.difficulty] ?? ''}`}>
            {question.difficulty}
          </span>
        </div>

        {/* Flag button */}
        <button
          type="button"
          onClick={onToggleFlag}
          aria-label={isFlagged ? 'Quitar marca de revisión' : 'Marcar para revisión'}
          className={`
            shrink-0 p-2 rounded-lg transition-colors
            ${isFlagged
              ? 'bg-warning-100 text-warning-700 hover:bg-warning-200'
              : 'bg-border-light text-foreground-muted hover:bg-border hover:text-foreground'
            }
          `}
        >
          <svg className="w-4 h-4" fill={isFlagged ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18M3 7l9-4 9 4v8l-9 4-9-4V7z" />
          </svg>
        </button>
      </div>

      {/* Texto de la pregunta */}
      <p className="text-body-lg font-medium text-foreground leading-relaxed mb-6">
        {question.question_text}
      </p>

      {/* Opciones */}
      <div className="space-y-3" role="radiogroup" aria-label="Opciones de respuesta">
        {OPTIONS.map((letter) => {
          const text = question[optionLabel[letter] as keyof Question] as string
          const isSelected = selectedAnswer === letter

          return (
            <label
              key={letter}
              className={`
                flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-150 select-none
                ${isSelected
                  ? 'border-accent-500 bg-accent-50'
                  : 'border-border hover:border-primary-200 hover:bg-primary-50'
                }
              `}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={letter}
                checked={isSelected}
                onChange={() => onSelectAnswer(letter)}
                className="sr-only"
              />
              {/* Indicador visual de opción */}
              <span
                className={`
                  shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-bold border-2 transition-colors
                  ${isSelected
                    ? 'bg-accent-500 border-accent-500 text-white'
                    : 'border-border-dark text-foreground-secondary'
                  }
                `}
              >
                {letter}
              </span>
              <span className={`text-body-md leading-relaxed pt-0.5 ${isSelected ? 'text-foreground font-medium' : 'text-foreground-secondary'}`}>
                {text}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
