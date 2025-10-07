-- Function to refresh the materialized view
create or replace function refresh_content_item_ft() returns void language sql as $$
  refresh materialized view concurrently content_item_ft;
$$;


