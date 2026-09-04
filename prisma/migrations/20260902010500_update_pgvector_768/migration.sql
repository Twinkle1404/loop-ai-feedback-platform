-- Drop the existing HNSW index configured on vector(1536)
DROP INDEX IF EXISTS "Embedding_vector_hnsw_idx";

-- Alter column to vector(768) and nullify existing incompatible 1536-D vectors
ALTER TABLE "Embedding" ALTER COLUMN "vector" TYPE vector(768) USING NULL;

-- Recreate HNSW cosine similarity index for vector(768)
CREATE INDEX "Embedding_vector_hnsw_idx"
  ON "Embedding"
  USING hnsw ("vector" vector_cosine_ops);
