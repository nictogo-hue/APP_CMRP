import { createGoogleGenerativeAI } from '@ai-sdk/google'

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'MISSING_API_KEY',
})

export const MODELS = {
  // LLM — rápido, streaming, español nativo
  chat: 'gemini-1.5-flash',
  // Embeddings — 3072 dims
  embedding: 'gemini-embedding-001',
} as const
