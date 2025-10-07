import { encoding_for_model } from '@dqbd/tiktoken';

const MAX_TOKENS = 1000;
const OVERLAP = 50;

const tokenizer = encoding_for_model('gpt-4');

export const chunkText = (label: string, value: string): string[] => {
  if (!value || value.trim().length === 0) {
    return [];
  }

  const prefixedText = `${label}: ${value}`;
  const tokens = tokenizer.encode(prefixedText);
  
  if (tokens.length <= MAX_TOKENS) {
    return [prefixedText];
  }

  const chunks: string[] = [];
  let start = 0;
  
  while (start < tokens.length) {
    const end = Math.min(start + MAX_TOKENS, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const chunkText = tokenizer.decode(chunkTokens);
    chunks.push(String(chunkText));
    
    if (end >= tokens.length) break;
    
    // Move start position with overlap
    start = end - OVERLAP;
    if (start < 0) start = 0;
  }
  
  return chunks;
};

export const mean = (vectors: number[][]): number[] => {
  if (vectors.length === 0) {
    throw new Error('Cannot compute mean of empty vector array');
  }
  
  const dimension = vectors[0]?.length || 0;
  const result = new Array(dimension).fill(0);
  
  for (const vector of vectors) {
    for (let i = 0; i < dimension; i++) {
      result[i] += vector[i];
    }
  }
  
  for (let i = 0; i < dimension; i++) {
    result[i] /= vectors.length;
  }
  
  return result;
};

export const weightedMean = (entries: { vec: number[]; w: number }[]): number[] => {
  if (entries.length === 0) {
    throw new Error('Cannot compute weighted mean of empty entries array');
  }
  
  const dimension = entries[0]?.vec?.length || 0;
  const result = new Array(dimension).fill(0);
  let totalWeight = 0;
  
  for (const { vec, w } of entries) {
    totalWeight += w;
    for (let i = 0; i < dimension; i++) {
      result[i] += (vec[i] || 0) * w;
    }
  }
  
  if (totalWeight === 0) {
    throw new Error('Total weight cannot be zero');
  }
  
  for (let i = 0; i < dimension; i++) {
    result[i] /= totalWeight;
  }
  
  return result;
};


