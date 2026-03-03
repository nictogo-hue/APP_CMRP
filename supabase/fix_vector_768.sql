-- Migration: fix_vector_dimensions_to_768
-- Date: 2026-03-02
-- Reason: Unificar dimensiones a 768 para máxima velocidad y corregir error de mismatch (3072 vs 768)

-- 1. Eliminar índice e índice de búsqueda anteriores
DROP INDEX IF EXISTS document_chunks_embedding_idx;
DROP FUNCTION IF EXISTS match_chunks(vector(3072), float, int);

-- 2. Modificar la columna embedding a vector(768)
-- Nota: Si hay datos, esto fallará. Pero como el usuario reporta que NO responde, 
-- es preferible recrear la estructura para asegurar integridad.
ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768);

-- 3. Recrear índice HNSW optimizado para 768 dims
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Recrear función match_chunks para vector(768)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
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
