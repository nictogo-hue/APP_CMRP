// Script: genera CMRP-Mastery-Documentacion.pdf
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

const OUTPUT = path.join(__dirname, '..', 'CMRP-Mastery-Documentacion.pdf')
const doc = new PDFDocument({ margin: 50, size: 'A4' })
doc.pipe(fs.createWriteStream(OUTPUT))

// ─── Paleta de colores ────────────────────────────────────────
const C = {
  blue:      '#2563EB',
  darkBlue:  '#1E3A5F',
  green:     '#16A34A',
  red:       '#DC2626',
  yellow:    '#D97706',
  gray:      '#6B7280',
  lightGray: '#F3F4F6',
  black:     '#111827',
  white:     '#FFFFFF',
}

// ─── Helpers ──────────────────────────────────────────────────
function heading1(text) {
  doc.moveDown(0.5)
  doc.fontSize(22).fillColor(C.darkBlue).font('Helvetica-Bold').text(text)
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(C.blue).lineWidth(2).stroke()
  doc.moveDown(0.5)
}

function heading2(text) {
  doc.moveDown(0.8)
  doc.fontSize(14).fillColor(C.blue).font('Helvetica-Bold').text(text)
  doc.moveDown(0.3)
}

function heading3(text) {
  doc.moveDown(0.4)
  doc.fontSize(11).fillColor(C.darkBlue).font('Helvetica-Bold').text(text)
  doc.moveDown(0.2)
}

function body(text) {
  doc.fontSize(10).fillColor(C.black).font('Helvetica').text(text, { lineGap: 3 })
  doc.moveDown(0.2)
}

function bullet(text, color) {
  const x = doc.x
  doc.fontSize(10).fillColor(color || C.black).font('Helvetica')
    .text(`• ${text}`, { lineGap: 2 })
}

function badge(text, color) {
  doc.moveDown(0.3)
  const rectColor = color || C.blue
  doc.save()
    .roundedRect(50, doc.y, doc.widthOfString(text) + 16, 18, 4)
    .fill(rectColor)
  doc.fontSize(9).fillColor(C.white).font('Helvetica-Bold')
    .text(text, 58, doc.y - 14)
  doc.restore()
  doc.moveDown(0.8)
}

function statusRow(label, status, ok) {
  const icon = ok ? '✓' : '✗'
  const color = ok ? C.green : C.red
  doc.fontSize(10).font('Helvetica')
    .fillColor(C.black).text(`  ${icon}  `, { continued: true })
    .fillColor(color).text(label, { continued: true })
    .fillColor(C.gray).text(`   ${status}`)
}

function separator() {
  doc.moveDown(0.5)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E5E7EB').lineWidth(0.5).stroke()
  doc.moveDown(0.5)
}

// ─── PORTADA ─────────────────────────────────────────────────
doc.rect(0, 0, 595, 200).fill(C.darkBlue)
doc.fontSize(28).fillColor(C.white).font('Helvetica-Bold')
  .text('CMRP Mastery', 50, 60)
doc.fontSize(16).fillColor('#93C5FD').font('Helvetica')
  .text('Detalle por Ventana — Documentacion de la Aplicacion', 50, 100)
doc.fontSize(10).fillColor('#BFDBFE')
  .text('Plataforma de preparacion para la certificacion CMRP (SMRP)', 50, 130)
