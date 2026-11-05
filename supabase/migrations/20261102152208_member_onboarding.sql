-- Membership onboarding only. No player MASTER or old kvl_private objects are changed.
-- Apply through an authorized migration owner, never through a browser/service key.
-- Hosted Auth/PortOne verification is a separate release gate.
begin;

create schema kvl_members_private;
revoke all on schema kvl_members_private from public, anon, authenticated, service_role;

-- RPCs run with narrowly granted privileges and RLS, rather than a bypass-RLS owner.
create role kvl_members_api nologin noinherit nosuperuser nobypassrls;
create role kvl_members_public_api nologin noinherit nosuperuser nobypassrls;
create role kvl_members_identity_api nologin noinherit nosuperuser nobypassrls;
grant kvl_members_api, kvl_members_public_api, kvl_members_identity_api to postgres;
grant usage on schema kvl_members_private to kvl_members_api;
grant usage on schema kvl_members_private to kvl_members_public_api, kvl_members_identity_api;
grant create on schema kvl_members_private to kvl_members_api, kvl_members_public_api, kvl_members_identity_api;
-- USAGE lets the public invoker wrappers call only explicitly granted entry points.
-- It grants no table access, and this schema must stay outside PostgREST's exposed list.
grant usage on schema kvl_members_private to anon, authenticated, service_role;

-- Hosted postgres cannot delegate USAGE on the Auth-managed schema. Read the
-- gateway-validated request settings without granting custom roles Auth access.
create function kvl_members_private.request_claims()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;
alter function kvl_members_private.request_claims() owner to kvl_members_api;
create function kvl_members_private.request_user_id()
returns uuid language sql stable security invoker set search_path = '' as $$
  select (kvl_members_private.request_claims()->>'sub')::uuid;
$$;
alter function kvl_members_private.request_user_id() owner to kvl_members_api;

-- The one narrow Auth lookup stays postgres-owned in this private schema. It
-- returns only a boolean and is executable only by the internal API roles.
-- https://supabase.com/kb/troubleshooting/permission-errors-when-granting-custom-roles-access-to-the-auth-schema
create function kvl_members_private.user_session_valid(p_user_id uuid, p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and p_session_id is not null and exists (
    select 1 from auth.sessions s join auth.users u on u.id = s.user_id
    where s.id = p_session_id and s.user_id = p_user_id
      and (s.not_after is null or s.not_after > now())
      and u.is_anonymous is false and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= now())
      and (
        u.email_confirmed_at is not null
        or exists (select 1 from auth.identities i where i.user_id = u.id and i.provider in ('google', 'kakao'))
      )
  );
$$;
alter function kvl_members_private.user_session_valid(uuid, uuid) owner to postgres;

create function kvl_members_private.active_session()
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare claims jsonb; uid uuid; sid uuid;
begin
  claims := kvl_members_private.request_claims();
  uid := kvl_members_private.request_user_id();
  sid := (claims->>'session_id')::uuid;
  return coalesce(
    uid is not null and claims->>'role' = 'authenticated'
    and coalesce((claims->>'is_anonymous')::boolean, false) = false
    and (claims->>'exp')::numeric > extract(epoch from now())
    and kvl_members_private.user_session_valid(uid, sid), false);
exception when invalid_text_representation or numeric_value_out_of_range then
  return false;
end;
$$;
alter function kvl_members_private.active_session() owner to kvl_members_api;

create table kvl_members_private.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 40 and nickname = btrim(nickname) and nickname !~ '[[:cntrl:]]'),
  real_name text not null default '' check (char_length(real_name) <= 80 and real_name = btrim(real_name) and real_name !~ '[[:cntrl:]]'),
  publish_real_name boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not publish_real_name or char_length(real_name) > 0)
);

create table kvl_members_private.member_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  verified_name text not null check (char_length(verified_name) between 1 and 80 and verified_name = btrim(verified_name) and verified_name !~ '[[:cntrl:]]'),
  provider text not null check (provider = 'portone'),
  verification_id text not null unique check (verification_id ~ '^[a-zA-Z0-9]{32}$'),
  verified_at timestamptz not null,
  confirmed_at timestamptz not null default now()
);

