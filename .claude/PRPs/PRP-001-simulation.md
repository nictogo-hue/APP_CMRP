# PRP-001: Motor de Simulación CMRP

> **Estado**: PENDIENTE
> **Fecha**: 2026-03-01
> **Proyecto**: CMRP Mastery

---

## Objetivo

Construir el motor central de simulación de examen CMRP: un sistema que selecciona 110 preguntas aleatorias del banco de 296, presenta un wizard con cronómetro de 2.5 horas, persiste las respuestas en tiempo real y genera un reporte de resultados desglosado por los 5 pilares SMRP.

## Por Qué

| Problema | Solución |
|----------|----------|
| Candidatos CMRP estudian con PDFs estáticos sin práctica real | Simulacro que replica exactamente las condiciones del examen oficial |
| No saben en qué pilares fallan | Scoring desglosado por los 5 pilares SMRP con porcentaje de dominio |
| Riesgo de perder $400 USD del examen real | Validación del nivel real ANTES de ir al examen |

**Valor de negocio**: Es el núcleo del producto. Sin simulación no hay CMRP Mastery. Todo lo demás (Tutor IA, Study Plan, Analytics) depende de que este motor funcione.

---

## Qué

### Criterios de Éxito
- [ ] Usuario puede iniciar un examen de 110 preguntas en < 3 clics
- [ ] Cronómetro regresivo de 2h30m visible en todo momento
- [ ] Navegación libre entre preguntas (ir/volver sin perder respuestas)
- [ ] Respuestas guardadas en DB en tiempo real (no se pierden si cierra el tab)
- [ ] Al finalizar: reporte con score total + score por cada pilar SMRP
- [ ] Examen bloqueado/enviado automáticamente cuando el timer llega a 0

### Comportamiento Esperado (Happy Path)
```
1. Usuario en /dashboard → clic "Iniciar Simulacro"
2. /exam/new → confirmación con reglas del examen
3. Sistema selecciona 110 preguntas aleatorias del banco (estratificadas por pilar)
4. /exam/[sessionId] → ExamRunner activo con timer 2:30:00
5. Usuario navega entre preguntas, selecciona opciones A/B/C/D
6. Cada respuesta se guarda en DB inmediatamente (Supabase)
7. Usuario puede marcar preguntas para revisión posterior
8. Al enviar (o timer=0): /exam/[sessionId]/results
9. Resultados: score total, score por pilar, preguntas incorrectas resaltadas
```

### Los 5 Pilares SMRP (Columnas de Scoring)
| Código | Nombre |
|--------|--------|
| 1.0 | Negocios y Administración |
| 2.0 | Confiabilidad de Procesos |
| 3.0 | Confiabilidad del Equipo |
| 4.0 | Organización y Liderazgo |
| 5.0 | Administración del Trabajo |

---

## Contexto

### Referencias
- `BIBLIOTECA/Banco_Preguntas_CMRP_296.csv` — Fuente de verdad: 296 preguntas con ID, Pilar, Pregunta, 4 opciones, Respuesta, Explicación, Dificultad
- `ANALISIS_CMRP.md` — Visión del producto y roadmap
- `src/features/appointments/` — Patrón de feature existente a seguir
- `src/features/booking/store/bookingStore.ts` — Patrón Zustand para estado wizard

### Estructura CSV (Banco de Preguntas)
```
"ID Pregunta","Pilar SMRP (Código)","Pilar SMRP (Nombre)","Pregunta",
"Opción A","Opción B","Opción C","Opción D",
"Respuesta Correcta (Letra)","Explicación Detallada","Dificultad"
```
- **296 preguntas** totales en el banco
- **110 preguntas** por examen (condición real CMRP)
- Dificultad: `Fácil` | `Media` | `Difícil`

### Arquitectura Propuesta (Feature-First)
```
src/features/simulation/
├── components/
│   ├── ExamRunner.tsx          # Contenedor principal del examen activo
│   ├── QuestionCard.tsx        # Tarjeta individual de pregunta + opciones
│   ├── ExamTimer.tsx           # Cronómetro regresivo (2h30m)
│   ├── ExamNavigation.tsx      # Navegación entre preguntas + mapa de estado
│   ├── ExamProgressBar.tsx     # Barra de progreso (respondidas/total)
│   └── ExamResults.tsx         # Reporte de resultados por pilar
├── hooks/
│   ├── useExamSession.ts       # Lógica de sesión, timer, submit
│   └── useExamNavigation.ts    # Estado de navegación entre preguntas
├── services/
│   ├── examService.ts          # Crear sesión, obtener preguntas, guardar respuestas
│   └── scoringService.ts       # Calcular scores por pilar
├── store/
│   └── examStore.ts            # Estado global Zustand del examen activo
└── types/
    └── index.ts                # Question, ExamSession, SessionAnswer, PillarScore

src/app/(main)/
├── exam/
│   ├── new/page.tsx            # Pantalla de inicio / confirmación
│   ├── [sessionId]/page.tsx    # Examen activo (ExamRunner)
│   └── [sessionId]/results/page.tsx  # Resultados
```

### Modelo de Datos (Supabase)

