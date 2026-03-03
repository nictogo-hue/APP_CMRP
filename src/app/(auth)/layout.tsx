export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Panel izquierdo — Metodología Mastery Loop */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 border-r border-gray-800 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CMRP Mastery</h1>
              <p className="text-xs text-gray-400">Certificación SMRP</p>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Metodología<br />
              <span className="text-blue-400">Mastery Loop</span>
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              Un entrenador CMRP inteligente diseñado para garantizar el dominio de los 5 pilares SMRP en tiempo récord.
            </p>
          </div>

          {/* Pasos del Mastery Loop */}
          <div className="space-y-4">

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Diagnóstico Estratificado</p>
                <p className="text-xs text-gray-400 mt-0.5">Examen inicial de 110 preguntas para identificar brechas en los 5 pilares.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Aprendizaje Activo con RAG</p>
                <p className="text-xs text-gray-400 mt-0.5">El Tutor IA confronta cada error con la bibliografía técnica de 22 libros CMRP.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Repetición Espaciada Adaptativa</p>
                <p className="text-xs text-gray-400 mt-0.5">Flashcards y mini-exámenes que reaparecen en intervalos óptimos según tu nivel.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">4</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Simulacro de Inmersión Total</p>
                <p className="text-xs text-gray-400 mt-0.5">2.5 horas cronometradas para entrenar la resistencia mental del día del examen real.</p>
              </div>
            </div>

          </div>

          {/* Stats */}
          <div className="mt-10 pt-8 border-t border-gray-800 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">296</p>
              <p className="text-[11px] text-gray-500 mt-0.5">preguntas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">22</p>
              <p className="text-[11px] text-gray-500 mt-0.5">libros RAG</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">5</p>
              <p className="text-[11px] text-gray-500 mt-0.5">pilares SMRP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
