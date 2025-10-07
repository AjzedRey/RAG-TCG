-- Clear existing embeddings to fix dimension mismatches
-- WARNING: This will delete all existing embeddings and require re-ingestion

-- Clear all embeddings from content_chunk
UPDATE content_chunk SET embedding = NULL;

-- Clear all embeddings from content_item_vector  
UPDATE content_item_vector SET embedding = NULL;

-- Alternative: Delete all chunks and vectors (more thorough)
-- DELETE FROM content_chunk;
-- DELETE FROM content_item_vector;

-- Refresh materialized view after clearing
REFRESH MATERIALIZED VIEW content_item_ft;
