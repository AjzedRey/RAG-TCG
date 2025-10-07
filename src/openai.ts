import OpenAI from 'openai';
import { env } from './env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
});

export const embed = async (texts: string[]): Promise<number[][]> => {
  try {
    const response = await openai.embeddings.create({
      model: env.EMBED_MODEL,
      input: texts,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    throw new Error(`OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};


