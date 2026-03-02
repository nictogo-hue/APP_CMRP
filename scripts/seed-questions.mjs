import { readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const CSV_PATH = join(__dirname, '../BIBLIOTECA/Banco_Preguntas_CMRP_296.csv')
const SQL_PATH = join(__dirname, 'seed-questions.sql')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal RFC-4180-compliant CSV row parser.
 * Handles quoted fields that may contain commas and escaped double-quotes ("").
 * Returns an array of string values.
 */
function parseCSVRow(line) {
  const fields = []
  let i = 0

  while (i < line.length) {
    if (line[i] === '"') {
      // Quoted field
      let value = ''
      i++ // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          // Escaped double-quote inside a quoted field
          value += '"'
          i += 2
        } else if (line[i] === '"') {
          // Closing quote
          i++
          break
        } else {
          value += line[i]
          i++
        }
      }
      fields.push(value)
      // Skip the separator comma (if any)
      if (line[i] === ',') i++
    } else {
      // Unquoted field (read until next comma)
      let start = i
      while (i < line.length && line[i] !== ',') i++
      fields.push(line.slice(start, i))
      if (line[i] === ',') i++
    }
  }

  return fields
}

/**
 * Escape single quotes for PostgreSQL string literals.
 */
function pgEscape(value) {
  return value.replace(/'/g, "''")
}

/**
 * Wrap a value in single quotes, escaping internal single quotes.
 */
function pgLiteral(value) {
  return `'${pgEscape(value)}'`
}

// ---------------------------------------------------------------------------
// Valid pillar codes
// ---------------------------------------------------------------------------
const VALID_PILLAR_CODES = new Set(['1.0', '2.0', '3.0', '4.0', '5.0'])

// Column indices (0-based), matching header order:
// "ID Pregunta","Pilar SMRP (Código)","Pilar SMRP (Nombre)","Pregunta",
// "Opción A","Opción B","Opción C","Opción D",
// "Respuesta Correcta (Letra)","Explicación Detallada","Dificultad"
const COL = {
  question_code: 0,
  pillar_code:   1,
  pillar_name:   2,
  question_text: 3,
  option_a:      4,
  option_b:      5,
  option_c:      6,
  option_d:      7,
  correct_answer: 8,
  explanation:   9,
  difficulty:    10,
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('Reading CSV file...')
const raw = readFileSync(CSV_PATH, 'utf-8')
const allLines = raw.split('\n')

console.log(`Total lines in file: ${allLines.length}`)

// Find the line where the first ```csv block starts.
// Everything before that is prose. The actual data rows are lines that begin
// with "CMRP- (a quoted question ID).  The file contains some prose text
// injected mid-stream (lines 122-132) that we simply skip by checking whether
// the line starts with a quoted CMRP- identifier.
let csvStartLine = -1
for (let i = 0; i < allLines.length; i++) {
  if (allLines[i].trimEnd() === '```csv') {
    csvStartLine = i + 2 // +1 for the header row, +1 to start at data rows
    console.log(`Found CSV block marker at line ${i + 1} (1-based)`)
    break
  }
}

if (csvStartLine === -1) {
  console.error('ERROR: Could not find the ```csv block marker in the file.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Parse rows
// ---------------------------------------------------------------------------
const validRows   = []
let   filteredCount = 0
let   skippedNonData = 0

for (let i = csvStartLine; i < allLines.length; i++) {
  const rawLine = allLines[i].trimEnd()

  // Stop at the closing ``` marker
  if (rawLine === '```') break

  // Skip blank lines and prose text:
  // A valid data row ALWAYS starts with a quoted CMRP- identifier.
  if (!rawLine.startsWith('"CMRP-')) {
    skippedNonData++
    continue
  }

  const fields = parseCSVRow(rawLine)

  if (fields.length !== 11) {
    console.warn(`  WARNING: Line ${i + 1} has ${fields.length} fields (expected 11), skipping: ${rawLine.slice(0, 80)}`)
    skippedNonData++
    continue
  }

  const pillarCode = fields[COL.pillar_code]

  if (!VALID_PILLAR_CODES.has(pillarCode)) {
    console.warn(`  FILTERED: Line ${i + 1} — invalid pillar code "${pillarCode}" (ID: ${fields[COL.question_code]})`)
    filteredCount++
    continue
  }

  validRows.push(fields)
}

console.log('')
console.log(`Rows processed (valid):  ${validRows.length}`)
console.log(`Rows filtered (invalid pillar): ${filteredCount}`)
console.log(`Lines skipped (non-data):       ${skippedNonData}`)

if (validRows.length === 0) {
  console.error('ERROR: No valid rows found. Check the file path and structure.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Generate SQL
// ---------------------------------------------------------------------------
const valueLines = validRows.map((fields, index) => {
  const vals = [
    pgLiteral(fields[COL.question_code]),
    pgLiteral(fields[COL.pillar_code]),
    pgLiteral(fields[COL.pillar_name]),
    pgLiteral(fields[COL.question_text]),
    pgLiteral(fields[COL.option_a]),
    pgLiteral(fields[COL.option_b]),
    pgLiteral(fields[COL.option_c]),
    pgLiteral(fields[COL.option_d]),
    pgLiteral(fields[COL.correct_answer]),
    pgLiteral(fields[COL.explanation]),
    pgLiteral(fields[COL.difficulty]),
  ]
  const isLast = index === validRows.length - 1
  return `  (${vals.join(', ')})${isLast ? '' : ','}`
})

const sql = [
  '-- Auto-generated by scripts/seed-questions.mjs',
  `-- Generated at: ${new Date().toISOString()}`,
  `-- Total questions: ${validRows.length}`,
  '',
  'INSERT INTO questions (',
  '  question_code,',
  '  pillar_code,',
  '  pillar_name,',
  '  question_text,',
  '  option_a,',
  '  option_b,',
  '  option_c,',
  '  option_d,',
  '  correct_answer,',
  '  explanation,',
  '  difficulty',
  ') VALUES',
  ...valueLines,
  'ON CONFLICT (question_code) DO NOTHING;',
  '',
].join('\n')

writeFileSync(SQL_PATH, sql, 'utf-8')

console.log('')
console.log(`SQL file written to: ${SQL_PATH}`)
console.log('Done.')
