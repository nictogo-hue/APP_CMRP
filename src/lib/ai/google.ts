import { createGoogleGenerativeAI } from '@ai-sdk/google'

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
}

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export const MODELS = {
  // LLM — rápido, streaming, español nativo
  chat: 'gemini-2.0-flash',
  // Embeddings — 3072 dims
  embedding: 'gemini-embedding-001',
} as const
