import Link from 'next/link'

export const metadata = {
  title: 'CMRP Mastery — Prepárate para la certificación CMRP',
  description: 'Plataforma de preparación para el examen CMRP de SMRP con simulacros reales, tutor IA con RAG sobre 22 libros y análisis por los 5 pilares.',
}

const stats = [
  { icon: '📋', value: '296', label: 'preguntas' },
  { icon: '🧠', value: '22', label: 'libros RAG' },
  { icon: '📊', value: '5', label: 'pilares SMRP' },
  { icon: '⏱', value: '2.5h', label: 'examen real' },
]

const features = [
  {
    icon: '📋',
    title: 'Simulacro Real',
    desc: '110 preguntas cronometradas, mismas condiciones que el examen SMRP oficial.',
  },
  {
    icon: '🧠',
    title: 'Tutor IA con RAG',
    desc: 'Responde tus dudas con contexto de 22 libros del cuerpo de conocimiento CMRP.',
  },
  {
    icon: '📊',
    title: 'Análisis de Progreso',
    desc: 'Radar chart por los 5 pilares SMRP para identificar exactamente dónde mejorar.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1a3a 50%, #1e1b4b 100%)' }}>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">CMRP Mastery</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
          style={{ borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc', backgroundColor: 'rgba(99,102,241,0.08)' }}
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-16">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border"
          style={{ backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)', color: '#93c5fd' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Certificación SMRP · CMRP 2026
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-3xl">
          Certifícate como{' '}
          <span style={{ background: 'linear-gradient(90deg, #60a5fa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            CMRP
          </span>
          {' '}con IA
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl mb-10 max-w-xl leading-relaxed" style={{ color: '#94a3b8' }}>
          Simulacros reales, Tutor IA con contexto de 22 libros SMRP y
          análisis visual de tu progreso por los 5 pilares.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
          >
            Comenzar gratis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-colors border"
            style={{ borderColor: 'rgba(148,163,184,0.2)', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            Ya tengo cuenta
          </Link>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden mb-16 w-full max-w-2xl"
          style={{ backgroundColor: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.1)' }}
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center py-5 px-4" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}>
              <span className="text-xl mb-1">{s.icon}</span>
              <span className="text-2xl font-bold text-white">{s.value}</span>
              <span className="text-xs mt-0.5" style={{ color: '#64748b' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {features.map((f) => (
            <div
              key={f.title}
              className="text-left p-5 rounded-2xl border"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(148,163,184,0.1)' }}
            >
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: '#334155' }}>
        CMRP Mastery · Preparación para la certificación SMRP
      </footer>
    </div>
  )
}
