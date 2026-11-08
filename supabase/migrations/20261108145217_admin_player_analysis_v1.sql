create table if not exists kvl_admin_private.player_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id text not null check (player_id ~ '^KVL-P-[0-9]{6}$'),
  season text not null default '' check (
    char_length(season) <= 40 and season = btrim(season) and season !~ '[[:cntrl:]]'
  ),
  title text not null check (
    char_length(title) between 1 and 160 and title = btrim(title) and title !~ '[[:cntrl:]]'
  ),
  summary text not null check (
    char_length(summary) between 1 and 6000
    and btrim(summary, E' \n\r\t') <> ''
    and translate(summary, E'\n\r\t', '') !~ '[[:cntrl:]]'
  ),
  strengths text not null default '' check (char_length(strengths) <= 12000),
  improvements text not null default '' check (char_length(improvements) <= 12000),
  tactical_notes text not null default '' check (char_length(tactical_notes) <= 12000),
  recent_changes text not null default '' check (char_length(recent_changes) <= 12000),
  related_note_ids uuid[] not null default '{}'::uuid[],
  publication_status text not null default 'private'
    check (publication_status in ('private','member_candidate')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists player_analyses_user_updated_idx
  on kvl_admin_private.player_analyses(user_id, updated_at desc);

create index if not exists player_analyses_user_player_idx
  on kvl_admin_private.player_analyses(user_id, player_id);

alter table kvl_admin_private.player_analyses enable row level security;

revoke all on table kvl_admin_private.player_analyses from public, anon, authenticated;
