-- FINAL FIX: sync_vector_768_dimensions.sql
-- Ejecutar en el SQL Editor de Supabase para asegurar compatibilidad total con el código.

-- 1. Eliminar objetos dependientes de 3072
DROP INDEX IF EXISTS document_chunks_embedding_idx;
DROP FUNCTION IF EXISTS match_chunks(vector(3072), float, int);

-- 2. Asegurar que la tabla usa 768 (el estándar de nuestra app para velocidad)
ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768);

-- 3. Crear índice HNSW (más rápido que IVFFlat para este dataset)
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Función de búsqueda para 768 dimensiones
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
