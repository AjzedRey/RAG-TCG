-- Enable required extensions
create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Content type enum
create type content_type as enum ('video', 'plan', 'coach_info');

-- Content items table
create table content_item (
  id uuid primary key default gen_random_uuid(),
  type content_type not null,
  source_id text not null,
  version int not null default 1,
  title text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(type, source_id, version)
);

-- Content metadata table
create table content_metadata (
  item_id uuid primary key references content_item(id) on delete cascade,
  facets jsonb not null default '{}'::jsonb
);

-- Content chunks table
create table content_chunk (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references content_item(id) on delete cascade,
  field text not null,
  chunk_index int not null default 0,
  text text not null,
  char_count int generated always as (length(text)) stored,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- Content item vectors table
create table content_item_vector (
  item_id uuid primary key references content_item(id) on delete cascade,
  method text not null default 'weighted-mean',
  embedding vector(1536)
);

-- Indexes for content_chunk
create index idx_content_chunk_item_id on content_chunk(item_id);
create index idx_content_chunk_field on content_chunk(field);
create index idx_content_chunk_embedding on content_chunk using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

-- Indexes for content_item_vector
create index idx_content_item_vector_embedding on content_item_vector using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

-- Materialized view for full-text search
create materialized view content_item_ft as
select 
  ci.id,
  ci.type,
  ci.title,
  ci.description,
  to_tsvector('simple', coalesce(ci.title, '') || ' ' || coalesce(ci.description, '') || ' ' || 
    string_agg(cc.text, ' ')) as tsv
from content_item ci
left join content_chunk cc on ci.id = cc.item_id
group by ci.id, ci.type, ci.title, ci.description;

-- GIN index on the materialized view
create index idx_content_item_ft_tsv on content_item_ft using gin(tsv);

-- Unique index for concurrent refresh
create unique index idx_content_item_ft_id on content_item_ft(id);

-- BM25 search function
create or replace function search_bm25(query_text text, candidate_ids uuid[])
returns table(item_id uuid, bm25 real) language sql as $$
  with q as (select plainto_tsquery('simple', query_text) as q)
  select ci.id as item_id, ts_rank(ft.tsv, q.q) as bm25
  from content_item_ft ft
  join content_item ci on ci.id = ft.id, q
  where ci.id = any(candidate_ids)
$$;

-- Transaction helper functions
create or replace function begin_transaction() returns void language plpgsql as $$
begin
  -- Transactions are handled automatically by Supabase client
  -- This function is a no-op for compatibility
end;
$$;

create or replace function commit_transaction() returns void language plpgsql as $$
begin
  -- Transactions are handled automatically by Supabase client
  -- This function is a no-op for compatibility
end;
$$;

create or replace function rollback_transaction() returns void language plpgsql as $$
begin
  -- Transactions are handled automatically by Supabase client
  -- This function is a no-op for compatibility
end;
$$;

-- SQL execution function for custom queries
create or replace function exec_sql(sql text, params jsonb default '[]'::jsonb)
returns jsonb language plpgsql as $$
declare
  result jsonb;
begin
  execute sql into result using params;
  return result;
end;
$$;

-- RLS policies (commented out - writes via service role only)
/*
-- Enable RLS
alter table content_item enable row level security;
alter table content_metadata enable row level security;
alter table content_chunk enable row level security;
alter table content_item_vector enable row level security;

-- Read-only policies for public access
create policy "Allow public read access to content_item" on content_item for select using (true);
create policy "Allow public read access to content_metadata" on content_metadata for select using (true);
create policy "Allow public read access to content_chunk" on content_chunk for select using (true);
create policy "Allow public read access to content_item_vector" on content_item_vector for select using (true);
*/
