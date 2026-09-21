create table if not exists public.music_catalog (
  id text primary key,
  title text not null,
  artist text not null,
  year integer,
  source_page_url text not null,
  source_audio_url text not null unique,
  attribution text not null,
  r2_key text not null unique,
  sha256 text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists music_catalog_search_idx on public.music_catalog using gin (to_tsvector('simple', title || ' ' || artist));
alter table public.music_catalog enable row level security;
