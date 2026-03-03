# PRP-002: Tutor IA con RAG

> **Estado**: PENDIENTE
> **Fecha**: 2026-03-01
> **Proyecto**: CMRP Mastery

---

## Objetivo

Construir un tutor de IA que explique respuestas incorrectas del simulacro citando la bibliografía oficial CMRP (23 PDFs en `BIBLIOTECA/`), usando RAG con Supabase pgvector + Vercel AI SDK v5 + OpenRouter.

## Por Qué

| Problema | Solución |
|----------|----------|
| Candidato ve que falló una pregunta pero no entiende por qué | Tutor explica la respuesta correcta con contexto de los libros oficiales SMRP |
| Los 23 PDFs son inutilizables sin búsqueda semántica | Vector store hace el conocimiento consultable en segundos |
| Estudiar con PDFs estáticos es ineficiente | Chat interactivo con el corpus completo de CMRP |

**Valor de negocio**: Diferenciador clave del producto. La explicación con fuente oficial convierte el simulacro en una herramienta de aprendizaje real, no solo evaluación.

---

## Qué

### Criterios de Éxito
- [ ] Los 23 PDFs indexados en Supabase pgvector (≥ 1000 chunks)
- [ ] Botón "Explicar" en cada respuesta incorrecta de la pantalla de resultados
- [ ] Explicación streaming en < 3 segundos desde el primer token
- [ ] Explicación cita la fuente bibliográfica (nombre del libro)
- [ ] Chat libre en `/tutor` para preguntar sobre cualquier tema CMRP
- [ ] `npm run typecheck` y `npm run build` pasan sin errores

### Comportamiento Esperado (Happy Path)

**Flujo Explainer** (desde resultados):
```
1. Usuario ve resultados → "Respuestas incorrectas"
2. Click "Explicar" en pregunta CMRP-045
3. Panel deslizable con streaming de respuesta
4. Tutor: "La respuesta correcta es B porque... [contexto del SMRP Body of Knowledge p.45]"
5. Fuente citada al pie: "Fuente: 01 SMRP Body of Knowledge Revised 2020"
```

**Flujo Chat Libre** (desde `/tutor`):
```
1. Usuario navega a /tutor
2. Escribe: "¿Cuál es la diferencia entre MTBF y MTTR?"
3. Tutor busca en vector store → contexto relevante → streaming
4. Respuesta con fuente
```

---

## Contexto

### Prerequisito Crítico: API Key

Necesita `GOOGLE_GENERATIVE_AI_API_KEY` en `.env.local`. Se usará para:
- **Embeddings**: `text-embedding-004` de Google (768 dims, nativo)
- **LLM Explainer**: `gemini-2.0-flash` (rápido, streaming, español nativo)
- **LLM Chat**: `gemini-2.0-flash` (mismo modelo)

