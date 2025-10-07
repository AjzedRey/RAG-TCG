import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(
  env.SUPABASE_URL || process.env.SUPABASE_URL || '', 
  env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '', 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const executeRPC = async <T = any>(functionName: string, args?: any): Promise<T> => {
  const { data, error } = await supabase.rpc(functionName, args);
  if (error) {
    throw new Error(`RPC ${functionName} failed: ${error.message}`);
  }
  return data;
};

export const executeQuery = async <T = any>(query: string, args?: any[]): Promise<T> => {
  const { error } = await supabase.from('_').select('*').limit(0); // Dummy query to get client
  if (error) {
    throw new Error(`Query failed: ${error.message}`);
  }
  
  // For custom queries, we'll use the raw SQL approach
  const { data: result, error: queryError } = await supabase.rpc('exec_sql', { 
    sql: query, 
    params: args 
  });
  
  if (queryError) {
    throw new Error(`SQL execution failed: ${queryError.message}`);
  }
  
  return result;
};


