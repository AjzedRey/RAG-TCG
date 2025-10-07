import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase';
import { embed } from '../openai';
import { FIELD_WEIGHTS } from '../embeddings';
import { randomUUID } from 'crypto';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1),
  type: z.enum(['video', 'plan', 'coach_info']).optional(),
  filters: z.record(z.any()).optional().default({}),
  k: z.number().int().positive().max(100).default(10),
  fieldWeights: z.record(z.number().positive()).optional().default({}),
});

// Reciprocal Rank Fusion
const rrf = (vectorRank: number, bm25Rank: number): number => {
  return 1 / (60 + vectorRank) + 1 / (60 + bm25Rank);
};

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = (req as any).requestId || randomUUID();
  
  try {
    const logger = (req as any).logger || console;
    logger.info({ requestId }, 'Starting search request');
    
    // Validate request body
    const body = searchSchema.parse(req.body);
    
    // Embed query
    const queryEmbedding = await embed([body.query]);
    const queryVector = queryEmbedding[0];
    
    logger.info({ requestId }, 'Generated query embedding');
    
    // Coarse recall - get top 50 candidates
    let query = supabase
      .from('content_item_vector')
      .select(`
        item_id,
        embedding,
        content_item!inner(
          id,
          type,
          title,
          description,
          content_metadata(facets)
        )
      `);
    
    if (body.type) {
      query = query.eq('content_item.type', body.type);
    }
    
    if (Object.keys(body.filters).length > 0) {
      query = query.contains('content_item.content_metadata.facets', body.filters);
    }
    
    const { data: candidates, error: candidatesError } = await query
      .order('embedding <->', { ascending: true })
      .limit(50);
    
    if (candidatesError) {
      throw new Error(`Coarse recall failed: ${candidatesError.message}`);
    }
    
    if (!candidates || candidates.length === 0) {
      res.json({ matches: [] });
      return;
    }
    
    const candidateIds = candidates.map(c => c.item_id);
    logger.info({ requestId, candidateCount: candidateIds.length }, 'Retrieved candidates for refinement');
    
    // Chunk refine - get all chunks for candidates
    const { data: chunks, error: chunksError } = await supabase
      .from('content_chunk')
      .select('id, item_id, field, text, embedding')
      .in('item_id', candidateIds);
    
    if (chunksError) {
      throw new Error(`Chunk refine failed: ${chunksError.message}`);
    }
    
    // Compute vector scores for chunks
    const chunkScores = chunks.map(chunk => {
      if (!queryVector || !Array.isArray(chunk.embedding)) {
        throw new Error('Missing or invalid query vector or chunk embedding');
      }
      // Ensure queryVector is defined and has the same length as chunk.embedding
      if (
        !Array.isArray(queryVector) ||
        chunk.embedding.length !== queryVector.length
      ) {
        throw new Error('Embedding and query vector must be arrays of the same length');
      }
      // Calculate L2 distance
      const l2Distance = Math.sqrt(
        chunk.embedding.reduce((sum: number, value: number, i: number) => {
          const diff = value - (queryVector?.[i] ?? 0);
          return sum + diff * diff;
        }, 0)
      );
      // Convert distance to a similarity score (the lower the distance, the higher the score)
      const vectorScore = 1 / (1 + l2Distance);

      const fieldWeight = (body.fieldWeights && body.fieldWeights[chunk.field]) || FIELD_WEIGHTS[chunk.field] || 1.0;
      return {
        ...chunk,
        vectorScore: vectorScore * fieldWeight,
      };
    });
    
    // BM25 search over materialized view
    const { data: bm25Results, error: bm25Error } = await supabase
      .rpc('search_bm25', {
        query_text: body.query,
        candidate_ids: candidateIds,
      });
    
    if (bm25Error) {
      logger.warn({ requestId, error: bm25Error.message }, 'BM25 search failed, continuing with vector-only results');
    }
    
    // Create BM25 score map
    const bm25Scores = new Map<string, number>();
    if (bm25Results) {
      bm25Results.forEach((result: any) => {
        bm25Scores.set(result.item_id, result.bm25);
      });
    }
    
    // Fuse results with RRF
    const fusedResults = chunkScores.map((chunk, index) => {
      const bm25Score = bm25Scores.get(chunk.item_id) || 0;
      const vectorRank = index + 1;
      const bm25Rank = bm25Results ? 
        (bm25Results.findIndex((r: any) => r.item_id === chunk.item_id) + 1) || 1000 : 1000;
      
      const rrfScore = rrf(vectorRank, bm25Rank);
      
      return {
        ...chunk,
        rrfScore,
        bm25Score,
      };
    });
    
    // Sort by RRF score and take top k
    const topResults = fusedResults
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, body.k);
    
    // Get item details for results
    const itemIds = [...new Set(topResults.map(r => r.item_id))];
    const { data: itemDetails, error: itemDetailsError } = await supabase
      .from('content_item')
      .select(`
        id,
        type,
        title,
        description,
        content_metadata(facets)
      `)
      .in('id', itemIds);
    
    if (itemDetailsError) {
      throw new Error(`Failed to get item details: ${itemDetailsError.message}`);
    }
    
    const itemDetailsMap = new Map(itemDetails.map(item => [item.id, item]));

    // Format results
    const matches: Array<{
      item_id: string;
      type?: string;
      score: number;
      field: string;
      snippet: string;
      metadata: Record<string, any>;
    }> = topResults.map(result => {
      const item = itemDetailsMap.get(result.item_id);
      return {
        item_id: result.item_id,
        type: item?.type,
        score: result.rrfScore,
        field: result.field,
        snippet: result.text.substring(0, 200) + (result.text.length > 200 ? '...' : ''),
        metadata: Array.isArray(item?.content_metadata) && item.content_metadata.length > 0
          ? (item.content_metadata[0]?.facets ?? {})
          : {}
        }
      });
      const duration = Date.now() - startTime;
      logger.info({ 
        requestId, 
        duration, 
        resultCount: matches.length,
        candidateCount: candidateIds.length 
    }, 'Search completed successfully');
    
    res.json({ matches });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const logger = (req as any).logger || console;
    logger.error({ 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration 
    }, 'Search request failed');
    
    res.status(400).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
