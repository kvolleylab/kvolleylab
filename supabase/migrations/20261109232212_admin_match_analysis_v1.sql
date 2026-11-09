create table if not exists kvl_admin_private.match_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competition_key text not null check (
    char_length(competition_key) between 1 and 120
    and competition_key = btrim(competition_key)
    and competition_key ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$'
  ),
  match_id text not null check (
    char_length(match_id) between 1 and 160
    and match_id = btrim(match_id)
    and match_id ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$'
  ),
  season text not null default '' check (
    char_length(season) <= 40 and season = btrim(season) and season !~ '[[:cntrl:]]'
  ),
  analysis_type text not null default 'pre_match'
    check (analysis_type in ('pre_match','post_match')),
  match_date date,
  match_time text not null default '' check (char_length(match_time) <= 20),
  stage text not null default '' check (char_length(stage) <= 80),
  home_code text not null default '' check (char_length(home_code) <= 40),
  home_name text not null default '' check (char_length(home_name) <= 120),
  away_code text not null default '' check (char_length(away_code) <= 40),
  away_name text not null default '' check (char_length(away_name) <= 120),
  venue text not null default '' check (char_length(venue) <= 180),
  title text not null check (
    char_length(title) between 1 and 180 and title = btrim(title) and title !~ '[[:cntrl:]]'
  ),
  summary text not null check (
    char_length(summary) between 1 and 8000
    and btrim(summary, E' \n\r\t') <> ''
    and translate(summary, E'\n\r\t', '') !~ '[[:cntrl:]]'
  ),
  serve_receive text not null default '' check (char_length(serve_receive) <= 16000),
  attack_plan text not null default '' check (char_length(attack_plan) <= 16000),
  block_defense text not null default '' check (char_length(block_defense) <= 16000),
  rotation_matchups text not null default '' check (char_length(rotation_matchups) <= 16000),
  key_points text not null default '' check (char_length(key_points) <= 16000),
  result_review text not null default '' check (char_length(result_review) <= 16000),
  related_player_analysis_ids uuid[] not null default '{}'::uuid[],
  related_note_ids uuid[] not null default '{}'::uuid[],
  publication_status text not null default 'private'
    check (publication_status in ('private','member_candidate')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(user_id, competition_key, match_id, analysis_type)
);

create index if not exists match_analyses_user_updated_idx
  on kvl_admin_private.match_analyses(user_id, updated_at desc);

create index if not exists match_analyses_user_match_idx
  on kvl_admin_private.match_analyses(user_id, competition_key, match_id);

alter table kvl_admin_private.match_analyses enable row level security;

revoke all on table kvl_admin_private.match_analyses from public, anon, authenticated;
