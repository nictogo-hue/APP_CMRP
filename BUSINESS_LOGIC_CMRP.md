# BUSINESS_LOGIC_CMRP.md - CMRP Mastery App

> Generado por SaaS Factory | Fecha: 2026-03-01

## 1. Problema de Negocio

**Dolor:** Los profesionales que buscan la certificación CMRP (Certified Maintenance & Reliability Professional) carecen de herramientas de estudio dinámicas que simulen el examen real y analicen su progreso por los 5 pilares de SMRP. Dependen de PDFs estáticos y bancos de preguntas sin retroalimentación inteligente.

**Costo actual:**
- Alta tasa de reprobación en el primer intento (costo del examen > $400 USD).
- Cientos de horas desperdiciadas en material no enfocado.
- Ansiedad por falta de preparación realista.

## 2. Solución

**Propuesta de valor:** Una plataforma de entrenamiento inteligente que ofrece simulacros de examen real, un tutor IA (RAG) basado en el Body of Knowledge (BoK) y análisis de brechas por pilar para garantizar el éxito.

**Flujo principal (Happy Path):**
1. Usuario se registra y selecciona su nivel actual de conocimiento.
2. Sistema genera un plan de estudio personalizado.
3. Usuario realiza simulacros de examen (110 preguntas, tiempo limitado).
4. El Tutor IA explica las respuestas incorrectas usando la bibliografía cargada.
5. El Dashboard muestra el porcentaje de dominio por cada uno de los 5 pilares.
6. Usuario practica flashcards generadas por IA sobre sus puntos débiles.

## 3. Usuario Objetivo

**Roles:**
- **Aspirante CMRP**: Estudia para el examen, realiza simulacros y usa el tutor IA.
- **Admin/Instructor**: Gestiona el banco de preguntas y sube materiales a la biblioteca RAG.

## 4. Arquitectura de Datos (Pilares SMRP)

La lógica de negocio se divide en los 5 pilares de SMRP:
1. Business & Management
2. Manufacturing Process Reliability
3. Equipment Reliability
4. Organization & Leadership
5. Work Management

**Storage (Supabase tables):**

```sql
-- Bancos de preguntas
questions (
  id uuid primary key,
  text text not null,
  pilar_id int, -- 1-5
  options jsonb, -- { "a": "...", "b": "...", "correct": "a" }
  explanation text,
  reference_source text
)

-- Intentos de examen
exam_sessions (
  id uuid primary key,
  user_id uuid references profiles(id),
  score decimal,
  completed_at timestamptz,
  pilar_breakdown jsonb -- { "pilar1": 80, "pilar2": 60... }
)

-- Progreso del usuario
user_mastery (
  user_id uuid primary key,
  pilar_1_mastery decimal default 0,
  pilar_2_mastery decimal default 0,
  pilar_3_mastery decimal default 0,
  pilar_4_mastery decimal default 0,
  pilar_5_mastery decimal default 0
)
```

## 5. KPI de Éxito

**Métrica principal:** Tasa de aprobación del 95% para usuarios que alcancen un "Mastery Score" > 85% en la plataforma.

**Métricas secundarias:**
- Reducción del tiempo de estudio en un 30% mediante enfoque en pilares débiles.
- Engagement: Al menos 3 simulacros completos antes del examen real.

## 6. Especificación Técnica (Feature-First)

```
src/features/
├── simulation/        # Motor de exámenes, cronómetro, cálculo de scores
├── tutor-ia/          # Integración RAG con materiales de BIBLIOTECA
├── analysis/          # Gráficas de radar por pilares, historial de progreso
├── study-plan/        # Generación de flashcards y planes personalizados
└── question-bank/     # Gestión de contenido y bibliografía
```
