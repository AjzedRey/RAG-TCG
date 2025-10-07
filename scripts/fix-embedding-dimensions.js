#!/usr/bin/env node

/**
 * Fix Embedding Dimensions Script
 * 
 * This script helps you fix the embedding dimension mismatch.
 * You can either:
 * 1. Update your database to support 3072 dimensions (for text-embedding-3-large)
 * 2. Update your environment to use 1536 dimensions (for text-embedding-3-small)
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

async function checkCurrentSetup() {
  console.log('🔍 Checking current embedding setup...\n');

  try {
    // Check current environment
    const embedModel = process.env.EMBED_MODEL || 'text-embedding-3-small';
    const embedDim = process.env.EMBED_DIM || '1536';
    
    console.log(`📋 Current Configuration:`);
    console.log(`   - Embedding Model: ${embedModel}`);
    console.log(`   - Expected Dimensions: ${embedDim}`);
    
    // Check what dimensions the model actually produces
    let expectedDims;
    switch (embedModel) {
      case 'text-embedding-3-small':
        expectedDims = 1536;
        break;
      case 'text-embedding-3-large':
        expectedDims = 3072;
        console.log(`\n⚠️  WARNING: text-embedding-3-large produces 3072 dimensions`);
        console.log(`   This exceeds Supabase's 2000 dimension limit!`);
        console.log(`   Consider using text-embedding-3-small instead.`);
        break;
      case 'text-embedding-ada-002':
        expectedDims = 1536;
        break;
      default:
        expectedDims = 1536;
    }
    
    console.log(`   - Model produces: ${expectedDims} dimensions`);
    
    if (parseInt(embedDim) !== expectedDims) {
      console.log(`\n⚠️  MISMATCH DETECTED!`);
      console.log(`   Your environment expects ${embedDim} dimensions but ${embedModel} produces ${expectedDims} dimensions.`);
    } else {
      console.log(`\n✅ Configuration looks correct!`);
    }

    // Check database schema
    console.log(`\n🗄️  Checking database schema...`);
    
    try {
      // Try to get a sample embedding to check dimensions
      const { data: sampleChunk, error: chunkError } = await supabase
        .from('content_chunk')
        .select('embedding')
        .not('embedding', 'is', null)
        .limit(1)
        .single();
      
      if (chunkError && chunkError.code === 'PGRST116') {
        console.log('   - No embeddings found in database yet');
      } else if (chunkError) {
        console.log(`   - Error checking embeddings: ${chunkError.message}`);
      } else if (sampleChunk && sampleChunk.embedding) {
        const actualDims = sampleChunk.embedding.length;
        console.log(`   - Database has embeddings with ${actualDims} dimensions`);
        
        if (actualDims !== expectedDims) {
          console.log(`\n⚠️  DATABASE SCHEMA MISMATCH!`);
          console.log(`   Database has ${actualDims}D vectors but model produces ${expectedDims}D vectors.`);
        }
      }
    } catch (error) {
      console.log(`   - Could not check database embeddings: ${error.message}`);
    }

    console.log(`\n🔧 RECOMMENDED SOLUTIONS:`);
    console.log(`\n1. Use text-embedding-3-small (1536D) - RECOMMENDED for Supabase:`);
    console.log(`   - Set EMBED_MODEL=text-embedding-3-small in your .env file`);
    console.log(`   - Set EMBED_DIM=1536 in your .env file`);
    console.log(`   - Your current database schema is already correct for this`);
    console.log(`   - This works within Supabase's 2000 dimension limit`);
    
    console.log(`\n2. Note about text-embedding-3-large (3072D):`);
    console.log(`   - NOT RECOMMENDED: Exceeds Supabase's 2000 dimension limit`);
    console.log(`   - Supabase only supports up to 2000 dimensions`);
    console.log(`   - Use text-embedding-3-small instead for better compatibility`);
    
    console.log(`\n3. If you have existing data with wrong dimensions:`);
    console.log(`   - You may need to clear existing embeddings and re-ingest`);
    console.log(`   - Run: DELETE FROM content_chunk; DELETE FROM content_item_vector;`);
    
  } catch (error) {
    console.error('❌ Error checking setup:', error.message);
  }
}

// Run the check
checkCurrentSetup().catch(console.error);
