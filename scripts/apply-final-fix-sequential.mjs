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
    if (!res.ok) {
        console.error(`  ✗ Error: ${text.slice(0, 500)}`)
        return false
    }
    console.log(`  ✓ OK`)
    return true
}

async function main() {
    console.log('=== CMRP Mastery — Sequential Vector Fix ===')

    const steps = [
        { label: 'Limpiando objetos antiguos', sql: 'DROP INDEX IF EXISTS document_chunks_embedding_idx; DROP FUNCTION IF EXISTS match_chunks(vector(3072), float, int);' },
        { label: 'Cambiando tipo a vector(768)', sql: 'ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768);' },
        { label: 'Creando índice HNSW', sql: "CREATE INDEX document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);" },
        {
            label: 'Creando función match_chunks(768)', sql: `
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
    ` }
    ]

    for (const s of steps) {
        const ok = await executeSQL(s.label, s.sql)
        if (!ok) {
            console.error('Fallo en el paso:', s.label)
            process.exit(1)
        }
    }

    console.log('\n=== Operación completada con éxito ===')
}

main().catch(console.error)
