-- Tabel puzzle untuk Otsuka Chess (sesuai FSD bagian 6.1)
-- Jalankan sekali di Supabase: Dashboard > SQL Editor > New query > Run

create table if not exists public.puzzles (
  id           uuid primary key default gen_random_uuid(),
  fen          text    not null,
  moves        text    not null,          -- langkah UCI dipisah spasi; langkah pertama = langkah lawan
  rating       int     not null,
  themes       text[]  not null default '{}',
  source       text    not null default 'klub' check (source in ('lichess', 'klub')),
  source_id    text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists puzzles_rating_idx on public.puzzles (rating) where is_published;
create index if not exists puzzles_themes_idx on public.puzzles using gin (themes);

-- Semua akses lewat server Next.js (service role); akses langsung anon ditolak
alter table public.puzzles enable row level security;

-- Tabel sementara untuk impor CSV. Setelah impor, data dipindah ke `puzzles`
-- dan puzzle yang sudah ada (source_id sama) dilewati.
create table if not exists public.puzzles_import (
  fen text, moves text, rating int, themes text[],
  source text, source_id text, is_published boolean
);
alter table public.puzzles_import enable row level security;

-- ===== Jalankan bagian di bawah SETELAH CSV diimpor ke puzzles_import =====
-- insert into public.puzzles (fen, moves, rating, themes, source, source_id, is_published)
-- select fen, moves, rating, themes, source, source_id, is_published
-- from public.puzzles_import
-- on conflict (source, source_id) do nothing;
--
-- truncate public.puzzles_import;
--
-- Cek hasil:
-- select (rating / 200) * 200 as rentang, count(*) from public.puzzles group by 1 order by 1;
-- select pg_size_pretty(pg_total_relation_size('public.puzzles'));
