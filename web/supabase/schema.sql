-- Skema Otsuka Chess (FSD bagian 6.1). Tabel `puzzles` dibuat oleh ../puzzles.sql.
-- Aman dijalankan ulang.

create table if not exists public.users (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  username              text not null,
  email                 text not null,
  division              text not null default '',
  password_hash         text not null,
  role                  text not null default 'member' check (role in ('member', 'admin')),
  is_active             boolean not null default true,
  must_change_password  boolean not null default false,
  puzzle_rating         int not null default 1200,
  failed_login_count    int not null default 0,
  last_failed_login_at  timestamptz,
  locked_until          timestamptz,
  created_at            timestamptz not null default now(),
  last_login_at         timestamptz
);
create unique index if not exists users_username_key on public.users (lower(username));
create unique index if not exists users_email_key on public.users (lower(email));

create table if not exists public.sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  user_agent  text,
  ip          text,
  created_at  timestamptz not null default now()
);
create index if not exists sessions_user_idx on public.sessions (user_id);

create table if not exists public.lessons (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  chapter       int not null,
  position      int not null,
  title         text not null,
  summary       text not null default '',
  content_md    text not null default '',
  exercises     jsonb not null default '[]',
  is_published  boolean not null default false,
  updated_at    timestamptz not null default now()
);

create table if not exists public.openings (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  eco           text not null,
  side          text not null check (side in ('white', 'black')),
  level         text not null check (level in ('pemula', 'menengah')),
  first_move    text not null,
  pgn           text not null,
  move_notes    jsonb not null default '{}',
  ideas_md      text not null default '',
  parent_id     uuid references public.openings (id) on delete set null,
  is_published  boolean not null default false
);

-- Katalog lengkap: opening Lichess masuk tanpa penjelasan (is_curated = false).
alter table public.openings add column if not exists final_fen text not null default '';
alter table public.openings add column if not exists family text not null default '';
alter table public.openings add column if not exists is_curated boolean not null default false;
create index if not exists openings_family_idx on public.openings (family);
create index if not exists openings_list_idx on public.openings (is_curated desc, name);

create table if not exists public.daily_puzzles (
  date       date primary key,
  puzzle_id  uuid not null references public.puzzles (id) on delete cascade
);

create table if not exists public.lesson_progress (
  user_id       uuid not null references public.users (id) on delete cascade,
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  completed_at  timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.opening_progress (
  user_id            uuid not null references public.users (id) on delete cascade,
  opening_id         uuid not null references public.openings (id) on delete cascade,
  attempts           int not null default 0,
  best_streak        int not null default 0,
  last_practiced_at  timestamptz not null default now(),
  primary key (user_id, opening_id)
);

create table if not exists public.puzzle_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  puzzle_id      uuid not null references public.puzzles (id) on delete cascade,
  solved         boolean not null,
  used_hint      boolean not null default false,
  time_ms        int not null default 0,
  rating_before  int not null,
  rating_after   int not null,
  created_at     timestamptz not null default now(),
  unique (user_id, puzzle_id)   -- satu baris per percobaan pertama
);

create table if not exists public.activities (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  category        text not null check (category in ('turnamen', 'latihan', 'gathering', 'lainnya')),
  held_on         date not null,
  location        text not null default '',
  description_md  text not null default '',
  cover_path      text not null default '',
  photo_paths     text[] not null default '{}',
  standings       jsonb,
  pgn             text,
  is_published    boolean not null default false
);

-- Master isi beranda, dikelola di /admin/beranda.
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.landing_items (
  id            uuid primary key default gen_random_uuid(),
  section       text not null check (section in ('kegiatan', 'belajar', 'faq')),
  title         text not null,
  body          text not null default '',
  href          text,
  position      int not null default 1,
  is_published  boolean not null default true
);
create index if not exists landing_items_section_idx on public.landing_items (section, position);

alter table public.site_settings enable row level security;
alter table public.landing_items enable row level security;

-- Kegiatan dan Artikel: konten bergaya artikel, dikelola di /admin/kegiatan dan /admin/artikel.
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('kegiatan', 'artikel')),
  slug          text not null,
  title         text not null,
  excerpt       text not null default '',
  body_md       text not null default '',
  cover_path    text not null default '',
  published_on  date not null default current_date,
  is_published  boolean not null default false,
  updated_at    timestamptz not null default now(),
  unique (type, slug)
);
create index if not exists posts_list_idx on public.posts (type, published_on desc);

-- Foto hasil upload admin. Sudah dikecilkan di browser, disajikan lewat /media/[id].
create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  mime        text not null check (mime in ('image/webp', 'image/jpeg', 'image/png')),
  bytes       bytea not null,
  size        int not null,
  created_by  uuid references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.media enable row level security;

-- Main online: tantangan, permainan, dan rating bermain (terpisah dari rating puzzle).
alter table public.users add column if not exists play_rating int not null default 1200;

create table if not exists public.challenges (
  id                 uuid primary key default gen_random_uuid(),
  from_id            uuid not null references public.users (id) on delete cascade,
  to_id              uuid not null references public.users (id) on delete cascade,
  initial_ms         int not null,
  increment_ms       int not null,
  status             text not null default 'pending'
                     check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  game_id            uuid,
  created_at         timestamptz not null default now(),
  responded_at       timestamptz
);
create index if not exists challenges_to_idx on public.challenges (to_id, status);
create index if not exists challenges_from_idx on public.challenges (from_id, status);

create table if not exists public.games (
  id                   uuid primary key default gen_random_uuid(),
  white_id             uuid not null references public.users (id) on delete cascade,
  black_id             uuid not null references public.users (id) on delete cascade,
  initial_ms           int not null,
  increment_ms         int not null,
  moves                text not null default '',   -- UCI dipisah spasi
  white_ms             int not null,
  black_ms             int not null,
  turn_started_at      timestamptz,                 -- null sampai Hitam melangkah pertama
  status               text not null default 'active' check (status in ('active', 'finished', 'aborted')),
  result               text check (result in ('1-0', '0-1', '1/2-1/2')),
  termination          text,
  draw_offer           text check (draw_offer in ('w', 'b')),
  white_rating_before  int,
  black_rating_before  int,
  white_rating_after   int,
  black_rating_after   int,
  last_activity_at     timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  ended_at             timestamptz
);
create index if not exists games_white_idx on public.games (white_id, status);
create index if not exists games_black_idx on public.games (black_id, status);

alter table public.challenges enable row level security;
alter table public.games enable row level security;

-- FSD 6.2: RLS aktif tanpa policy. Akses anon/authenticated lewat REST selalu ditolak.
alter table public.users            enable row level security;
alter table public.sessions         enable row level security;
alter table public.lessons          enable row level security;
alter table public.openings         enable row level security;
alter table public.daily_puzzles    enable row level security;
alter table public.lesson_progress  enable row level security;
alter table public.opening_progress enable row level security;
alter table public.puzzle_attempts  enable row level security;
alter table public.activities       enable row level security;
