#!/usr/bin/env node

/**
 * Database Health Check Script
 * 
 * This script validates that your database is properly set up and populated.
 * Run this to diagnose database population issues.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function checkDatabase() {
  console.log('🔍 Checking database health...\n');

  try {
    // Check extensions
    console.log('📦 Checking extensions...');
    const { data: extensions, error: extError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'unaccent') ORDER BY extname",
        params: []
      });
    
    if (extError) {
      console.log('❌ Could not check extensions:', extError.message);
    } else {
      const requiredExts = ['vector', 'pg_trgm', 'unaccent'];
      const installedExts = extensions.map(e => e.extname);
      const missingExts = requiredExts.filter(ext => !installedExts.includes(ext));
      
      if (missingExts.length > 0) {
        console.log('❌ Missing extensions:', missingExts.join(', '));
      } else {
        console.log('✅ All required extensions installed');
        extensions.forEach(ext => {
          console.log(`   - ${ext.extname}: ${ext.extversion}`);
        });
      }
    }

    // Check content_item table
    console.log('\n📄 Checking content_item table...');
    const { data: items, error: itemsError } = await supabase
      .from('content_item')
      .select('id, type, source_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (itemsError) {
      console.log('❌ Error reading content_item:', itemsError.message);
    } else {
      console.log(`✅ Found ${items.length} content items`);
      if (items.length > 0) {
        console.log('   Recent items:');
        items.forEach(item => {
          console.log(`   - ${item.type}: ${item.source_id} (${item.created_at})`);
        });
      }
    }

    // Check content_chunk table
    console.log('\n🧩 Checking content_chunk table...');
    const { data: chunks, error: chunksError } = await supabase
      .from('content_chunk')
      .select('id, item_id, field, char_count, embedding')
      .not('embedding', 'is', null)
      .limit(5);
    
    if (chunksError) {
      console.log('❌ Error reading content_chunk:', chunksError.message);
    } else {
      console.log(`✅ Found ${chunks.length} chunks with embeddings`);
      if (chunks.length > 0) {
        console.log('   Sample chunks:');
        chunks.forEach(chunk => {
          const embeddingDim = chunk.embedding ? chunk.embedding.length : 0;
          console.log(`   - ${chunk.field}: ${chunk.char_count} chars, ${embeddingDim}D embedding`);
        });
      }
    }

    // Check content_item_vector table
    console.log('\n🎯 Checking content_item_vector table...');
    const { data: vectors, error: vectorsError } = await supabase
      .from('content_item_vector')
      .select('item_id, method, embedding')
      .not('embedding', 'is', null);
    
    if (vectorsError) {
      console.log('❌ Error reading content_item_vector:', vectorsError.message);
    } else {
      console.log(`✅ Found ${vectors.length} item vectors`);
      if (vectors.length > 0) {
        const embeddingDim = vectors[0].embedding ? vectors[0].embedding.length : 0;
        console.log(`   - Embedding dimension: ${embeddingDim}`);
        console.log(`   - Method: ${vectors[0].method}`);
      }
    }

    // Check content_metadata table
    console.log('\n🏷️  Checking content_metadata table...');
    const { data: metadata, error: metadataError } = await supabase
      .from('content_metadata')
      .select('item_id, facets')
      .limit(5);
    
    if (metadataError) {
      console.log('❌ Error reading content_metadata:', metadataError.message);
    } else {
      console.log(`✅ Found ${metadata.length} metadata entries`);
    }

    // Check materialized view
    console.log('\n🔍 Checking materialized view...');
    const { data: ft, error: ftError } = await supabase
      .from('content_item_ft')
      .select('id, type, title')
      .limit(5);
    
    if (ftError) {
      console.log('❌ Error reading materialized view:', ftError.message);
    } else {
      console.log(`✅ Found ${ft.length} entries in materialized view`);
      if (ft.length > 0) {
        console.log('   Sample entries:');
        ft.forEach(entry => {
          console.log(`   - ${entry.type}: ${entry.title || 'No title'}`);
        });
      }
    }

    // Check for missing relationships
    console.log('\n🔗 Checking relationships...');
    
    // Items without metadata
    const { data: itemsWithoutMetadata, error: noMetaError } = await supabase
      .from('content_item')
      .select('id, type, source_id')
      .not('id', 'in', `(SELECT item_id FROM content_metadata)`);
    
    if (noMetaError) {
      console.log('❌ Error checking metadata relationships:', noMetaError.message);
    } else if (itemsWithoutMetadata.length > 0) {
      console.log(`⚠️  Found ${itemsWithoutMetadata.length} items without metadata`);
    } else {
      console.log('✅ All items have metadata');
    }

    // Items without chunks
    const { data: itemsWithoutChunks, error: noChunksError } = await supabase
      .from('content_item')
      .select('id, type, source_id')
      .not('id', 'in', `(SELECT item_id FROM content_chunk)`);
    
    if (noChunksError) {
      console.log('❌ Error checking chunk relationships:', noChunksError.message);
    } else if (itemsWithoutChunks.length > 0) {
      console.log(`⚠️  Found ${itemsWithoutChunks.length} items without chunks`);
    } else {
      console.log('✅ All items have chunks');
    }

    // Items without vectors
    const { data: itemsWithoutVectors, error: noVectorsError } = await supabase
      .from('content_item')
      .select('id, type, source_id')
      .not('id', 'in', `(SELECT item_id FROM content_item_vector)`);
    
    if (noVectorsError) {
      console.log('❌ Error checking vector relationships:', noVectorsError.message);
    } else if (itemsWithoutVectors.length > 0) {
      console.log(`⚠️  Found ${itemsWithoutVectors.length} items without vectors`);
    } else {
      console.log('✅ All items have vectors');
    }

    console.log('\n🎉 Database health check complete!');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkDatabase().catch(console.error);
