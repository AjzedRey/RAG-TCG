-- Basic database check - avoids complex system queries
-- This script checks the essential components without using system tables

-- Check content_item table
SELECT 
  'content_item' as table_name,
  COUNT(*) as total_items,
  COUNT(DISTINCT type) as content_types,
  MIN(created_at) as oldest_item,
  MAX(created_at) as newest_item
FROM content_item;

-- Check content_chunk table
SELECT 
  'content_chunk' as table_name,
  COUNT(*) as total_chunks,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as chunks_with_embeddings,
  COUNT(DISTINCT item_id) as items_with_chunks
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
  COUNT(*) as total_metadata
FROM content_metadata;

-- Check materialized view
SELECT 
  'content_item_ft' as view_name,
  COUNT(*) as total_entries
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

-- Check for NULL embeddings
SELECT 
  'content_chunk NULL embeddings' as issue,
  COUNT(*) as count
FROM content_chunk 
WHERE embedding IS NULL

UNION ALL

SELECT 
  'content_item_vector NULL embeddings' as issue,
  COUNT(*) as count
FROM content_item_vector 
WHERE embedding IS NULL;