create table kvl_members_private.member_admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  granted_at timestamptz not null default now()
);

create table kvl_members_private.admin_read_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  action text not null default 'member.profile.read' check (action = 'member.profile.read'),
  read_at timestamptz not null default now()
);

create table kvl_members_private.identity_requests (
  verification_id text primary key check (verification_id ~ '^[a-zA-Z0-9]{32}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  customer_id text not null unique check (customer_id ~ '^[a-zA-Z0-9]{32}$'),
  store_id text not null check (char_length(store_id) between 1 and 100),
  channel_key text not null check (char_length(channel_key) between 1 and 200),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  state text not null default 'pending' check (state in ('pending', 'cancelled', 'consumed')),
  consumed_at timestamptz,
  check (expires_at > created_at),
  check ((state = 'consumed') = (consumed_at is not null))
);
create index kvl_identity_requests_user on kvl_members_private.identity_requests(user_id, created_at desc);
create unique index kvl_identity_one_pending_per_user on kvl_members_private.identity_requests(user_id) where state = 'pending';

create function kvl_members_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select kvl_members_private.active_session() and exists (
    select 1 from kvl_members_private.member_admin_roles r where r.user_id = kvl_members_private.request_user_id() and r.enabled
  );
$$;
alter function kvl_members_private.is_admin() owner to kvl_members_api;

alter table kvl_members_private.member_profiles enable row level security;
alter table kvl_members_private.member_profiles force row level security;
alter table kvl_members_private.member_identities enable row level security;
alter table kvl_members_private.member_identities force row level security;
alter table kvl_members_private.member_admin_roles enable row level security;
alter table kvl_members_private.member_admin_roles force row level security;
alter table kvl_members_private.admin_read_audit enable row level security;
alter table kvl_members_private.admin_read_audit force row level security;
alter table kvl_members_private.identity_requests enable row level security;
alter table kvl_members_private.identity_requests force row level security;

revoke all on all tables in schema kvl_members_private from public, anon, authenticated, service_role;
grant select on kvl_members_private.member_profiles, kvl_members_private.member_identities, kvl_members_private.member_admin_roles to kvl_members_api;
grant insert (user_id, nickname, real_name, publish_real_name) on kvl_members_private.member_profiles to kvl_members_api;
grant update (nickname, real_name, publish_real_name) on kvl_members_private.member_profiles to kvl_members_api;
grant insert (actor_id, subject_id) on kvl_members_private.admin_read_audit to kvl_members_api;
grant select (user_id, nickname, real_name, publish_real_name) on kvl_members_private.member_profiles to kvl_members_public_api;
grant select (user_id) on kvl_members_private.member_identities to kvl_members_public_api;
grant select on kvl_members_private.member_profiles, kvl_members_private.member_identities,
  kvl_members_private.identity_requests to kvl_members_identity_api;
grant update (real_name, publish_real_name) on kvl_members_private.member_profiles to kvl_members_identity_api;
grant insert (user_id, verified_name, provider, verification_id, verified_at)
  on kvl_members_private.member_identities to kvl_members_identity_api;
grant insert (verification_id, user_id, session_id, customer_id, store_id, channel_key)
  on kvl_members_private.identity_requests to kvl_members_identity_api;
grant update (state, consumed_at) on kvl_members_private.identity_requests to kvl_members_identity_api;

create policy kvl_profile_read on kvl_members_private.member_profiles for select to kvl_members_api
  using (kvl_members_private.active_session() and (user_id = kvl_members_private.request_user_id() or kvl_members_private.is_admin()));
create policy kvl_profile_insert on kvl_members_private.member_profiles for insert to kvl_members_api
  with check (user_id = kvl_members_private.request_user_id() and kvl_members_private.active_session());
create policy kvl_profile_update on kvl_members_private.member_profiles for update to kvl_members_api
  using (user_id = kvl_members_private.request_user_id() and kvl_members_private.active_session())
  with check (user_id = kvl_members_private.request_user_id() and kvl_members_private.active_session());
create policy kvl_identity_read on kvl_members_private.member_identities for select to kvl_members_api
  using (kvl_members_private.active_session() and (user_id = kvl_members_private.request_user_id() or kvl_members_private.is_admin()));
create policy kvl_admin_role_self on kvl_members_private.member_admin_roles for select to kvl_members_api
  using (user_id = kvl_members_private.request_user_id() and kvl_members_private.active_session());
create policy kvl_admin_audit_insert on kvl_members_private.admin_read_audit for insert to kvl_members_api
  with check (actor_id = kvl_members_private.request_user_id() and kvl_members_private.is_admin());
create policy kvl_projection_profiles on kvl_members_private.member_profiles for select to kvl_members_public_api using (true);
create policy kvl_projection_verified_flag on kvl_members_private.member_identities for select to kvl_members_public_api using (true);
-- This NOLOGIN role is reachable only through service-role-only entry points.
create policy kvl_server_profiles_read on kvl_members_private.member_profiles for select to kvl_members_identity_api using (true);
create policy kvl_server_profiles_update on kvl_members_private.member_profiles for update to kvl_members_identity_api using (true) with check (true);
create policy kvl_server_identities_read on kvl_members_private.member_identities for select to kvl_members_identity_api using (true);
create policy kvl_server_identities_insert on kvl_members_private.member_identities for insert to kvl_members_identity_api with check (true);
create policy kvl_server_requests_read on kvl_members_private.identity_requests for select to kvl_members_identity_api using (true);
create policy kvl_server_requests_insert on kvl_members_private.identity_requests for insert to kvl_members_identity_api with check (true);
create policy kvl_server_requests_update on kvl_members_private.identity_requests for update to kvl_members_identity_api using (true) with check (true);

create function kvl_members_private.guard_profile()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare verified text;
begin
  if tg_op = 'UPDATE' and new.user_id <> old.user_id then
    raise exception 'Member ownership is immutable' using errcode = '42501';
  end if;
  select verified_name into verified from kvl_members_private.member_identities where user_id = new.user_id;
  if verified is not null and new.real_name is distinct from verified then
    raise exception 'Verified name cannot be edited' using errcode = '22023';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger kvl_profile_guard before insert or update on kvl_members_private.member_profiles
for each row execute function kvl_members_private.guard_profile();

create function kvl_members_private.guard_verified_identity()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception 'Verified identity is immutable; use an audited operator recovery procedure' using errcode = '42501';
end;
$$;
create trigger kvl_verified_identity_immutable before update on kvl_members_private.member_identities
for each row execute function kvl_members_private.guard_verified_identity();

create function kvl_members_private.member_json(p_user_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'user_id', p_user_id, 'nickname', coalesce(p.nickname, ''), 'real_name', coalesce(i.verified_name, p.real_name, ''),
    'publish_real_name', coalesce(p.publish_real_name, false), 'identity_verified', i.user_id is not null,
    'public_author_name', case when p.publish_real_name then p.real_name else coalesce(p.nickname, '') end,
    'name_source', case when p.publish_real_name and i.user_id is not null then 'verified'
                        when p.publish_real_name then 'self_entered' else 'nickname' end,
    'benefits_active', false, 'onboarding_ready', p.user_id is not null and i.user_id is not null
  ) from (select p_user_id as id) requested
    left join kvl_members_private.member_profiles p on p.user_id = requested.id
    left join kvl_members_private.member_identities i on i.user_id = requested.id;
$$;
alter function kvl_members_private.member_json(uuid) owner to kvl_members_api;

create function kvl_members_private.kvl_onboarding_session_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select kvl_members_private.active_session();
$$;
alter function kvl_members_private.kvl_onboarding_session_active() owner to kvl_members_api;

create function kvl_members_private.kvl_member_get_self()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not kvl_members_private.active_session() then raise exception 'Active authenticated session required' using errcode = '42501'; end if;
  return kvl_members_private.member_json(kvl_members_private.request_user_id());
end;
$$;
alter function kvl_members_private.kvl_member_get_self() owner to kvl_members_api;

create function kvl_members_private.kvl_member_save_profile(p_nickname text, p_real_name text, p_publish_real_name boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid := kvl_members_private.request_user_id(); nick text := btrim(p_nickname); real text := btrim(coalesce(p_real_name, ''));
begin
  if not kvl_members_private.active_session() then raise exception 'Active authenticated session required' using errcode = '42501'; end if;
  -- Same per-user lock as identity begin/consume, including before a profile exists.
  perform pg_advisory_xact_lock(hashtextextended('kvl-members-identity:' || uid::text, 0));
  if not kvl_members_private.active_session() then raise exception 'Active authenticated session required' using errcode = '42501'; end if;
  if nick is null or char_length(nick) not between 2 and 40 or nick ~ '[[:cntrl:]]'
    or char_length(real) > 80 or real ~ '[[:cntrl:]]' or p_publish_real_name is null
    or (p_publish_real_name and real = '') then raise exception 'Invalid member profile' using errcode = '22023'; end if;
  insert into kvl_members_private.member_profiles(user_id, nickname, real_name, publish_real_name)
    values (uid, nick, real, p_publish_real_name)
    on conflict (user_id) do update set nickname = excluded.nickname, real_name = excluded.real_name,
      publish_real_name = excluded.publish_real_name;
  return kvl_members_private.member_json(uid);
end;
$$;
alter function kvl_members_private.kvl_member_save_profile(text, text, boolean) owner to kvl_members_api;

create function kvl_members_private.kvl_member_is_ready()
returns boolean language sql stable security definer set search_path = '' as $$
  select kvl_members_private.active_session()
    and exists (select 1 from kvl_members_private.member_profiles p where p.user_id = kvl_members_private.request_user_id())
    and exists (select 1 from kvl_members_private.member_identities i where i.user_id = kvl_members_private.request_user_id());
$$;
alter function kvl_members_private.kvl_member_is_ready() owner to kvl_members_api;

create function kvl_members_private.kvl_admin_get_member(p_user_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  if not kvl_members_private.is_admin() then raise exception 'Server-assigned administrator role required' using errcode = '42501'; end if;
  if not exists (select 1 from kvl_members_private.member_profiles where user_id = p_user_id) then return null; end if;
  insert into kvl_members_private.admin_read_audit(actor_id, subject_id) values (kvl_members_private.request_user_id(), p_user_id);
  return kvl_members_private.member_json(p_user_id);
end;
$$;
alter function kvl_members_private.kvl_admin_get_member(uuid) owner to kvl_members_api;

-- This is the preview author projection contract, not a final production disclosure policy.
create function kvl_members_private.kvl_member_public_author(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'author_id', p.user_id,
    'public_author_name', case when p.publish_real_name then p.real_name else p.nickname end,
    'name_source', case when p.publish_real_name and exists (
      select 1 from kvl_members_private.member_identities i where i.user_id = p.user_id
    ) then 'verified' when p.publish_real_name then 'self_entered' else 'nickname' end
  ) from kvl_members_private.member_profiles p where p.user_id = p_user_id;
$$;
alter function kvl_members_private.kvl_member_public_author(uuid) owner to kvl_members_public_api;

-- Service-only RPCs: caller identity/session were verified using the member bearer token.
-- They independently recheck the persisted session to close logout/revocation races.
create function kvl_members_private.kvl_identity_begin(p_user_id uuid, p_session_id uuid, p_verification_id text,
  p_customer_id text, p_store_id text, p_channel_key text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare request kvl_members_private.identity_requests;
begin
  if not kvl_members_private.user_session_valid(p_user_id, p_session_id) then raise exception 'Active session required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('kvl-members-identity:' || p_user_id::text, 0));
  perform 1 from kvl_members_private.member_profiles where user_id = p_user_id for update;
  if not kvl_members_private.user_session_valid(p_user_id, p_session_id) then raise exception 'Active session required' using errcode = '42501'; end if;
  if exists (select 1 from kvl_members_private.member_identities where user_id = p_user_id) then raise exception 'Identity already verified' using errcode = '22023'; end if;
  update kvl_members_private.identity_requests set state = 'cancelled' where user_id = p_user_id and state = 'pending';
  insert into kvl_members_private.identity_requests(verification_id, user_id, session_id, customer_id, store_id, channel_key)
    values (p_verification_id, p_user_id, p_session_id, p_customer_id, p_store_id, p_channel_key) returning * into request;
  return jsonb_build_object('identityVerificationId', request.verification_id, 'customerId', request.customer_id,
    'storeId', request.store_id, 'channelKey', request.channel_key, 'createdAt', request.created_at, 'expiresAt', request.expires_at);
end;
$$;

create function kvl_members_private.kvl_identity_get_request(p_user_id uuid, p_session_id uuid, p_verification_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare request kvl_members_private.identity_requests;
begin
  if not kvl_members_private.user_session_valid(p_user_id, p_session_id) then raise exception 'Active session required' using errcode = '42501'; end if;
  select * into request from kvl_members_private.identity_requests where verification_id = p_verification_id
    and user_id = p_user_id and session_id = p_session_id and state = 'pending' and expires_at > now();
  if not found then raise exception 'Pending identity request not found' using errcode = '42501'; end if;
  return jsonb_build_object('identityVerificationId', request.verification_id, 'customerId', request.customer_id,
    'storeId', request.store_id, 'channelKey', request.channel_key, 'createdAt', request.created_at, 'expiresAt', request.expires_at);
end;
$$;

create function kvl_members_private.kvl_identity_consume(p_user_id uuid, p_session_id uuid, p_verification_id text,
  p_customer_id text, p_store_id text, p_channel_key text, p_verified_name text, p_verified_at timestamptz)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare request kvl_members_private.identity_requests; verified text := btrim(p_verified_name);
begin
  if not kvl_members_private.user_session_valid(p_user_id, p_session_id) then raise exception 'Active session required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended('kvl-members-identity:' || p_user_id::text, 0));
  perform 1 from kvl_members_private.member_profiles where user_id = p_user_id for update;
  if not kvl_members_private.user_session_valid(p_user_id, p_session_id) then raise exception 'Active session required' using errcode = '42501'; end if;
  select * into request from kvl_members_private.identity_requests where verification_id = p_verification_id
    and user_id = p_user_id and session_id = p_session_id and state = 'pending' and expires_at > now() for update;
  if not found then raise exception 'Pending identity request not found or already consumed' using errcode = '42501'; end if;
  if request.customer_id is distinct from p_customer_id or request.store_id is distinct from p_store_id
    or request.channel_key is distinct from p_channel_key or verified is null
    or char_length(verified) not between 1 and 80 or verified ~ '[[:cntrl:]]'
    or p_verified_at is null or p_verified_at < request.created_at - interval '5 seconds'
    or p_verified_at > now() + interval '30 seconds' or p_verified_at > request.expires_at then
    raise exception 'Identity verification binding mismatch' using errcode = '22023';
  end if;
  insert into kvl_members_private.member_identities(user_id, verified_name, provider, verification_id, verified_at)
    values (p_user_id, verified, 'portone', p_verification_id, p_verified_at);
  -- A newly returned, different name must not become public on a prior name's consent.
  update kvl_members_private.member_profiles set
    publish_real_name = publish_real_name and real_name = verified, real_name = verified where user_id = p_user_id;
  update kvl_members_private.identity_requests set state = 'consumed', consumed_at = now() where verification_id = request.verification_id;
  return jsonb_build_object('identity_verified', true);
end;
$$;

alter function kvl_members_private.kvl_identity_begin(uuid,uuid,text,text,text,text) owner to kvl_members_identity_api;
alter function kvl_members_private.kvl_identity_get_request(uuid,uuid,text) owner to kvl_members_identity_api;
alter function kvl_members_private.kvl_identity_consume(uuid,uuid,text,text,text,text,text,timestamptz) owner to kvl_members_identity_api;

-- No SECURITY DEFINER function is placed in an exposed schema.
create function public.kvl_onboarding_session_active()
returns boolean language sql stable security invoker set search_path = '' as $$
  select kvl_members_private.kvl_onboarding_session_active();
$$;
create function public.kvl_member_get_self()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select kvl_members_private.kvl_member_get_self();
$$;
create function public.kvl_member_save_profile(p_nickname text, p_real_name text, p_publish_real_name boolean)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select kvl_members_private.kvl_member_save_profile(p_nickname,p_real_name,p_publish_real_name);
$$;
create function public.kvl_member_is_ready()
returns boolean language sql stable security invoker set search_path = '' as $$
  select kvl_members_private.kvl_member_is_ready();
$$;
create function public.kvl_admin_get_member(p_user_id uuid)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select kvl_members_private.kvl_admin_get_member(p_user_id);
$$;
create function public.kvl_member_public_author(p_user_id uuid)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select kvl_members_private.kvl_member_public_author(p_user_id);
$$;
create function public.kvl_identity_begin(p_user_id uuid, p_session_id uuid, p_verification_id text,
  p_customer_id text, p_store_id text, p_channel_key text)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select kvl_members_private.kvl_identity_begin(p_user_id,p_session_id,p_verification_id,p_customer_id,p_store_id,p_channel_key);
$$;
create function public.kvl_identity_get_request(p_user_id uuid, p_session_id uuid, p_verification_id text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select kvl_members_private.kvl_identity_get_request(p_user_id,p_session_id,p_verification_id);
$$;
create function public.kvl_identity_consume(p_user_id uuid, p_session_id uuid, p_verification_id text,
  p_customer_id text, p_store_id text, p_channel_key text, p_verified_name text, p_verified_at timestamptz)
returns jsonb language sql volatile security invoker set search_path = '' as $$
  select kvl_members_private.kvl_identity_consume(p_user_id,p_session_id,p_verification_id,
    p_customer_id,p_store_id,p_channel_key,p_verified_name,p_verified_at);
$$;

revoke all on all functions in schema kvl_members_private from public, anon, authenticated, service_role;
grant execute on function kvl_members_private.user_session_valid(uuid,uuid) to kvl_members_api, kvl_members_identity_api;
grant execute on function kvl_members_private.kvl_onboarding_session_active(), kvl_members_private.kvl_member_get_self(),
  kvl_members_private.kvl_member_save_profile(text,text,boolean), kvl_members_private.kvl_member_is_ready(),
  kvl_members_private.kvl_admin_get_member(uuid) to authenticated;
grant execute on function kvl_members_private.kvl_member_public_author(uuid) to anon, authenticated;
grant execute on function kvl_members_private.kvl_identity_begin(uuid,uuid,text,text,text,text),
  kvl_members_private.kvl_identity_get_request(uuid,uuid,text),
  kvl_members_private.kvl_identity_consume(uuid,uuid,text,text,text,text,text,timestamptz) to service_role;

revoke all on function public.kvl_identity_begin(uuid,uuid,text,text,text,text),
  public.kvl_identity_get_request(uuid,uuid,text),
  public.kvl_identity_consume(uuid,uuid,text,text,text,text,text,timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.kvl_identity_begin(uuid,uuid,text,text,text,text),
  public.kvl_identity_get_request(uuid,uuid,text),
  public.kvl_identity_consume(uuid,uuid,text,text,text,text,text,timestamptz) to service_role;

revoke all on function public.kvl_onboarding_session_active(), public.kvl_member_get_self(),
  public.kvl_member_save_profile(text,text,boolean), public.kvl_member_is_ready(),
  public.kvl_admin_get_member(uuid), public.kvl_member_public_author(uuid) from public, anon, authenticated, service_role;
grant execute on function public.kvl_onboarding_session_active(), public.kvl_member_get_self(),
  public.kvl_member_save_profile(text,text,boolean), public.kvl_member_is_ready(), public.kvl_admin_get_member(uuid) to authenticated;
grant execute on function public.kvl_member_public_author(uuid) to anon, authenticated;

revoke create on schema kvl_members_private from kvl_members_api, kvl_members_public_api, kvl_members_identity_api;
comment on schema kvl_members_private is 'Private membership records. Never add this schema to exposed API schemas; public RPCs whitelist returned fields.';
comment on table kvl_members_private.member_admin_roles is 'Only an authorized server/database operator may assign roles; user metadata is never an authority.';
commit;