doc.fontSize(9).fillColor('#93C5FD')
  .text(`Generado: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 160)
doc.moveDown(6)

// ─── RESUMEN EJECUTIVO ────────────────────────────────────────
heading1('Resumen Ejecutivo')
body('CMRP Mastery es una plataforma SaaS de preparacion para la certificacion CMRP (Certified Maintenance & Reliability Professional) emitida por SMRP. La aplicacion integra simulacros de examen reales, analisis de progreso por pilar, flashcards con algoritmo de repeticion espaciada SM-2, plan de estudio adaptativo y Tutor IA con RAG sobre 22 libros tecnicos.')

doc.moveDown(0.5)
heading3('Estadisticas del Sistema')
bullet('296 preguntas reales del examen CMRP distribuidas en 5 pilares SMRP')
bullet('22 libros tecnicos indexados (~32,863 chunks vectorizados en pgvector)')
bullet('5 pilares SMRP: Negocio y Administracion, Confiabilidad de Procesos, Confiabilidad del Equipo, Organizacion y Liderazgo, Administracion del Trabajo')
bullet('Examen simulacro: 110 preguntas, 150 minutos, aprobacion con 70%')

separator()

// ─── PAGINAS PUBLICAS ─────────────────────────────────────────
heading1('Paginas Publicas (sin autenticacion)')

heading2('/ — Landing Page')
body('Pagina de bienvenida para usuarios no autenticados. Presenta la propuesta de valor de la plataforma.')
heading3('Contenido visible:')
bullet('Badge animado: "Certificacion SMRP · CMRP 2026"')
bullet('Titulo principal con gradiente: "Certificate como CMRP con IA"')
bullet('4 estadisticas destacadas: 296 preguntas · 22 libros RAG · 5 pilares SMRP · 2.5h examen real')
bullet('3 tarjetas de features: Simulacro Real, Tutor IA con RAG, Analisis de Progreso')
heading3('Acciones del usuario:')
bullet('"Comenzar gratis" → redirige a /signup')
bullet('"Ya tengo cuenta" → redirige a /login')

heading2('/login — Iniciar Sesion')
body('Formulario de autenticacion para usuarios registrados.')
heading3('Contenido visible:')
bullet('Formulario con campos: email y contrasena')
bullet('Link: "No tienes cuenta? Registrate"')
bullet('Panel izquierdo: metodologia Mastery Loop (4 pasos de preparacion)')
heading3('Acciones del usuario:')
bullet('Ingresar credenciales y hacer login')
bullet('Navegar a registro si es nuevo usuario')
bullet('Recuperar contrasena via link')

heading2('/signup — Registro')
body('Formulario de creacion de nueva cuenta.')
heading3('Contenido visible:')
bullet('Formulario: email, contrasena')
bullet('Links a Terminos de Servicio y Politica de Privacidad')
bullet('Link a login si ya tiene cuenta')
heading3('Acciones del usuario:')
bullet('Completar registro')
bullet('Revisar terminos legales')

heading2('/forgot-password — Recuperar Contrasena')
body('Flujo de recuperacion de acceso via email.')
heading3('Contenido visible:')
bullet('Campo de email para recibir link de reset')
bullet('Boton volver al login')
heading3('Acciones del usuario:')
bullet('Ingresar email registrado')
bullet('Recibir enlace de recuperacion')

separator()

// ─── PAGINAS PRINCIPALES ──────────────────────────────────────
doc.addPage()
heading1('Ventanas Principales (requieren login)')

heading2('/dashboard — Panel Principal')
body('Centro de control del candidato. Muestra el estado actual de preparacion y acceso rapido a todas las funciones.')

heading3('Header')
bullet('Saludo dinamico segun la hora: "Buenos dias", "Buenas tardes" o "Buenas noches"')
bullet('Nombre completo del usuario (obtenido del perfil)')
bullet('Subtitulo: "Tu panel de preparacion para la certificacion CMRP"')

heading3('4 Tarjetas de Estadisticas')
bullet('Examenes realizados: total de simulacros completados')
bullet('Promedio general: porcentaje promedio de todos los examenes (verde >=70%, amarillo >0%, gris sin datos)')
bullet('Mejor puntaje: el porcentaje mas alto obtenido')
bullet('Racha actual: numero de examenes aprobados consecutivamente')

heading3('Alerta de Pilar Debil (condicional)')
bullet('Aparece cuando: promedio < 70% Y hay datos de examenes')
bullet('Muestra: nombre del pilar con menor puntaje promedio')
bullet('Recomienda: "Consulta al Tutor IA para reforzarlo"')

heading3('4 Acciones Rapidas')
bullet('Simulacro (destacado en azul) → /exam/new')
bullet('Tutor IA → /tutor')
bullet('Flashcards → /flashcards')
bullet('Mi Progreso → /analytics')

heading3('Historial Reciente')
bullet('Muestra los ultimos 5 examenes')
bullet('Por examen: fecha, duracion en minutos, total preguntas, score (%), badge Aprobado/No aprobado')
bullet('Punto verde (aprobado) o rojo (no aprobado) como indicador visual')
bullet('Link "Ver todo →" hacia /analytics')

heading3('Onboarding (solo usuarios sin examenes)')
bullet('Tarjeta azul prominente: "Bienvenido a CMRP Mastery"')
bullet('Explica la Metodologia Mastery Loop')
bullet('Boton CTA: "Iniciar Diagnostico Inicial" → /exam/new')

heading2('/exam/new — Preparacion para Simulacro')
body('Pagina informativa antes de iniciar el examen. Presenta las reglas y estructura del simulacro.')

heading3('Contenido visible:')
bullet('Breadcrumb: Dashboard / Nuevo Simulacro')
bullet('Encabezado con icono de verificacion: "Simulacro de Examen CMRP"')

heading3('Tarjeta de Reglas del Examen (izquierda):')
bullet('110 preguntas de opciones multiples (A/B/C/D)')
bullet('150 minutos totales (2 horas y 30 minutos)')
bullet('Navegacion libre entre preguntas durante el examen')
bullet('Opcion de marcar preguntas para revision posterior')
bullet('Respuestas guardadas automaticamente')
bullet('Puntaje minimo de aprobacion: 70%')

heading3('Tarjeta de 5 Pilares SMRP (derecha):')
bullet('1.0 — Negocio y Administracion')
bullet('2.0 — Confiabilidad de Procesos')
bullet('3.0 — Confiabilidad del Equipo')
bullet('4.0 — Organizacion y Liderazgo')
bullet('5.0 — Administracion del Trabajo')

heading3('Acciones:')
bullet('Boton grande "Iniciar Simulacro": crea sesion en BD y redirige al examen')

heading2('/exam/[sessionId] — Examen en Curso')
body('Interfaz de ejecucion del examen. Muestra una pregunta a la vez con navegacion completa.')

heading3('Componentes principales:')
bullet('Timer regresivo: 150 minutos, cambia a rojo en los ultimos 5 minutos')
bullet('Barra de progreso: porcentaje de preguntas respondidas')
bullet('Contador: "Pregunta X de 110"')

heading3('Navegador de preguntas:')
bullet('Grid de 110 botones numerados')
bullet('Colores: gris = sin responder, verde = respondida, amarillo = marcada para revision')
bullet('Click en cualquier numero salta directamente a esa pregunta')

heading3('Pregunta actual:')
bullet('Texto completo de la pregunta')
bullet('4 opciones de respuesta (A, B, C, D) en tarjetas clickeables')
bullet('La opcion seleccionada se resalta en azul')
bullet('Boton de bandera para marcar/desmarcar la pregunta')

heading3('Navegacion:')
bullet('Boton "Anterior" / "Siguiente"')
bullet('Boton "Finalizar Examen": solicita confirmacion antes de enviar')
bullet('Al finalizar: calcula puntajes y redirige a /results')

heading3('Auto-guardado:')
bullet('Cada respuesta se guarda inmediatamente en la base de datos')
bullet('Si el usuario cierra y vuelve, retoma donde lo dejo')
bullet('Al expirar el tiempo: envia automaticamente')

separator()

doc.addPage()
heading2('/exam/[sessionId]/results — Resultados del Examen')
body('Pagina de analisis detallado post-examen con desglose por pilar y revision de errores.')

heading3('Puntaje global:')
bullet('Score en grande (porcentaje con color: verde si >=70%, rojo si <70%)')
bullet('Badge "Aprobado" (verde) o "No aprobado" (rojo)')
bullet('Tiempo utilizado en minutos')
bullet('Fecha y hora de realizacion')

heading3('Desglose por los 5 Pilares SMRP:')
bullet('Porcentaje correcto en cada pilar (correctas / total del pilar)')
bullet('Barra de progreso por pilar con color segun rendimiento')
bullet('Verde: >= 70% | Amarillo: 50-69% | Rojo: < 50%')

heading3('Lista de preguntas incorrectas:')
bullet('Texto completo de cada pregunta fallida')
bullet('Respuesta del candidato vs Respuesta correcta')
bullet('Explicacion del banco de preguntas (si existe)')
bullet('Boton "Explicar con Tutor IA" por cada pregunta (TutorExplainer)')

heading3('TutorExplainer (funcional):')
bullet('Se expande debajo de cada pregunta incorrecta')
bullet('Muestra: por que la correcta es correcta, por que la del candidato es incorrecta')
bullet('Incluye contexto de los libros CMRP cuando hay coincidencias en RAG')

heading3('Generacion automatica de Flashcards:')
bullet('Al cargar esta pagina, las preguntas incorrectas se convierten automaticamente en flashcards')
bullet('Usa algoritmo SM-2 con intervalo inicial de 0 dias (revisar hoy)')
bullet('No genera duplicados (upsert por user_id + question_id)')

heading2('/analytics — Mi Progreso')
body('Dashboard completo de analisis de rendimiento con visualizaciones por los 5 pilares.')

heading3('Estado vacio (sin examenes):')
bullet('Icono de grafica de barras')
bullet('"Sin datos todavia" con explicacion')
bullet('Boton: "Comenzar Simulacro"')

heading3('Con datos — StatsCards:')
bullet('Total de examenes realizados')
bullet('Puntaje promedio general')
bullet('Mejor puntaje historico')
bullet('Racha de examenes aprobados')

heading3('Radar Chart (Grafica de Arana):')
bullet('5 ejes: uno por pilar SMRP')
bullet('Muestra visualmente las fortalezas y debilidades')
bullet('Permite identificar de un vistazo que pilares necesitan refuerzo')

heading3('Panel de Reforzamiento por Pilar:')
bullet('Nombre del pilar + porcentaje promedio con color')
bullet('Barra de progreso animada')
bullet('Numero de intentos realizados en ese pilar')
bullet('Boton "Reforzar →": aparece cuando promedio < 70% y hay intentos')
bullet('"Reforzar →" lleva a mini-examen especifico del pilar')
bullet('Links rapidos: "Ver Flashcards" y "Plan de Estudio"')

heading3('Tabla de Historial Completo:')
bullet('Todos los examenes con: fecha, duracion, score, estado (aprobado/no aprobado)')
bullet('Ordenado del mas reciente al mas antiguo')

heading2('/flashcards — Flashcards con SM-2')
body('Sistema de estudio con repeticion espaciada basado en el algoritmo SuperMemo 2 (SM-2). Las tarjetas se generan automaticamente de las preguntas incorrectas.')

heading3('Estado "Al dia!" (sin tarjetas pendientes):')
bullet('Emoji de celebracion')
bullet('"Al dia!" con total de tarjetas en el mazo')
bullet('Boton para tomar examen y generar nuevas tarjetas')
bullet('Muestra el total acumulado de flashcards creadas')

heading3('Sesion de estudio (con tarjetas pendientes):')
bullet('Contador: "X tarjetas para hoy"')
bullet('Barra de progreso de la sesion actual')

heading3('La tarjeta:')
bullet('FRENTE: texto de la pregunta CMRP con badge "Pregunta" y pista "Toca para ver la respuesta"')
bullet('DORSO: respuesta correcta + explicacion con badge "Respuesta"')
bullet('Efecto 3D flip al hacer click (animacion rotateY 180 grados)')
bullet('Muestra el pilar al que pertenece la pregunta')

heading3('Calificacion (4 botones, aparecen despues de ver el dorso):')
bullet('Otra vez (rojo) — Calificacion 0: vuelve a la cola hoy mismo')
bullet('Dificil (naranja) — Calificacion 1: proxima revision en menos de 1 dia')
bullet('Bien (azul) — Calificacion 2: proxima revision en ~3 dias')
bullet('Facil (verde) — Calificacion 3: proxima revision en ~7 dias o mas')

heading3('Algoritmo SM-2:')
bullet('Cada calificacion actualiza: ease_factor, interval_days, repetitions, next_review_at')
bullet('Las tarjetas con mayor dificultad aparecen mas frecuentemente')
bullet('El intervalo se alarga progresivamente con buenas calificaciones')

separator()

doc.addPage()
heading2('/study-plan — Plan de Estudio')
body('Plan adaptativo de 4 semanas (28 dias) generado segun los resultados de los examenes. Los pilares mas debiles reciben mas dias de estudio.')

heading3('Header de progreso:')
bullet('Titulo "Progreso del plan"')
bullet('Dias completados de 28 totales')
bullet('Dias restantes')
bullet('Porcentaje de avance con barra animada')
bullet('Aviso amarillo si no hay datos de examenes (distribucion equitativa)')

heading3('4 Semanas de estudio:')
bullet('Cada semana muestra su numero y foco (pilares que estudia esa semana)')
bullet('Badge "Semana actual" resalta la semana en curso con borde azul')

heading3('Cada dia muestra:')
bullet('Nombre del dia (Lun/Mar/Mie/Jue/Vie/Sab/Dom) y fecha')
bullet('Indicador azul si es el dia de hoy')
bullet('Tipo de dia con icono:')
bullet('  -> Lunes a Viernes: icono libro, tema especifico, pilar, "45 min", boton "Estudiar ->"')
bullet('  -> Sabados: icono clipboard, "Simulacro de practica CMRP", "60 min", boton "Iniciar ->"')
bullet('  -> Domingos: icono descanso, "Descansa — repasa tus apuntes", sin boton')
bullet('Dias pasados: aparecen con opacidad reducida y checkmark verde')

heading3('Botones de accion por dia:')
bullet('"Estudiar →": abre /tutor?topic=[tema] con el concepto pre-cargado')
bullet('"Iniciar →": abre /exam/new para el simulacro de practica')

heading3('CTAs al final:')
bullet('"Hacer simulacro ahora" (azul principal)')
bullet('"Preguntar al Tutor IA" (secundario)')

heading3('Logica de distribucion de pilares:')
bullet('El pilar con menor promedio: 5 dias de estudio')
bullet('2do y 3er pilar mas debil: 4 dias cada uno')
bullet('4to pilar: 4 dias')
bullet('Pilar mas fuerte: 3 dias')
bullet('Sin datos de examenes: distribucion equitativa (4 dias por pilar)')
bullet('Los pilares se intercalan para evitar saturacion')

heading2('/exam/mini/[pillar] — Mini-Examen por Pilar')
body('Examen de refuerzo focalizado en un pilar especifico. Accesible desde el boton "Reforzar ->" en la pagina de Analytics.')

heading3('Encabezado:')
bullet('Link "← Volver a Mi Progreso"')
bullet('"Mini-Examen de Refuerzo" con codigo y nombre del pilar')

heading3('Estadisticas del mini-examen:')
bullet('15 preguntas seleccionadas aleatoriamente del pilar')
bullet('20 minutos de tiempo limite')
bullet('70% puntaje minimo de aprobacion')

heading3('Informacion adicional:')
bullet('Explica que las preguntas son del pilar seleccionado')
bullet('Advierte que las preguntas incorrectas generan flashcards automaticamente')
bullet('Si hay menos de 5 preguntas disponibles en el pilar: muestra mensaje de error')

heading3('Acciones:')
bullet('Boton "Iniciar Mini-Examen": crea sesion y redirige al ExamRunner')
bullet('El mini-examen usa la misma interfaz que el simulacro completo')
bullet('Al finalizar: pagina de resultados con desglose del pilar especifico')

heading2('/tutor — Tutor IA (en reparacion)')
body('Interfaz de chat con el Tutor CMRP. El tutor busca contexto en la biblioteca de 22 libros indexados antes de responder.')

heading3('Estado vacio (sin mensajes):')
bullet('Icono del tutor con gradiente azul/morado')
bullet('Titulo "Tutor CMRP"')
bullet('Descripcion: "Busco primero en tus 22 libros indexados antes de responder"')
bullet('4 preguntas sugeridas para comenzar:')
bullet('  -> Diferencia entre mantenimiento preventivo y predictivo')
bullet('  -> RCM y sus 7 preguntas fundamentales')
bullet('  -> Calculo del OEE y sus factores')
bullet('  -> FMEA y su aplicacion en mantenimiento')

heading3('Durante una consulta:')
bullet('Indicador verde animado: "Buscando en tu biblioteca de 22 libros CMRP..."')
bullet('La respuesta se muestra token por token (streaming)')
bullet('Footer de cada respuesta:')
bullet('  -> "Fuentes de tu biblioteca:" con nombres de libros consultados')
bullet('  -> O advertencia si no se encontro contexto relevante')
bullet('  -> O advertencia si la biblioteca no estuvo disponible')

heading3('Input:')
bullet('Textarea expandible con placeholder')
bullet('Enter para enviar, Shift+Enter para nueva linea')
bullet('Boton de enviar deshabilitado mientras carga')

heading3('NOTA: El Tutor IA presenta un problema tecnico de streaming pendiente de resolucion.')

separator()

doc.addPage()
heading2('/admin/questions — Banco de Preguntas (solo administradores)')
body('Panel de administracion para gestion del banco de preguntas. Solo accesible para usuarios con rol "admin".')

heading3('Header:')
bullet('Titulo: "Banco de Preguntas"')
bullet('Total de preguntas activas e inactivas')

heading3('Tabla de preguntas:')
bullet('Codigo de pregunta (ej: P1-001)')
bullet('Pilar (1.0 a 5.0) y nombre del pilar')
bullet('Texto de la pregunta (truncado con "...")')
bullet('Opciones A, B, C, D')
bullet('Respuesta correcta destacada')
bullet('Nivel de dificultad (1-3)')
bullet('Estado: Activa / Inactiva (toggle)')

heading3('Filtros:')
bullet('Por pilar (dropdown: todos / pilares 1.0-5.0)')
bullet('Busqueda por texto en la pregunta')

heading3('Acciones CRUD:')
bullet('Boton "Agregar pregunta": abre modal de creacion')
bullet('Icono editar por fila: abre modal de edicion')
bullet('Toggle activa/inactiva: habilita o deshabilita sin borrar')

heading3('Modal de creacion/edicion:')
bullet('Campos: codigo, pilar, texto completo, opciones A-D, respuesta correcta (dropdown), dificultad, explicacion')
bullet('Guardado inmediato en Supabase')

separator()

// ─── NAVEGACION ───────────────────────────────────────────────
heading1('Navegacion — Sidebar')
body('Barra de navegacion lateral fija visible en todas las ventanas de usuario autenticado.')

heading2('Seccion de identidad (parte superior):')
bullet('Logo CMRP Mastery con icono de verificacion')
bullet('Badge "Certificacion CMRP"')

heading2('Informacion del usuario:')
bullet('Avatar circular con las 2 iniciales del nombre')
bullet('Nombre completo del usuario')
bullet('Subtitulo: "Candidato CMRP"')

heading2('Links de navegacion principal (6 items):')
bullet('Dashboard — icono de casa')
bullet('Simulacro CMRP — icono de clipboard → /exam/new')
bullet('Tutor IA — icono de cerebro → /tutor')
bullet('Mi Progreso — icono de grafica → /analytics')
bullet('Plan de Estudio — icono de calendario → /study-plan')
bullet('Flashcards — icono de tarjeta → /flashcards')

heading2('Seccion Admin (solo si role = "admin"):')
bullet('Label "ADMIN"')
bullet('Banco de Preguntas — icono de base de datos → /admin/questions')

heading2('Logout (parte inferior):')
bullet('Icono de salida + "Cerrar Sesion"')
bullet('Ejecuta supabase.auth.signOut() y redirige a /login')

heading2('Comportamiento:')
bullet('El item activo se resalta: fondo azul, texto azul, borde izquierdo azul')
bullet('Items inactivos: texto gris, hover con fondo gris claro')

separator()

// ─── ESTADO FUNCIONAL ─────────────────────────────────────────
heading1('Estado Funcional de la Aplicacion')
doc.moveDown(0.3)

const features = [
  ['Landing Page',                    'Funciona correctamente',        true],
  ['Login / Signup',                  'Funciona correctamente',        true],
  ['Recuperar contrasena',            'Funciona correctamente',        true],
  ['Dashboard',                       'Funciona correctamente',        true],
  ['Simulacro completo (110 preg.)',  'Funciona correctamente',        true],
  ['Resultados del examen',           'Funciona correctamente',        true],
  ['TutorExplainer en resultados',    'Funciona correctamente',        true],
  ['Mini-examen por pilar',           'Funciona correctamente',        true],
  ['Mi Progreso (Analytics)',         'Funciona correctamente',        true],
  ['Radar Chart por pilares',         'Funciona correctamente',        true],
  ['Flashcards SM-2',                 'Funciona correctamente',        true],
  ['Plan de Estudio adaptativo',      'Funciona correctamente',        true],
  ['Botones "Iniciar ->" del plan',   'Funciona correctamente',        true],
  ['Admin — Banco de Preguntas',      'Funciona correctamente',        true],
  ['Tutor IA — Chat con RAG',         'Problema de streaming activo',  false],
  ['Botones "Estudiar ->" del plan',  'Depende del Tutor IA',          false],
]

features.forEach(([label, status, ok]) => {
  statusRow(label, status, ok)
  doc.moveDown(0.15)
})

// ─── ARQUITECTURA TECNICA ─────────────────────────────────────
doc.addPage()
heading1('Arquitectura Tecnica')

heading2('Stack Tecnologico')
bullet('Framework: Next.js 16 + React 19 + TypeScript (App Router)')
bullet('Estilos: Tailwind CSS 3.4')
bullet('Base de datos: Supabase (PostgreSQL + Auth + RLS + pgvector)')
bullet('IA: Vercel AI SDK v6 + Google Gemini 2.0 Flash')
bullet('Embeddings: gemini-embedding-001 (768 dimensiones, HNSW index)')
bullet('Deploy: Vercel (Hobby Plan)')

heading2('Estructura de Base de Datos')
heading3('Tabla: questions')
bullet('id, question_code, pillar_code, question_text, option_a/b/c/d, correct_answer')
bullet('difficulty (1-3), explanation, is_active')
bullet('296 preguntas activas distribuidas en 5 pilares')

heading3('Tabla: exam_sessions')
bullet('id, user_id, status (in_progress / completed), score, total_questions')
bullet('started_at, completed_at, time_limit_minutes, duration_seconds')

heading3('Tabla: session_answers')
bullet('session_id, question_id, question_order')
bullet('selected_answer, is_correct, is_flagged')

heading3('Tabla: flashcards')
bullet('user_id, question_id (unique por usuario)')
bullet('front (texto pregunta), back (respuesta + explicacion), pillar_code')
bullet('ease_factor, interval_days, repetitions, next_review_at, last_reviewed_at')

heading3('Tabla: document_sources')
bullet('22 libros indexados con filename, display_name, page_count')

heading3('Tabla: document_chunks')
bullet('~32,863 fragmentos de texto')
bullet('content, source_id, embedding vector(768)')
bullet('Indice HNSW (m=16, ef_construction=64) para busqueda por similitud coseno')

heading2('Flujo del RAG (Retrieval Augmented Generation)')
bullet('1. Usuario hace pregunta en Tutor IA')
bullet('2. /api/tutor/rag (Serverless): genera embedding con Gemini, busca en pgvector')
bullet('3. Retorna: contexto de los libros + nombres de fuentes + indicador "found"')
bullet('4. /api/tutor/chat (Edge Runtime): recibe contexto, lo incluye en system prompt de Gemini')
bullet('5. Gemini 2.0 Flash genera respuesta con streaming')
bullet('6. Cliente muestra respuesta + footer con fuentes consultadas')

heading2('Algoritmo SM-2 (Flashcards)')
bullet('Calificacion 0 (Otra vez): intervalo = 0, ease_factor -= 0.20, repetitions = 0')
bullet('Calificacion 1 (Dificil): intervalo = max(1, prev-1), ease_factor -= 0.15')
bullet('Calificacion 2 (Bien): intervalo *= ease_factor (minimo 1 dia)')
bullet('Calificacion 3 (Facil): intervalo *= ease_factor * 1.3')
bullet('ease_factor minimo: 1.3, ease_factor inicial: 2.5')
bullet('Tarjetas se ordenan por next_review_at <= ahora')

separator()

// ─── PIE ──────────────────────────────────────────────────────
doc.moveDown(2)
doc.fontSize(9).fillColor(C.gray).font('Helvetica')
  .text('CMRP Mastery — Documento generado automaticamente', { align: 'center' })
  .text('Preparacion para la certificacion CMRP (SMRP) | https://app-cmrp.vercel.app', { align: 'center' })

doc.end()
console.log(`PDF generado: ${OUTPUT}`)
