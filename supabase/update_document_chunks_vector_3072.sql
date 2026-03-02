-- Migration: update_document_chunks_vector_3072
-- Date: 2026-03-01
-- Reason: Cambio de modelo text-embedding-004 (768 dims) a gemini-embedding-001 (3072 dims)
-- Safe to run: tabla document_chunks tiene 0 filas

-- 1. Drop del índice HNSW anterior
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- 2. Recrear document_chunks con vector(3072)
DROP TABLE IF EXISTS document_chunks;

CREATE TABLE document_chunks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id   uuid NOT NULL REFERENCES document_sources(id) ON DELETE CASCADE,
  content     text NOT NULL,
  embedding   vector(3072),
  chunk_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 3. Índice HNSW para búsqueda por similitud coseno
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. RLS
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chunks"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert chunks"
  ON document_chunks FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 5. Actualizar match_chunks function para vector(3072)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(3072),
  match_threshold float,
  match_count     int
)
RETURNS TABLE (
  id                   uuid,
  content              text,
  source_filename      text,
  source_display_name  text,
  similarity           float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    ds.filename     AS source_filename,
    ds.display_name AS source_display_name,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN document_sources ds ON ds.id = dc.source_id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
