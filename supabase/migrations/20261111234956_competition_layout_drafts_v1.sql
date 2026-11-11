-- KVL competition layout drafts v1: OWNER APPROVED 2026-11-12 KST; additive-only private schema.
-- Applied using the Supabase project migration service; no changes to existing player notes / live scores.
-- Reuses existing private schema and existing admin account check in Edge Function.
create table if not exists kvl_admin_private.competition_layout_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('all','family','competition')),
  scope_key text not null check (
    (scope='all' and scope_key='all') or
    (scope='family' and scope_key in ('domestic','international','pro')) or
    (scope='competition' and length(scope_key) <= 100
      and scope_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
  ),
  tokens jsonb not null default '{}'::jsonb check (
    jsonb_typeof(tokens) = 'object' and pg_column_size(tokens) <= 8192
  ),
  revision integer not null default 1 check (revision >= 1),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (user_id, scope, scope_key)
);

create table if not exists kvl_admin_private.competition_layout_draft_revisions (
  id uuid primary key default gen_random_uuid(),
  layout_id uuid not null references kvl_admin_private.competition_layout_drafts(id) on delete cascade,
  editor_user_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision >= 1),
  tokens jsonb not null check (jsonb_typeof(tokens)='object' and pg_column_size(tokens) <= 8192),
  action text not null check (action in ('save','restore')),
  created_at timestamptz not null default clock_timestamp(),
  unique (layout_id, revision)
);

create index if not exists kvl_comp_layout_updated_idx
  on kvl_admin_private.competition_layout_drafts (user_id, updated_at desc);
create index if not exists kvl_comp_layout_history_idx
  on kvl_admin_private.competition_layout_draft_revisions (layout_id, revision desc);

alter table kvl_admin_private.competition_layout_drafts enable row level security;
alter table kvl_admin_private.competition_layout_draft_revisions enable row level security;
revoke all on kvl_admin_private.competition_layout_drafts from public, anon, authenticated;
revoke all on kvl_admin_private.competition_layout_draft_revisions from public, anon, authenticated;
-- API access only through authenticated Edge Function, which must validate
-- auth.getUser(token) plus kvl_admin_private.admin_accounts.active=true.
-- No function/role/table here publishes content to GitHub or a public schema.

comment on table kvl_admin_private.competition_layout_drafts is 'KVL administrator-only visual layout drafts; never live match, roster, standings, or published assets.';
comment on table kvl_admin_private.competition_layout_draft_revisions is 'Append-only revisions of administrator visual layout draft settings.';
