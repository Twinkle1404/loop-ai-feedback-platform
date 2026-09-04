import { GoogleGenAI } from '@google/genai'
import { prisma } from '@/lib/db'

/**
 * Google Gemini embedding model configuration.
 * gemini-embedding-001 with outputDimensionality configured to 768
 * produces 768-dimensional vector embeddings.
 */
const EMBEDDING_MODEL = 'gemini-embedding-001'
const EMBEDDING_DIMENSIONS = 768

/**
 * Minimum cosine similarity threshold for retrieval.
 * Results below this threshold are considered irrelevant and excluded.
 * Cosine similarity ranges from -1 to 1, where 1 = identical.
 * 0.25 is a reasonable threshold for semantic retrieval.
 */
export const MIN_SIMILARITY_THRESHOLD = 0.25

/**
 * Maximum number of similar feedback items to retrieve for Q&A context.
 */
export const TOP_K = 8

/**
 * Maximum character length for content snippets returned in sources.
 */
const MAX_SNIPPET_LENGTH = 300

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Returns a server-side Google GenAI client if GEMINI_API_KEY is configured.
 * Never exposes the API key to client-side code.
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Generates a 768-dimensional embedding vector for the given text
 * using Google Gemini (gemini-embedding-001).
 *
 * Automatically retries with exponential backoff on 429 / rate limits.
 * Returns null if the Gemini API key is not configured or if the call fails.
 * Never throws — errors are logged server-side without exposing credentials.
 */
export async function generateEmbedding(
  text: string,
  retries = 3
): Promise<number[] | null> {
  const client = getGeminiClient()
  if (!client) {
    console.warn(
      'Gemini API key is not configured. Skipping embedding generation.'
    )
    return null
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text.slice(0, 8000), // Limit input to avoid token limits
        config: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
        },
      })

      const vector = response.embeddings?.[0]?.values
      if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
        console.error(
          `Unexpected embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${vector?.length}`
        )
        return null
      }

      return vector
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const isRateLimit =
        errMsg.includes('429') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('RESOURCE_EXHAUSTED')

      if (isRateLimit && attempt < retries) {
        console.warn(
          `Gemini embedding rate-limited on attempt ${attempt}, retrying in ${attempt * 2000}ms...`
        )
        await sleep(attempt * 2000)
        continue
      }

      console.error('Gemini embedding generation failed:', errMsg)
      return null
    }
  }

  return null
}

/**
 * Generates and stores an embedding for a feedback item.
 * Skips if the feedback already has an embedding (idempotent).
 * Never corrupts or deletes the feedback record on failure.
 *
 * @param feedbackId - The feedback record ID
 * @param content - The feedback content to embed
 */
export async function storeEmbedding(
  feedbackId: string,
  content: string
): Promise<void> {
  const vector = await generateEmbedding(content)
  if (!vector) {
    return // Embedding generation failed or provider unavailable
  }

  try {
    // Use raw SQL to insert or update the pgvector vector type
    const vectorStr = `[${vector.join(',')}]`
    await prisma.$queryRawUnsafe(
      `INSERT INTO "Embedding" (id, "feedbackId", vector) VALUES (gen_random_uuid()::text, $1, $2::vector) ON CONFLICT ("feedbackId") DO UPDATE SET vector = EXCLUDED.vector`,
      feedbackId,
      vectorStr
    )
  } catch (err) {
    console.error(
      'Failed to store embedding:',
      err instanceof Error ? err.message : 'Unknown error'
    )
    // Do NOT throw — embedding failure must not affect the feedback record
  }
}

/**
 * Result from a similarity search against the Embedding table.
 */
export interface SimilarFeedback {
  id: string
  content: string
  channel: string
  sentiment: string | null
  createdAt: Date
  similarity: number
}

/**
 * Retrieves the top K most similar feedback items from the authenticated
 * user's workspace using pgvector cosine similarity search.
 *
 * Only returns results above MIN_SIMILARITY_THRESHOLD.
 * Strictly scoped to the given workspaceId — never returns cross-tenant data.
 *
 * @param questionVector - The embedding vector for the user's question
 * @param workspaceId - The authenticated user's workspace ID
 * @returns Array of similar feedback items sorted by similarity descending
 */
export async function findSimilarFeedback(
  questionVector: number[],
  workspaceId: string
): Promise<SimilarFeedback[]> {
  const vectorStr = `[${questionVector.join(',')}]`

  // Use pgvector cosine distance operator (<=>)
  // 1 - cosine_distance = cosine_similarity
  // Filter by workspace AND minimum similarity threshold
  const results = await prisma.$queryRawUnsafe<SimilarFeedback[]>(
    `
    SELECT
      f.id,
      f.content,
      f.channel,
      f.sentiment,
      f."createdAt",
      1 - (e.vector <=> $1::vector) as similarity
    FROM "Embedding" e
    INNER JOIN "Feedback" f ON f.id = e."feedbackId"
    WHERE f."workspaceId" = $2
      AND 1 - (e.vector <=> $1::vector) >= $3
    ORDER BY e.vector <=> $1::vector ASC
    LIMIT $4
    `,
    vectorStr,
    workspaceId,
    MIN_SIMILARITY_THRESHOLD,
    TOP_K
  )

  return results
}

/**
 * Truncates content to a safe bounded snippet for source display.
 */
export function createContentSnippet(content: string): string {
  if (content.length <= MAX_SNIPPET_LENGTH) {
    return content
  }
  return content.slice(0, MAX_SNIPPET_LENGTH) + '...'
}
