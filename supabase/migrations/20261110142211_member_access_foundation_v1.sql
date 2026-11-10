create schema if not exists kvl_members_private;

create table if not exists kvl_members_private.member_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  status text not null default 'active' check (status in ('pending','active','suspended')),
  nickname text not null default '' check (char_length(nickname) <= 60),
  real_name_public boolean not null default false,
  identity_verified boolean not null default false,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

alter table kvl_members_private.member_accounts enable row level security;
revoke all on schema kvl_members_private from public, anon, authenticated;
revoke all on table kvl_members_private.member_accounts from public, anon, authenticated;
