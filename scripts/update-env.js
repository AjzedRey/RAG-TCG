#!/usr/bin/env node

/**
 * Update Environment Configuration Script
 * 
 * This script updates your .env file to use the correct embedding model and dimensions.
 */

const fs = require('fs');
const path = require('path');

function updateEnvFile() {
  console.log('🔧 Updating environment configuration...\n');

  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), 'env.example');

  // Read existing .env or create from example
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Found existing .env file');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log('📄 Using env.example as template');
  } else {
    console.log('📄 Creating new .env file');
    envContent = `PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
EMBED_MODEL=text-embedding-3-large
EMBED_DIM=3072
IVF_LISTS=100
`;
  }

  // Update the configuration
  let updatedContent = envContent;
  
  // Update EMBED_MODEL
  if (updatedContent.includes('EMBED_MODEL=')) {
    updatedContent = updatedContent.replace(/EMBED_MODEL=.*/, 'EMBED_MODEL=text-embedding-3-small');
  } else {
    updatedContent += '\nEMBED_MODEL=text-embedding-3-small';
  }
  
  // Update EMBED_DIM
  if (updatedContent.includes('EMBED_DIM=')) {
    updatedContent = updatedContent.replace(/EMBED_DIM=.*/, 'EMBED_DIM=1536');
  } else {
    updatedContent += '\nEMBED_DIM=1536';
  }

  // Write the updated content
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('✅ Updated .env file with:');
  console.log('   EMBED_MODEL=text-embedding-3-small');
  console.log('   EMBED_DIM=1536');
  
  console.log('\n📝 Make sure to set your actual API keys in the .env file:');
  console.log('   - OPENAI_API_KEY=your_actual_openai_key');
  console.log('   - SUPABASE_URL=your_actual_supabase_url');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key');
}

updateEnvFile();
