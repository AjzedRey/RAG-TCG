-- Simple database validation script
-- This version avoids complex system table queries that might fail

-- Check if extensions are installed
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname IN ('vector', 'pg_trgm', 'unaccent')
ORDER BY extname;

-- Check content_item table
SELECT 
  'content_item' as table_name,
  COUNT(*) as total_items,
  COUNT(DISTINCT type) as content_types,
  COUNT(DISTINCT source_id) as unique_sources,
  MIN(created_at) as oldest_item,
  MAX(created_at) as newest_item
FROM content_item;

-- Check content_chunk table
SELECT 
  'content_chunk' as table_name,
  COUNT(*) as total_chunks,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as chunks_with_embeddings,
  COUNT(DISTINCT item_id) as items_with_chunks,
  AVG(char_count) as avg_chunk_length
FROM content_chunk;

-- Check content_item_vector table
SELECT 
  'content_item_vector' as table_name,
  COUNT(*) as total_vectors,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as vectors_with_embeddings
FROM content_item_vector;

-- Check content_metadata table
SELECT 
  'content_metadata' as table_name,
  COUNT(*) as total_metadata,
  COUNT(CASE WHEN facets IS NOT NULL AND facets != '{}'::jsonb THEN 1 END) as metadata_with_facets
FROM content_metadata;

-- Check materialized view
SELECT 
  'content_item_ft' as view_name,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN tsv IS NOT NULL THEN 1 END) as entries_with_tsv
FROM content_item_ft;

-- Check for missing relationships
SELECT 
  'Missing content_metadata' as issue,
  COUNT(*) as count
FROM content_item ci
LEFT JOIN content_metadata cm ON ci.id = cm.item_id
WHERE cm.item_id IS NULL

UNION ALL

SELECT 
  'Missing content_chunks' as issue,
  COUNT(*) as count
FROM content_item ci
LEFT JOIN content_chunk cc ON ci.id = cc.item_id
WHERE cc.item_id IS NULL

UNION ALL

SELECT 
  'Missing content_item_vectors' as issue,
  COUNT(*) as count
FROM content_item ci
LEFT JOIN content_item_vector civ ON ci.id = civ.item_id
WHERE civ.item_id IS NULL;

-- Check embedding dimensions (using vector_dims function)
SELECT 
  'content_chunk' as table_name,
  vector_dims(embedding) as embedding_dimension,
  COUNT(*) as count
FROM content_chunk 
WHERE embedding IS NOT NULL
GROUP BY vector_dims(embedding)
ORDER BY embedding_dimension;

-- Check for empty or null embeddings
SELECT 
  'content_chunk' as table_name,
  'NULL embeddings' as issue,
  COUNT(*) as count
FROM content_chunk 
WHERE embedding IS NULL

UNION ALL

SELECT 
  'content_chunk' as table_name,
  'Empty embeddings' as issue,
  COUNT(*) as count
FROM content_chunk 
WHERE embedding IS NOT NULL AND vector_dims(embedding) = 0

UNION ALL

SELECT 
  'content_item_vector' as table_name,
  'NULL embeddings' as issue,
  COUNT(*) as count
FROM content_item_vector 
WHERE embedding IS NULL;
