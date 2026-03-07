import { generateEmbedding } from './src/lib/ai/embeddings.ts'
import { createServiceClient } from './src/lib/supabase/server.ts'

async function testRAG() {
    const query = "¿De qué trata el pilar 1 del SMRP?"
    console.log(`Testing RAG for: "${query}"`)

    try {
        const embedding = await generateEmbedding(query)
        console.log(`Embedding generated (dim: ${embedding.length})`)

        const supabase = createServiceClient()
        const { data, error } = await supabase.rpc('match_chunks', {
            query_embedding: embedding,
            match_threshold: 0.1, // Umbral muy bajo para forzar resultados
            match_count: 5
        })

        if (error) {
            console.error('RPC Error:', error)
        } else {
            console.log(`Found ${data.length} results:`)
            data.forEach((d, i) => {
                console.log(`[${i + 1}] Similarity: ${d.similarity.toFixed(4)} - Source: ${d.source_display_name}`)
            })
        }
    } catch (err) {
        console.error('Test Error:', err)
    }
}

testRAG()
