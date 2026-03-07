import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Credenciales extraídas de scripts/apply-migration.mjs
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
    return true
}

async function main() {
    console.log('=== CMRP Mastery — Applying Final Vector Fix (768 Dims) ===')

    const sqlPath = join(__dirname, '..', 'supabase', 'final_fix_768.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    const ok = await executeSQL('Aplicando parche 768 dims', sql)

    if (ok) {
        console.log('\n=== Parche aplicado con éxito ===')
    } else {
        console.error('\nFalló la aplicación del parche.')
        process.exit(1)
    }
}

main().catch(console.error)