### Referencias
- `.claude/ai_templates/agents/06-rag-basico.md` — Template RAG exacto a seguir
- `.claude/ai_templates/_index.md` — Stack AI completo
- `BIBLIOTECA/` — 23 PDFs fuente de verdad (sin #05)
- `src/features/simulation/components/ExamResults.tsx` — Punto de integración del explainer

### Stack AI (Golden Path)
```
npm install ai@latest @ai-sdk/react @ai-sdk/google zod pdf-parse
npm install -D @types/pdf-parse
```

### Arquitectura Propuesta (Feature-First)
```
src/
├── lib/ai/
│   ├── openrouter.ts          # Cliente + modelos definidos
│   ├── embeddings.ts          # generateEmbedding(), generateEmbeddings()
│   ├── chunking.ts            # chunkText() con overlap
│   └── rag.ts                 # findRelevantContent(), addDocument()
│
├── features/tutor-ia/
│   ├── components/
│   │   ├── TutorExplainer.tsx # Panel de explicación streaming (desde resultados)
│   │   └── TutorChat.tsx      # Chat interactivo full-page
│   ├── hooks/
│   │   └── useTutorChat.ts    # useChat() de Vercel AI SDK
│   ├── services/
│   │   └── tutorService.ts    # buildExplainPrompt(), buildChatSystemPrompt()
│   └── types/
│       └── index.ts
│
└── app/
    ├── api/tutor/
    │   ├── explain/route.ts   # POST: explicación one-shot streaming
    │   └── chat/route.ts      # POST: chat conversacional streaming
    └── (main)/tutor/
        └── page.tsx           # Página del chat libre
```

### Modelo de Datos (Supabase pgvector)
```sql
-- Extensión
CREATE EXTENSION IF NOT EXISTS vector;

-- Fuentes bibliográficas
CREATE TABLE document_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,        -- "01 SMRP Body of Knowledge..."
  display_name TEXT NOT NULL,           -- "SMRP Body of Knowledge 2020"
  total_chunks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks vectorizados
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES document_sources(id) ON DELETE CASCADE,
  content TEXT NOT NULL,                -- ~500 chars de texto
  embedding vector(768),               -- text-embedding-004 de Google
  chunk_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice HNSW para búsqueda vectorial rápida
CREATE INDEX ON document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Función de búsqueda semántica
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  source_filename text,
  source_display_name text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    dc.id,
    dc.content,
    ds.filename,
    ds.display_name,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN document_sources ds ON ds.id = dc.source_id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- RLS
ALTER TABLE document_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Solo lectura para autenticados
CREATE POLICY "sources_read" ON document_sources
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "chunks_read" ON document_chunks
  FOR SELECT TO authenticated USING (true);
```

---

## Blueprint (Assembly Line)

### Fase 1: Infraestructura
**Objetivo**: pgvector habilitado + tablas + función `match_chunks` + dependencias npm instaladas + `OPENROUTER_API_KEY` en `.env.local`.
**Validación**:
- `SELECT * FROM document_sources LIMIT 1` no da error (tabla existe)
- `npm install` sin errores
- `import { openrouter } from '@openrouter/ai-sdk-provider'` compila

### Fase 2: Pipeline de Ingesta PDF
**Objetivo**: Script `scripts/ingest-pdfs.mjs` que lee los 23 PDFs, los divide en chunks de ~500 chars, genera embeddings y los inserta en Supabase. Al ejecutarlo → ≥ 1000 chunks en DB.
**Validación**:
- `node scripts/ingest-pdfs.mjs` se completa sin errores
- `SELECT COUNT(*) FROM document_chunks` ≥ 1000
- `SELECT filename, total_chunks FROM document_sources ORDER BY filename` muestra los 23 libros

### Fase 3: Lib AI + API Routes
**Objetivo**: `src/lib/ai/` completo + 2 API routes funcionando:
- `POST /api/tutor/explain` — recibe `{ questionText, options, correctAnswer, userAnswer }` → streaming de explicación con contexto RAG
- `POST /api/tutor/chat` — recibe `{ messages }` → streaming de chat con RAG como tool
**Validación**:
- `curl -X POST http://localhost:3000/api/tutor/explain -d '{...}'` retorna stream
- `npm run typecheck` sin errores

### Fase 4: UI — TutorExplainer + TutorChat
**Objetivo**:
- `TutorExplainer`: panel colapsable en `ExamResults.tsx`. Cada pregunta incorrecta tiene botón "Explicar" que despliega la respuesta streaming con fuente citada.
- `TutorChat`: página `/tutor` con input de chat y mensajes en stream.
**Validación**:
- Playwright screenshot confirma: botón "Explicar" visible en resultados → panel con respuesta streaming
- Playwright screenshot confirma: `/tutor` muestra chat funcional

### Fase 5: Validación Final
**Objetivo**: Feature end-to-end sin errores.
**Validación**:
- [ ] `npm run typecheck` → 0 errores
- [ ] `npm run build` → exitoso
- [ ] Playwright: click "Explicar" → respuesta streaming visible con fuente
- [ ] RLS verificada: `document_chunks` accesible solo para autenticados

---

## Gotchas

- [ ] **pdf-parse en Next.js**: Puede dar error con Turbopack. Usar solo en scripts Node.js, nunca en código de la app. El ingesta es offline, no en runtime.
- [ ] **Tamaño de PDFs**: Los 23 PDFs pueden ser cientos de MB. La ingesta puede tomar 10-30 min (API de embeddings tiene rate limits). Hacer batch de 100 chunks a la vez.
- [ ] **Rate limits OpenRouter**: text-embedding-3-small tiene límite de ~1M tokens/min. Con chunks de 500 chars ≈ 125 tokens, en 1000 chunks = 125K tokens → dentro del límite en una llamada batch.
- [ ] **`vector` extension en Supabase**: Puede que ya esté habilitada (es default en proyectos nuevos). Usar `CREATE EXTENSION IF NOT EXISTS vector` para idempotencia.
- [ ] **Streaming en Next.js App Router**: Usar `streamText(...).toDataStreamResponse()` no `toUIMessageStreamResponse()` para compatibilidad con `useChat` del cliente.
- [ ] **PDF con texto no extraíble**: Algunos PDFs pueden ser scans (imágenes). `pdf-parse` no puede extraer texto de imágenes. Si el texto está vacío, saltar el archivo y loggear.

## Anti-Patrones

- NO hacer la ingesta PDF en tiempo de build o en API routes (demasiado lento)
- NO exponer `OPENROUTER_API_KEY` en código cliente (solo server-side)
- NO cargar todos los chunks en memoria (1000+ chunks = crash). Stream el cursor de DB.
- NO usar `any` en los tipos del stream de Vercel AI SDK

---

## 🧠 Aprendizajes (Self-Annealing)

> Se llena durante la implementación.

---

*PRP pendiente aprobación. No se ha modificado código.*