```sql
-- Banco de preguntas (cargado desde CSV)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_code TEXT NOT NULL UNIQUE,  -- "CMRP-001"
  pillar_code TEXT NOT NULL,            -- "1.0", "2.0", etc.
  pillar_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,         -- "A", "B", "C", "D"
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('Fácil', 'Media', 'Difícil')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de examen
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'timed_out', 'abandoned')),
  total_questions INT NOT NULL DEFAULT 110,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_limit_minutes INT NOT NULL DEFAULT 150,  -- 2.5 horas
  score_total DECIMAL(5,2),                      -- % correctas global
  score_pillar_1 DECIMAL(5,2),
  score_pillar_2 DECIMAL(5,2),
  score_pillar_3 DECIMAL(5,2),
  score_pillar_4 DECIMAL(5,2),
  score_pillar_5 DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preguntas seleccionadas para cada sesión + respuestas del usuario
CREATE TABLE session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  question_order INT NOT NULL,          -- posición 1-110
  selected_answer TEXT                  -- NULL = sin responder
    CHECK (selected_answer IN ('A', 'B', 'C', 'D') OR selected_answer IS NULL),
  is_flagged BOOLEAN DEFAULT FALSE,     -- marcada para revisión
  is_correct BOOLEAN,                   -- calculado al submit
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "questions_read_authenticated"
  ON questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "exam_sessions_own"
  ON exam_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "session_answers_own"
  ON session_answers FOR ALL TO authenticated
  USING (
    session_id IN (
      SELECT id FROM exam_sessions WHERE user_id = auth.uid()
    )
  );
```

---

## Blueprint (Assembly Line)

> Solo FASES. Las subtareas se generan al entrar a cada fase.

### Fase 1: Base de Datos + Seed
**Objetivo**: Tablas `questions`, `exam_sessions`, `session_answers` creadas en Supabase con RLS, y las 296 preguntas del CSV importadas como registros.
**Validación**:
- `list_tables` muestra las 3 tablas
- `SELECT COUNT(*) FROM questions` → 296
- `get_advisors` no reporta tablas sin RLS

### Fase 2: Tipos + Servicio de Examen
**Objetivo**: `types/index.ts` tipado completo + `examService.ts` con funciones: `createSession()`, `getSessionWithQuestions()`, `saveAnswer()`, `submitSession()`.
**Validación**:
- `npm run typecheck` sin errores
- Función `createSession()` selecciona exactamente 110 preguntas aleatorias de las 296

### Fase 3: Store Zustand + Hooks
**Objetivo**: `examStore.ts` gestiona el estado en memoria del examen activo (pregunta actual, respuestas, timer). `useExamSession` y `useExamNavigation` encapsulan toda la lógica del componente.
**Validación**:
- Store persiste respuestas entre navegaciones
- Hook expone: `currentQuestion`, `goToNext()`, `goToPrev()`, `goTo(n)`, `selectAnswer()`, `toggleFlag()`

### Fase 4: UI del ExamRunner
**Objetivo**: Pantallas `/exam/new` y `/exam/[sessionId]` completamente funcionales. QuestionCard, ExamTimer, ExamNavigation y ExamProgressBar integrados y funcionando.
**Validación**:
- Playwright screenshot confirma: pregunta visible, timer activo, 4 opciones clickeables
- Al seleccionar opción → se guarda en DB (verificar con `execute_sql`)
- Navegación prev/next funciona sin perder respuestas

### Fase 5: Submit + Resultados
**Objetivo**: Lógica de `submitSession()` calcula scores por pilar y los guarda en `exam_sessions`. Pantalla `/exam/[sessionId]/results` muestra: score total, score por pilar (5 barras o radar), listado de incorrectas con explicación.
**Validación**:
- Timer a 0 → auto-submit funciona
- Score total = preguntas correctas / 110 * 100
- Scores por pilar calculados correctamente
- Playwright screenshot confirma pantalla de resultados con datos reales

### Fase 6: Validación Final
**Objetivo**: Feature end-to-end sin errores.
**Validación**:
- [ ] `npm run typecheck` → 0 errores
- [ ] `npm run build` → exitoso
- [ ] Happy Path completo (inicio → pregunta → submit → resultados) verificado con Playwright
- [ ] RLS verificada: usuario A no puede ver sesiones de usuario B

---

## Gotchas

- [ ] **Timer con Server Components**: El cronómetro DEBE ser `'use client'`. Calcular tiempo restante como `started_at + 150min - Date.now()` desde el servidor para evitar drift.
- [ ] **Selección estratificada de preguntas**: Seleccionar aleatoriamente pero con representación de todos los pilares. SQL: `SELECT * FROM questions WHERE is_active=true ORDER BY random() LIMIT 110` es suficiente para v1.
- [ ] **Persistencia en tiempo real**: Guardar respuesta en Supabase en `onChange` del radio button (no en submit). Usar `upsert` en `session_answers`.
- [ ] **CSV con datos sucios**: El CSV tiene algunas filas con ruido (ver código "7.7" en análisis). Filtrar por `pillar_code IN ('1.0','2.0','3.0','4.0','5.0')` en el seed.
- [ ] **Auto-submit al timeout**: Implementar con `useEffect` + `setTimeout` en el cliente, y validación en el server action (si `started_at + 150min < now()` → forzar status=`timed_out`).
- [ ] **RLS en session_answers**: La policy usa subquery a `exam_sessions`. Verificar que el query planner no la rechace; si hay issues, añadir `user_id` directo a `session_answers`.

## Anti-Patrones

- NO cargar las 296 preguntas en el cliente (solo las 110 de la sesión activa)
- NO calcular el score en el cliente (siempre server-side para integridad)
- NO usar `any` para los tipos del CSV parser
- NO omitir el `UNIQUE(session_id, question_id)` en `session_answers`

---

## 🧠 Aprendizajes (Self-Annealing)

> Se llena durante la implementación.

---

*PRP pendiente aprobación. No se ha modificado código.*
