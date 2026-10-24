-- Member-owned records only. Public player identities stay in the existing MASTER.
begin;
create schema if not exists kvl_private;
revoke all on schema kvl_private from public, anon, authenticated;
grant usage on schema kvl_private to authenticated;

-- A foreign-key allowlist of existing IDs, without copied names or player data.
create table kvl_private.player_ids (
  player_id text primary key,
  source_commit text not null,
  check (length(player_id) between 4 and 100)
);
revoke all on kvl_private.player_ids from public, anon, authenticated;

-- Auth signs/validates the JWT. Also reject JWTs whose session was logged out.
create function kvl_private.active_session() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and coalesce((auth.jwt()->>'exp')::numeric,0) > extract(epoch from now())
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from auth.sessions s
      join auth.users u on u.id = s.user_id
      where s.id::text = auth.jwt()->>'session_id'
        and s.user_id = auth.uid()
        and u.email_confirmed_at is not null
        and (s.not_after is null or s.not_after > now())
    );
$$;
revoke all on function kvl_private.active_session() from public, anon;
grant execute on function kvl_private.active_session() to authenticated;

create function public.kvl_member_session_active() returns boolean
language sql stable security invoker set search_path = '' as $$
  select kvl_private.active_session();
$$;
revoke all on function public.kvl_member_session_active() from public, anon;
grant execute on function public.kvl_member_session_active() to authenticated;

create table public.kvl_player_bookmarks (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id text not null references kvl_private.player_ids(player_id),
  created_at timestamptz not null default now(),
  primary key (user_id, player_id)
);
create table public.kvl_player_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id text not null references kvl_private.player_ids(player_id),
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(btrim(body)) between 1 and 6000),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index kvl_notes_owner_player_time on public.kvl_player_notes (user_id, player_id, updated_at desc);

create function kvl_private.note_revision() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.revision <> old.revision + 1 then
    raise exception 'Note revision conflict' using errcode = '40001';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function kvl_private.note_revision() from public, anon, authenticated;
create trigger kvl_note_revision before update on public.kvl_player_notes
for each row execute function kvl_private.note_revision();

alter table public.kvl_player_bookmarks enable row level security;
alter table public.kvl_player_bookmarks force row level security;
alter table public.kvl_player_notes enable row level security;
alter table public.kvl_player_notes force row level security;
revoke all on public.kvl_player_bookmarks from public, anon, authenticated;
revoke all on public.kvl_player_notes from public, anon, authenticated;
grant select, delete on public.kvl_player_bookmarks to authenticated;
grant insert (player_id) on public.kvl_player_bookmarks to authenticated;
grant select, delete on public.kvl_player_notes to authenticated;
grant insert (player_id, title, body) on public.kvl_player_notes to authenticated;
grant update (title, body, revision) on public.kvl_player_notes to authenticated;

create policy kvl_bookmarks_owner on public.kvl_player_bookmarks
for all to authenticated
using (user_id = (select auth.uid()) and (select kvl_private.active_session()))
with check (user_id = (select auth.uid()) and (select kvl_private.active_session()));
create policy kvl_notes_owner on public.kvl_player_notes
for all to authenticated
using (user_id = (select auth.uid()) and (select kvl_private.active_session()))
with check (user_id = (select auth.uid()) and (select kvl_private.active_session()));
commit;
