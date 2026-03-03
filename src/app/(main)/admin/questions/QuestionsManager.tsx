'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Difficulty = 'Fácil' | 'Media' | 'Difícil'
type AnswerLetter = 'A' | 'B' | 'C' | 'D'
type PillarCode = '1.0' | '2.0' | '3.0' | '4.0' | '5.0'

interface Question {
  id: string
  question_code: string
  pillar_code: PillarCode
  pillar_name: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: AnswerLetter
  explanation: string | null
  difficulty: Difficulty
  is_active: boolean
}

const PILLAR_NAMES: Record<PillarCode, string> = {
  '1.0': 'Negocios y Administración',
  '2.0': 'Confiabilidad de Procesos',
  '3.0': 'Confiabilidad del Equipo',
  '4.0': 'Organización y Liderazgo',
  '5.0': 'Administración del Trabajo',
}

const EMPTY_FORM: Omit<Question, 'id'> = {
  question_code: '',
  pillar_code: '1.0',
  pillar_name: PILLAR_NAMES['1.0'],
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  explanation: '',
  difficulty: 'Media',
  is_active: true,
}

export function QuestionsManager({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [filter, setFilter] = useState<PillarCode | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [form, setForm] = useState<Omit<Question, 'id'>>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filtered = questions.filter(q => {
    if (filter !== 'all' && q.pillar_code !== filter) return false
    if (search && !q.question_text.toLowerCase().includes(search.toLowerCase()) &&
        !q.question_code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts: Record<string, number> = {}
  questions.forEach(q => {
    counts[q.pillar_code] = (counts[q.pillar_code] ?? 0) + 1
  })

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(q: Question) {
    setEditing(q)
    setForm({ ...q })
    setError('')
    setShowForm(true)
  }

  function updateForm<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'pillar_code') {
        next.pillar_name = PILLAR_NAMES[value as PillarCode]
      }
      return next
    })
  }

  async function handleSave() {
    if (!form.question_code || !form.question_text || !form.option_a || !form.option_b || !form.option_c || !form.option_d) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()

    if (editing) {
      const { error: err } = await supabase
        .from('questions')
        .update(form)
        .eq('id', editing.id)
      if (err) { setError(err.message); setSaving(false); return }
      setQuestions(prev => prev.map(q => q.id === editing.id ? { ...q, ...form } : q))
    } else {
      const { data, error: err } = await supabase
        .from('questions')
        .insert(form)
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      setQuestions(prev => [...prev, data as Question])
    }
    setSaving(false)
    setShowForm(false)
  }

  async function handleToggleActive(q: Question) {
    const supabase = createClient()
    await supabase.from('questions').update({ is_active: !q.is_active }).eq('id', q.id)
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, is_active: !x.is_active } : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta pregunta permanentemente?')) return
    const supabase = createClient()
    await supabase.from('questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const difficultyColor = { 'Fácil': 'text-green-400', 'Media': 'text-yellow-400', 'Difícil': 'text-red-400' }

  return (
    <div className="space-y-4">
      {/* Filtros + búsqueda */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-surface border border-border text-foreground-secondary hover:text-foreground'}`}
          >
            Todos ({questions.length})
          </button>
          {(['1.0', '2.0', '3.0', '4.0', '5.0'] as PillarCode[]).map(code => (
            <button
              key={code}
              onClick={() => setFilter(code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === code ? 'bg-blue-600 text-white' : 'bg-surface border border-border text-foreground-secondary hover:text-foreground'}`}
            >
              P{code.replace('.0', '')} ({counts[code] ?? 0})
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar pregunta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
          />
          <button
            onClick={openNew}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Nueva pregunta
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Pilar</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Pregunta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Dif.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(q => (
                <tr key={q.id} className={`hover:bg-surface-hover transition-colors ${!q.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">{q.question_code}</td>
                  <td className="px-4 py-3 text-xs text-foreground-secondary whitespace-nowrap">P{q.pillar_code.replace('.0', '')}</td>
                  <td className="px-4 py-3 text-foreground max-w-xs truncate">{q.question_text}</td>
                  <td className={`px-4 py-3 text-xs font-medium ${difficultyColor[q.difficulty]}`}>{q.difficulty}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(q)}
                      className={`text-xs px-2 py-0.5 rounded-full ${q.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {q.is_active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(q)} className="text-xs text-blue-400 hover:text-blue-300">Editar</button>
                      <button onClick={() => handleDelete(q.id)} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-foreground-secondary text-sm">
                    No se encontraron preguntas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
              <h2 className="font-semibold text-foreground">{editing ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
              <button onClick={() => setShowForm(false)} className="text-foreground-secondary hover:text-foreground">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Código *">
                  <input value={form.question_code} onChange={e => updateForm('question_code', e.target.value)}
                    placeholder="CMRP-297" className={inputCls} />
                </Field>
                <Field label="Pilar *">
                  <select value={form.pillar_code} onChange={e => updateForm('pillar_code', e.target.value as PillarCode)} className={inputCls}>
                    {(['1.0', '2.0', '3.0', '4.0', '5.0'] as PillarCode[]).map(c => (
                      <option key={c} value={c}>{c} — {PILLAR_NAMES[c]}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Pregunta *">
                <textarea value={form.question_text} onChange={e => updateForm('question_text', e.target.value)}
                  rows={3} className={inputCls} placeholder="Texto de la pregunta..." />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Opción A *"><input value={form.option_a} onChange={e => updateForm('option_a', e.target.value)} className={inputCls} /></Field>
                <Field label="Opción B *"><input value={form.option_b} onChange={e => updateForm('option_b', e.target.value)} className={inputCls} /></Field>
                <Field label="Opción C *"><input value={form.option_c} onChange={e => updateForm('option_c', e.target.value)} className={inputCls} /></Field>
                <Field label="Opción D *"><input value={form.option_d} onChange={e => updateForm('option_d', e.target.value)} className={inputCls} /></Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Respuesta correcta *">
                  <select value={form.correct_answer} onChange={e => updateForm('correct_answer', e.target.value as AnswerLetter)} className={inputCls}>
                    {(['A', 'B', 'C', 'D'] as AnswerLetter[]).map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Dificultad *">
                  <select value={form.difficulty} onChange={e => updateForm('difficulty', e.target.value as Difficulty)} className={inputCls}>
                    {(['Fácil', 'Media', 'Difícil'] as Difficulty[]).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Explicación">
                <textarea value={form.explanation ?? ''} onChange={e => updateForm('explanation', e.target.value)}
                  rows={2} className={inputCls} placeholder="Explicación de por qué la respuesta es correcta..." />
              </Field>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active}
                  onChange={e => updateForm('is_active', e.target.checked)}
                  className="w-4 h-4 rounded border-border" />
                <label htmlFor="is_active" className="text-sm text-foreground-secondary">Pregunta activa</label>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-foreground-secondary hover:text-foreground">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground-secondary mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-blue-500'
