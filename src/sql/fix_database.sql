-- Database fix script
-- Run this to fix common database population issues

-- 1. Ensure all required extensions are installed
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. Fix missing unique index for concurrent materialized view refresh
DROP INDEX IF EXISTS idx_content_item_ft_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_item_ft_id ON content_item_ft(id);

-- 3. Refresh materialized view to ensure it's up to date
REFRESH MATERIALIZED VIEW content_item_ft;

-- 4. Create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_content_chunk_item_id ON content_chunk(item_id);
CREATE INDEX IF NOT EXISTS idx_content_chunk_field ON content_chunk(field);
CREATE INDEX IF NOT EXISTS idx_content_chunk_embedding ON content_chunk USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_content_item_vector_embedding ON content_item_vector USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_content_item_ft_tsv ON content_item_ft USING gin(tsv);

-- 5. Update statistics for better query planning
ANALYZE content_item;
ANALYZE content_chunk;
ANALYZE content_item_vector;
ANALYZE content_metadata;
ANALYZE content_item_ft;

-- 6. Check for orphaned records and clean them up
-- Remove chunks without corresponding content items
DELETE FROM content_chunk 
WHERE item_id NOT IN (SELECT id FROM content_item);

-- Remove metadata without corresponding content items
DELETE FROM content_metadata 
WHERE item_id NOT IN (SELECT id FROM content_item);

-- Remove vectors without corresponding content items
DELETE FROM content_item_vector 
WHERE item_id NOT IN (SELECT id FROM content_item);

-- 7. Ensure all content items have metadata (create empty if missing)
INSERT INTO content_metadata (item_id, facets)
SELECT ci.id, '{}'::jsonb
FROM content_item ci
LEFT JOIN content_metadata cm ON ci.id = cm.item_id
WHERE cm.item_id IS NULL;

-- 8. Refresh materialized view again after cleanup
REFRESH MATERIALIZED VIEW content_item_ft;
