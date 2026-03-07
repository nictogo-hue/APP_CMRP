'use client'

import { useState } from 'react'
import { signup } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const today = new Date().toISOString().split('T')[0]

export function SignupForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <Input
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        placeholder="Mínimo 6 caracteres"
        hint="La contraseña debe tener al menos 6 caracteres"
        required
        minLength={6}
      />

      <Input
        id="exam_date"
        name="exam_date"
        type="date"
        label="Fecha del examen CMRP"
        hint="¿Cuándo planeas presentar el examen?"
        min={today}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="study_hours_per_day" className="text-sm font-medium text-foreground">
          Horas de estudio por día
        </label>
        <select
          id="study_hours_per_day"
          name="study_hours_per_day"
          required
          defaultValue="1.5"
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="1">1 hora</option>
          <option value="1.5">1.5 horas</option>
          <option value="2">2 horas</option>
          <option value="3">3 horas</option>
          <option value="4">4 horas</option>
        </select>
        <p className="text-xs text-foreground-secondary">Tiempo disponible para estudio diario</p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 border border-error-500 p-3">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        isLoading={loading}
        className="w-full"
      >
        Crear Cuenta
      </Button>
    </form>
  )
}
