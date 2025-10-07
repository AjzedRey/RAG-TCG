import { mean, weightedMean } from './chunk';

export const FIELD_WEIGHTS: Record<string, number> = {
  Title: 3.0,
  CoachingPoints: 2.0,
  Purpose: 1.5,
  Description: 1.2,
  Setup: 1.2,
  Adaptations: 1.1,
  LearningQuestions: 1.1,
  Transcription: 1.0,
};

export const buildPerFieldVectors = async (
  chunksByField: Record<string, string[]>,
  embedFn: (texts: string[]) => Promise<number[][]>
): Promise<{ field: string; vec: number[]; w: number }[]> => {
  const results: { field: string; vec: number[]; w: number }[] = [];
  
  for (const [field, chunks] of Object.entries(chunksByField)) {
    if (chunks.length === 0) continue;
    
    try {
      const embeddings = await embedFn(chunks);
      const fieldVector = mean(embeddings);
      const weight = FIELD_WEIGHTS[field] || 1.0;
      
      results.push({
        field,
        vec: fieldVector,
        w: weight,
      });
    } catch (error) {
      console.error(`Failed to embed field ${field}:`, error);
      // Continue with other fields
    }
  }
  
  return results;
};

export const composeDocumentVector = (
  perField: { field: string; vec: number[]; w: number }[],
  defaultWeight = 1.0
): number[] => {
  if (perField.length === 0) {
    throw new Error('Cannot compose document vector from empty per-field vectors');
  }
  
  return weightedMean(perField.map(({ vec, w }) => ({ vec, w: w || defaultWeight })));
};


