import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase, executeRPC } from '../supabase';
import { embed } from '../openai';
import { chunkText } from '../chunk';
import { buildPerFieldVectors, composeDocumentVector } from '../embeddings';
import { randomUUID } from 'crypto';

const router = Router();

const ingestSchema = z.object({
  type: z.enum(['video', 'plan', 'coach_info']),
  source_id: z.string().min(1),
  version: z.number().int().positive().default(1),
  to_embedding: z.object({
    Title: z.string().optional(),
    Transcription: z.string().optional(),
    Description: z.string().optional(),
    Purpose: z.string().optional(),
    Setup: z.string().optional(),
    CoachingPoints: z.string().optional(),
    Adaptations: z.string().optional(),
    LearningQuestions: z.string().optional(),
  }),
  metadata: z.record(z.any()),
  title: z.string().optional(),
  description: z.string().optional(),
});

// PII stripping function
const stripPII = (text: string): string => {
  if (!text) return text;
  
  // Remove email addresses
  let cleaned = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Remove phone numbers (various formats)
  cleaned = cleaned.replace(/\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, '[PHONE]');
  
  return cleaned;
};

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  // Use a symbol property or fallback to randomUUID if not present
  const requestId = (req as any).requestId || randomUUID();

  try {
    const logger = (req as any).logger || console;
    logger.info({ requestId }, 'Starting ingest request');
    
    // Validate request body
    const body = ingestSchema.parse(req.body);
    
    try {
      const itemId = randomUUID();
      
      // Check if item already exists (idempotency)
      const { data: existingItem, error: checkError } = await supabase
        .from('content_item')
        .select('id')
        .eq('type', body.type)
        .eq('source_id', body.source_id)
        .eq('version', body.version)
        .single();
      
      if (existingItem && !checkError) {
        logger.info({ requestId, itemId: existingItem.id }, 'Item already exists, returning existing ID');
        res.json({ ok: true, item_id: existingItem.id, message: 'Already ingested' });
        return;
      }
      
      // Upsert content item
      const { error: itemError } = await supabase
        .from('content_item')
        .upsert({
          id: itemId,
          type: body.type,
          source_id: body.source_id,
          version: body.version,
          title: body.title,
          description: body.description,
        })
        .select('id')
        .single();
      
      if (itemError) {
        throw new Error(`Failed to upsert content item: ${itemError.message}`);
      }
      
      // Upsert content metadata
      const { error: metadataError } = await supabase
        .from('content_metadata')
        .upsert({
          item_id: itemId,
          facets: body.metadata,
        });
      
      if (metadataError) {
        throw new Error(`Failed to upsert content metadata: ${metadataError.message}`);
      }
      
      // Process embeddings for each field
      const chunksByField: Record<string, string[]> = {};
      const allChunks: { field: string; chunkIndex: number; text: string }[] = [];
      
      for (const [field, value] of Object.entries(body.to_embedding)) {
        if (!value || typeof value !== 'string' || value.trim().length === 0) continue;
        
        const cleanedValue = stripPII(value);
        const chunks = chunkText(field, cleanedValue);
        chunksByField[field] = chunks;
        
        chunks.forEach((chunk, index) => {
          allChunks.push({
            field,
            chunkIndex: index,
            text: chunk,
          });
        });
      }
      
      logger.info({ requestId, totalChunks: allChunks.length }, 'Generated chunks for embedding');
      
      // Embed all chunks
      const chunkTexts = allChunks.map(chunk => chunk.text);
      let embeddings: number[][];
      
      try {
        embeddings = await embed(chunkTexts);
        if (embeddings.length !== chunkTexts.length) {
          throw new Error(`Embedding count mismatch: expected ${chunkTexts.length}, got ${embeddings.length}`);
        }
      } catch (error) {
        throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Insert chunks with embeddings
      const chunkInserts = allChunks.map((chunk, index) => ({
        item_id: itemId,
        field: chunk.field,
        chunk_index: chunk.chunkIndex,
        text: chunk.text,
        embedding: embeddings[index],
      }));
      
      const { error: chunksError } = await supabase
        .from('content_chunk')
        .insert(chunkInserts);
      
      if (chunksError) {
        throw new Error(`Failed to insert content chunks: ${chunksError.message}`);
      }
      
      // Build per-field vectors and compose document vector
      let perFieldVectors: { field: string; vec: number[]; w: number }[];
      let documentVector: number[];
      
      try {
        perFieldVectors = await buildPerFieldVectors(chunksByField, embed);
        if (perFieldVectors.length === 0) {
          throw new Error('No field vectors generated');
        }
        documentVector = composeDocumentVector(perFieldVectors);
      } catch (error) {
        throw new Error(`Failed to build document vector: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Upsert content item vector
      const { error: vectorError } = await supabase
        .from('content_item_vector')
        .upsert({
          item_id: itemId,
          method: 'weighted-mean',
          embedding: documentVector,
        });
      
      if (vectorError) {
        throw new Error(`Failed to upsert content item vector: ${vectorError.message}`);
      }
      
      // Refresh materialized view (fire-and-forget)
      executeRPC('refresh_content_item_ft').catch(error => {
        logger.error({ requestId, error: error.message }, 'Failed to refresh materialized view');
      });
      
      // Transaction is automatically committed by Supabase
      
      const duration = Date.now() - startTime;
      logger.info({ 
        requestId, 
        itemId, 
        duration, 
        chunkCount: allChunks.length,
        fieldCount: Object.keys(chunksByField).length 
      }, 'Successfully ingested item');
      
      res.json({ ok: true, item_id: itemId });
      
    } catch (error) {
      // Supabase handles rollback automatically
      throw error;
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const logger = (req as any).logger || console;
    logger.error({ 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration 
    }, 'Ingest request failed');
    
    res.status(400).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
