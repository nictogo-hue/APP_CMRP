/**
 * Script de ingesta de PDFs CMRP → Supabase pgvector
 * Ejecutar: node scripts/ingest-pdfs.mjs
 *
 * Flujo: PDF → texto plano → chunks → embeddings Google → Supabase
 */
import { readFileSync, readdirSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')
import { embedMany } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Config ──────────────────────────────────────────────────
const SUPABASE_URL         = 'https://titgrqiexkbxvslvjhzo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdGdycWlleGtieHZzbHZqaHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY3NjkyNiwiZXhwIjoyMDg2MjUyOTI2fQ.4mRPrMwfUnWw047cJyxMpXN5z3ZO-gYGPzYk3D798I0'
const GOOGLE_API_KEY       = 'AIzaSyCVyVCTRB38OEkYL0xjJ-ZXCz4t2dOCtOI'
const BIBLIOTECA_DIR       = join(ROOT, 'BIBLIOTECA')
const CHUNK_SIZE           = 500   // chars por chunk
const CHUNK_OVERLAP        = 50    // chars de overlap
const BATCH_SIZE           = 50    // chunks por batch de embeddings
const EMBED_MODEL          = 'gemini-embedding-001'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const google   = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY })

// ─── Helpers ─────────────────────────────────────────────────

function chunkText(text, maxSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()

  if (normalized.length <= maxSize) {
    return normalized.length > 30 ? [normalized] : []
  }

  const chunks = []
  let start = 0

  while (start < normalized.length) {
    let end = start + maxSize
    if (end >= normalized.length) {
      const content = normalized.slice(start).trim()
      if (content.length > 30) chunks.push(content)
      break
    }

    let cutAt = end
    for (let i = end; i > start + maxSize / 2; i--) {
      const ch = normalized[i]
      if (ch === '\n' || ch === '.' || ch === ';') { cutAt = i + 1; break }
    }

    const content = normalized.slice(start, cutAt).trim()
    if (content.length > 30) chunks.push(content)
    start = Math.max(start + 1, cutAt - overlap)
  }

  return chunks
}

// Usa el API de Google directamente para soportar outputDimensionality=768
async function embedBatch(texts) {
  const results = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:batchEmbedContents?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: batch.map(text => ({
            model: `models/${EMBED_MODEL}`,
            content: { parts: [{ text: text.slice(0, 2048) }] },
            outputDimensionality: 768,
          }))
        })
      }
    )
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`HTTP ${res.status}: ${err.slice(0, 200)}`)
    }
    const data = await res.json()
    results.push(...data.embeddings.map(e => e.values))
    process.stdout.write(`  embeddings: ${Math.min(i + BATCH_SIZE, texts.length)}/${texts.length}\r`)

    // Pequeña pausa para no sobrepasar rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results
}

function makeDisplayName(filename) {
  // "01 SMRP Body of Knowledge Revised 2020 (1).pdf" → "SMRP Body of Knowledge 2020"
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/^\d{2}\s+/, '')      // quitar prefijo numérico
    .replace(/\s*\(\d+\)\s*$/, '') // quitar "(1)" al final
    .replace(/_/g, ' ')
    .trim()
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('=== CMRP Mastery — Ingesta de PDFs ===\n')

  const files = readdirSync(BIBLIOTECA_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort()

  console.log(`PDFs encontrados: ${files.length}\n`)

  let totalChunks = 0
  let skipped = 0

  for (const filename of files) {
    const filePath = join(BIBLIOTECA_DIR, filename)
    const displayName = makeDisplayName(filename)

    process.stdout.write(`📄 ${filename.slice(0, 60)}...\n`)

    // Verificar si ya fue procesado
    const { data: existing } = await supabase
      .from('document_sources')
      .select('id, total_chunks')
      .eq('filename', filename)
      .single()

    if (existing?.total_chunks > 0) {
      console.log(`   ⏭  Ya procesado (${existing.total_chunks} chunks). Saltando.\n`)
      skipped++
      continue
    }

    // 1. Extraer texto del PDF (pdf-parse v2 API)
    let text = ''
    try {
      const buffer = readFileSync(filePath)
      const parser = new PDFParse(new Uint8Array(buffer))
      await parser.load()
      const result = await parser.getText()
      text = result.text ?? ''
    } catch (err) {
      console.log(`   ✗ Error extrayendo texto: ${err.message}\n`)
      continue
    }

    if (!text || text.trim().length < 100) {
      console.log(`   ⚠  Texto insuficiente (posible PDF de imagen). Saltando.\n`)
      skipped++
      continue
    }

    // 2. Chunking
    const chunks = chunkText(text)
    console.log(`   Texto: ${text.length} chars → ${chunks.length} chunks`)

    if (chunks.length === 0) {
      console.log(`   ⚠  Sin chunks generados. Saltando.\n`)
      skipped++
      continue
    }

    // 3. Upsert fuente bibliográfica
    const { data: source, error: sourceError } = await supabase
      .from('document_sources')
      .upsert({ filename, display_name: displayName, total_chunks: 0 }, { onConflict: 'filename' })
      .select('id')
      .single()

    if (sourceError || !source) {
      console.log(`   ✗ Error creando fuente: ${sourceError?.message}\n`)
      continue
    }

    // 4. Generar embeddings en batch
    console.log(`   Generando embeddings...`)
    let embeddings
    try {
      embeddings = await embedBatch(chunks)
      console.log(`\n   ✓ ${embeddings.length} embeddings generados`)
    } catch (err) {
      console.log(`\n   ✗ Error en embeddings: ${err.message}\n`)
      continue
    }

    // 5. Insertar chunks en Supabase (batches de 100)
    const rows = chunks.map((content, i) => ({
      source_id: source.id,
      content,
      embedding: embeddings[i],
      chunk_index: i,
    }))

    let inserted = 0
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100)
      const { error } = await supabase.from('document_chunks').insert(batch)
      if (error) {
        console.log(`   ✗ Error insertando batch: ${error.message}`)
        break
      }
      inserted += batch.length
    }

    // 6. Actualizar total_chunks en la fuente
    await supabase
      .from('document_sources')
      .update({ total_chunks: inserted })
      .eq('id', source.id)

    totalChunks += inserted
    console.log(`   ✓ ${inserted} chunks insertados\n`)
  }

  // ─── Resumen final ───────────────────────────────────────
  console.log('\n=== Ingesta completada ===')
  console.log(`PDFs procesados : ${files.length - skipped}`)
  console.log(`PDFs saltados   : ${skipped}`)
  console.log(`Total chunks DB : verificando...`)

  const { data: countResult } = await supabase
    .from('document_chunks')
    .select('id', { count: 'exact', head: true })

  console.log(`Total chunks DB : ${countResult?.length ?? '?'}`)

  const { data: sources } = await supabase
    .from('document_sources')
    .select('display_name, total_chunks')
    .order('display_name')

  console.log('\nFuentes indexadas:')
  for (const s of sources ?? []) {
    console.log(`  ${s.total_chunks.toString().padStart(4)} chunks  ${s.display_name}`)
  }
}

main().catch(console.error)
