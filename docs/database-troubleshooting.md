# Database Troubleshooting Guide

This guide helps you diagnose and fix database population issues in your AI chatbot application.

## Quick Health Check

Run the database health check script to diagnose issues:

```bash
node scripts/check-database.js
```

## Common Issues and Solutions

### 1. Database Not Populating

**Symptoms:**
- No data in tables after running ingest
- Empty search results
- Missing embeddings

**Causes & Solutions:**

#### Missing Extensions
```sql
-- Check if extensions are installed
SELECT extname, extversion FROM pg_extension 
WHERE extname IN ('vector', 'pg_trgm', 'unaccent');

-- Install missing extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

#### Environment Variables
Check your `.env` file has:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

#### API Key Issues
- Verify OpenAI API key is valid and has credits
- Check Supabase service role key has proper permissions

### 2. Embeddings Not Generated

**Symptoms:**
- Content chunks exist but have NULL embeddings
- Search returns no results
- Embedding dimension errors

**Solutions:**

#### Check OpenAI API
```bash
# Test OpenAI API directly
curl -X POST https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": ["test text"]
  }'
```

#### Verify Embedding Model
Check your environment variable:
```env
EMBED_MODEL=text-embedding-3-small
EMBED_DIM=1536
```

**Important:** Use `text-embedding-3-small` (1536D) for Supabase compatibility. 
`text-embedding-3-large` (3072D) exceeds Supabase's 2000 dimension limit.

#### Check Embedding Dimensions
```sql
-- Check embedding dimensions
SELECT 
  array_length(embedding, 1) as dimension,
  COUNT(*) as count
FROM content_chunk 
WHERE embedding IS NOT NULL
GROUP BY array_length(embedding, 1);
```

### 3. Materialized View Issues

**Symptoms:**
- Search returns no results
- Materialized view is empty
- Concurrent refresh errors

**Solutions:**

#### Fix Materialized View
```sql
-- Add unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_item_ft_id 
ON content_item_ft(id);

-- Refresh the view
REFRESH MATERIALIZED VIEW content_item_ft;
```

#### Check View Content
```sql
-- Check materialized view content
SELECT COUNT(*) as total_entries FROM content_item_ft;
SELECT id, type, title FROM content_item_ft LIMIT 5;
```

### 4. Missing Relationships

**Symptoms:**
- Items exist but have no chunks/vectors/metadata
- Incomplete data after ingest

**Solutions:**

#### Check Relationships
```sql
-- Items without metadata
SELECT ci.id, ci.type, ci.source_id
FROM content_item ci
LEFT JOIN content_metadata cm ON ci.id = cm.item_id
WHERE cm.item_id IS NULL;

-- Items without chunks
SELECT ci.id, ci.type, ci.source_id
FROM content_item ci
LEFT JOIN content_chunk cc ON ci.id = cc.item_id
WHERE cc.item_id IS NULL;

-- Items without vectors
SELECT ci.id, ci.type, ci.source_id
FROM content_item ci
LEFT JOIN content_item_vector civ ON ci.id = civ.item_id
WHERE civ.item_id IS NULL;
```

#### Clean Up Orphaned Records
```sql
-- Remove orphaned chunks
DELETE FROM content_chunk 
WHERE item_id NOT IN (SELECT id FROM content_item);

-- Remove orphaned metadata
DELETE FROM content_metadata 
WHERE item_id NOT IN (SELECT id FROM content_item);

-- Remove orphaned vectors
DELETE FROM content_item_vector 
WHERE item_id NOT IN (SELECT id FROM content_item);
```

### 5. Performance Issues

**Symptoms:**
- Slow search queries
- Timeout errors
- High CPU usage

**Solutions:**

#### Check Indexes
```sql
-- Check if indexes exist
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('content_item', 'content_chunk', 'content_item_vector', 'content_metadata', 'content_item_ft');
```

#### Update Statistics
```sql
-- Update table statistics
ANALYZE content_item;
ANALYZE content_chunk;
ANALYZE content_item_vector;
ANALYZE content_metadata;
ANALYZE content_item_ft;
```

## Database Validation Scripts

### 1. Complete Database Check
Run the comprehensive validation:
```sql
-- Run the validation script
\i src/sql/validate_database.sql
```

### 2. Fix Common Issues
Apply fixes for common problems:
```sql
-- Run the fix script
\i src/sql/fix_database.sql
```

### 3. Health Check Script
Use the Node.js health check:
```bash
node scripts/check-database.js
```

## Testing Your Setup

### 1. Test Ingest
```bash
# Test with sample data
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d @test-ingest.json
```

### 2. Test Search
```bash
# Test search functionality
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "k": 5
  }'
```

### 3. Check Health
```bash
# Check API health
curl http://localhost:3000/health
```

## Monitoring

### Key Metrics to Monitor
- Number of content items
- Number of chunks with embeddings
- Number of item vectors
- Materialized view freshness
- Search response times

### Logs to Check
- Ingest logs for embedding failures
- OpenAI API response logs
- Supabase connection logs
- Materialized view refresh logs

## Recovery Procedures

### Complete Reset
If all else fails, you can reset the database:

```sql
-- WARNING: This will delete all data
DROP TABLE IF EXISTS content_item_ft CASCADE;
DROP TABLE IF EXISTS content_item_vector CASCADE;
DROP TABLE IF EXISTS content_chunk CASCADE;
DROP TABLE IF EXISTS content_metadata CASCADE;
DROP TABLE IF EXISTS content_item CASCADE;
DROP TYPE IF EXISTS content_type CASCADE;

-- Re-run schema
\i src/sql/schema.sql
```

### Partial Reset
Reset specific components:

```sql
-- Reset embeddings only
DELETE FROM content_chunk;
DELETE FROM content_item_vector;
REFRESH MATERIALIZED VIEW content_item_ft;
```

## Getting Help

If you're still experiencing issues:

1. Run the health check script and share the output
2. Check your environment variables
3. Verify your Supabase and OpenAI API keys
4. Check the application logs for specific error messages
5. Ensure all required database extensions are installed

## Prevention

To prevent database population issues:

1. Always validate environment variables on startup
2. Implement proper error handling in ingest routes
3. Use transactions for multi-step operations
4. Monitor embedding generation success rates
5. Set up alerts for failed materialized view refreshes
