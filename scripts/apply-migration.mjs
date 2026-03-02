/**
 * Applies the simulation tables migration + seed to Supabase
 * via the Management API.
 */
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROJECT_REF = 'titgrqiexkbxvslvjhzo'
const ACCESS_TOKEN = 'sbp_10ce2509953bc9834a1bc42f81aa3a9dd7a1b0ac'
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

async function executeSQL(label, sql) {
  console.log(`\n▶ ${label}...`)
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }

  if (!res.ok) {
    console.error(`  ✗ HTTP ${res.status}:`, JSON.stringify(json, null, 2))
    return false
  }
  console.log(`  ✓ OK (HTTP ${res.status})`)
  if (Array.isArray(json) && json.length > 0) {
    console.log('  Result:', JSON.stringify(json.slice(0, 5), null, 2))
  }
  return true
}

// ─── Migration SQL ────────────────────────────────────────────────────────────
const MIGRATION_SQL = `
-- Banco de preguntas CMRP
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_code TEXT NOT NULL UNIQUE,
  pillar_code TEXT NOT NULL,
  pillar_name TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('Fácil', 'Media', 'Difícil')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sesiones de examen
CREATE TABLE IF NOT EXISTS exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'timed_out', 'abandoned')),
  total_questions INT NOT NULL DEFAULT 110,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_limit_minutes INT NOT NULL DEFAULT 150,
  score_total DECIMAL(5,2),
  score_pillar_1 DECIMAL(5,2),
  score_pillar_2 DECIMAL(5,2),
  score_pillar_3 DECIMAL(5,2),
  score_pillar_4 DECIMAL(5,2),
  score_pillar_5 DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respuestas por sesión
CREATE TABLE IF NOT EXISTS session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  question_order INT NOT NULL,
  selected_answer TEXT CHECK (selected_answer IN ('A', 'B', 'C', 'D') OR selected_answer IS NULL),
  is_flagged BOOLEAN DEFAULT FALSE,
  is_correct BOOLEAN,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_questions_pillar_code ON questions(pillar_code);
`

const RLS_SQL = `
-- RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

-- Questions: lectura para cualquier autenticado
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'questions_read_authenticated'
  ) THEN
    CREATE POLICY "questions_read_authenticated"
      ON questions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Exam sessions: solo el dueño
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_sessions' AND policyname = 'exam_sessions_select_own') THEN
    CREATE POLICY "exam_sessions_select_own"
      ON exam_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_sessions' AND policyname = 'exam_sessions_insert_own') THEN
    CREATE POLICY "exam_sessions_insert_own"
      ON exam_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_sessions' AND policyname = 'exam_sessions_update_own') THEN
    CREATE POLICY "exam_sessions_update_own"
      ON exam_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- Session answers: solo dueño de la sesión
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_answers' AND policyname = 'session_answers_select_own') THEN
    CREATE POLICY "session_answers_select_own"
      ON session_answers FOR SELECT TO authenticated
      USING (session_id IN (SELECT id FROM exam_sessions WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_answers' AND policyname = 'session_answers_insert_own') THEN
    CREATE POLICY "session_answers_insert_own"
      ON session_answers FOR INSERT TO authenticated
      WITH CHECK (session_id IN (SELECT id FROM exam_sessions WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'session_answers' AND policyname = 'session_answers_update_own') THEN
    CREATE POLICY "session_answers_update_own"
      ON session_answers FOR UPDATE TO authenticated
      USING (session_id IN (SELECT id FROM exam_sessions WHERE user_id = auth.uid()));
  END IF;
END $$;
`

const VERIFY_SQL = `
SELECT
  t.table_name,
  t.row_security,
  (SELECT COUNT(*) FROM information_schema.table_constraints tc
   WHERE tc.table_name = t.table_name AND tc.constraint_type = 'PRIMARY KEY') as has_pk
FROM information_schema.tables t
WHERE t.table_name IN ('questions', 'exam_sessions', 'session_answers')
  AND t.table_schema = 'public'
ORDER BY t.table_name;
`

const COUNT_SQL = `SELECT COUNT(*) as total FROM questions;`

// ─── Run ─────────────────────────────────────────────────────────────────────
console.log('=== CMRP Mastery — Applying Simulation Migration ===')
console.log(`Project: ${PROJECT_REF}`)

const ok1 = await executeSQL('Crear tablas', MIGRATION_SQL)
if (!ok1) { console.error('\nAborting: migration failed'); process.exit(1) }

const ok2 = await executeSQL('Habilitar RLS + políticas', RLS_SQL)
if (!ok2) { console.error('\nAborting: RLS failed'); process.exit(1) }

// Seed — read the generated SQL file
const seedSQL = readFileSync(join(__dirname, 'seed-questions.sql'), 'utf-8')
const ok3 = await executeSQL('Importar 296 preguntas (seed)', seedSQL)
if (!ok3) { console.error('\nAborting: seed failed'); process.exit(1) }

// Verify
await executeSQL('Verificar tablas + RLS', VERIFY_SQL)
await executeSQL('Contar preguntas importadas', COUNT_SQL)

console.log('\n=== Fase 1 completa ===')
