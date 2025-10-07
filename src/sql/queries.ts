export const QUERIES = {
  // Upsert content item
  upsertContentItem: `
    insert into content_item (id, type, source_id, version, title, description)
    values ($1, $2, $3, $4, $5, $6)
    on conflict (type, source_id, version) 
    do update set 
      title = excluded.title,
      description = excluded.description,
      updated_at = now()
    returning id
  `,

  // Upsert content metadata
  upsertContentMetadata: `
    insert into content_metadata (item_id, facets)
    values ($1, $2)
    on conflict (item_id)
    do update set facets = excluded.facets
  `,

  // Batch insert content chunks
  insertContentChunks: `
    insert into content_chunk (item_id, field, chunk_index, text, embedding)
    values ($1, $2, $3, $4, $5)
  `,

  // Upsert content item vector
  upsertContentItemVector: `
    insert into content_item_vector (item_id, method, embedding)
    values ($1, $2, $3)
    on conflict (item_id)
    do update set 
      method = excluded.method,
      embedding = excluded.embedding
  `,

  // Coarse recall search
  coarseRecall: `
    with filtered as (
      select civ.item_id
      from content_item_vector civ
      join content_metadata md on md.item_id = civ.item_id
      join content_item ci on ci.id = civ.item_id
      where ($2::content_type is null or ci.type = $2::content_type)
        and md.facets @> $3::jsonb
    )
    select item_id, 1 - (embedding <#> $1::vector) as score
    from content_item_vector
    where item_id in (select item_id from filtered)
    order by embedding <#> $1::vector
    limit 50
  `,

  // Chunk refine with field weights
  chunkRefine: `
    select
      cc.id as chunk_id,
      cc.item_id,
      cc.field,
      (1 - (cc.embedding <#> $1::vector)) as vscore,
      cc.text
    from content_chunk cc
    where cc.item_id = any($2::uuid[])
  `,

  // BM25 search over materialized view
  bm25Search: `
    with q as (select plainto_tsquery('simple', $1) as q)
    select ci.id as item_id, ts_rank(ft.tsv, q.q) as bm25
    from content_item_ft ft
    join content_item ci on ci.id = ft.id, q
    where ci.id = any($2::uuid[])
  `,

  // Get content item details for search results
  getContentItemDetails: `
    select 
      ci.id,
      ci.type,
      ci.title,
      ci.description,
      md.facets
    from content_item ci
    left join content_metadata md on ci.id = md.item_id
    where ci.id = any($1::uuid[])
  `,
};


