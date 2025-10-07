import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3000'),
  OPENAI_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  EMBED_MODEL: z.string().default('text-embedding-3-small'),
  EMBED_DIM: z.string().transform(Number).pipe(z.number().positive()).default('1536'),
  IVF_LISTS: z.string().transform(Number).pipe(z.number().positive()).default('100'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);


