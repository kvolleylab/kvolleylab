import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../tools/member-onboarding/node_modules/@electric-sql/pglite/dist/index.js';

// Real PostgreSQL execution in PGlite; Auth rows/JWT claims are local fixtures.
// This is not evidence of hosted OAuth, email delivery, or actual PortOne verification.
const migration = new URL('../supabase/migrations/20261102152208_member_onboarding.sql', import.meta.url);
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';
const SA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SC = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const RID = 'a'.repeat(32), CID = 'b'.repeat(32);
const claims = (uid = A, sid = SA, extra = {}) => ({
  sub: uid, session_id: sid, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600,
  is_anonymous: false, ...extra,
});

test('member onboarding: database access and identity boundaries', async (t) => {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key, email_confirmed_at timestamptz, is_anonymous boolean not null default false,
      banned_until timestamptz, deleted_at timestamptz, raw_user_meta_data jsonb default '{}'
    );
    create table auth.sessions (id uuid primary key, user_id uuid references auth.users(id), not_after timestamptz);
    create table auth.identities (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), provider text not null);
    create function auth.jwt() returns jsonb language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
    $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create schema kvl_private;
    create table kvl_private.preexisting_sentinel (note text);
    insert into kvl_private.preexisting_sentinel values ('old member draft is untouched');
  `);
  await db.exec(await readFile(migration, 'utf8'));
  await db.query('insert into auth.users(id,email_confirmed_at) values ($1,now()),($2,now()),($3,null)', [A, B, C]);
  await db.query('insert into auth.sessions(id,user_id) values ($1,$2),($3,$4),($5,$6)', [SA, A, SB, B, SC, C]);

  const q = async (sql, params = []) => (await db.query(sql, params)).rows;
  const as = async (role, jwt, run) => {
    assert.ok(['anon', 'authenticated', 'service_role', 'kvl_members_api'].includes(role));
    await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify(jwt)]);
    await db.exec(`set role ${role}`);
    try { return await run(); } finally { await db.exec('reset role'); }
  };
  const member = (uid, sid, sql, params = [], extra = {}) => as('authenticated', claims(uid, sid, extra), () => q(sql, params));
  const service = (sql, params = []) => as('service_role', { role: 'service_role' }, () => q(sql, params));
  const save = (uid, sid, nick, name = '', publish = false) => member(uid, sid,
    'select public.kvl_member_save_profile($1,$2,$3) as value', [nick, name, publish]).then(r => r[0].value);
  const self = (uid, sid, extra = {}) => member(uid, sid, 'select public.kvl_member_get_self() as value', [], extra).then(r => r[0].value);
  const active = (uid, sid, extra = {}) => member(uid, sid, 'select public.kvl_onboarding_session_active() as value', [], extra).then(r => r[0].value);
  const deny = (promise, code = '42501') => assert.rejects(promise, e => e.code === code);
  const begin = (uid = A, sid = SA, rid = RID, cid = CID) => service(
    'select public.kvl_identity_begin($1,$2,$3,$4,$5,$6) as value', [uid, sid, rid, cid, 'store-test', 'channel-test']).then(r => r[0].value);
  const getRequest = (uid = A, sid = SA, rid = RID) => service(
    'select public.kvl_identity_get_request($1,$2,$3) as value', [uid, sid, rid]).then(r => r[0].value);
  const consume = (uid = A, sid = SA, rid = RID, cid = CID, name = '서버확인 이름', time = new Date().toISOString(), store = 'store-test', channel = 'channel-test') => service(
    'select public.kvl_identity_consume($1,$2,$3,$4,$5,$6,$7,$8) as value', [uid, sid, rid, cid, store, channel, name, time]).then(r => r[0].value);

  try {
    await t.test('private storage, safe definer roles, and explicit function grants', async () => {
      const roles = await q("select rolname,rolcanlogin,rolsuper,rolbypassrls from pg_roles where rolname like 'kvl_members_%'");
      assert.equal(roles.length, 3);
      assert.ok(roles.every(r => !r.rolcanlogin && !r.rolsuper && !r.rolbypassrls));
      assert.equal((await q("select has_schema_privilege('kvl_members_api','auth','usage') as value"))[0].value, false);
      await deny(as('kvl_members_api', claims(), () => q('select auth.uid()')));
      await deny(as('kvl_members_api', claims(), () => q('select id from auth.users')));
      assert.deepEqual(await q(`select r.rolname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        join pg_roles r on r.oid=p.proowner where n.nspname='kvl_members_private' and p.proname='user_session_valid'`),
        [{ rolname: 'postgres', prosecdef: true }]);
      const tables = await q("select relrowsecurity,relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='kvl_members_private' and relkind='r'");
      assert.equal(tables.length, 5);
      assert.ok(tables.every(r => r.relrowsecurity && r.relforcerowsecurity));
      assert.equal((await q("select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'kvl_%' and p.prosecdef"))[0].n, 0);
      assert.equal((await q(`select count(*)::int as n from pg_proc p join pg_namespace n on n.oid=p.pronamespace,
        lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
        where (n.nspname='kvl_members_private' or (n.nspname='public' and p.proname like 'kvl_%')) and acl.grantee=0`))[0].n, 0);
      for (const role of ['anon', 'authenticated', 'service_role']) {
        await deny(as(role, claims(), () => q('select * from kvl_members_private.member_profiles')));
        await deny(as(role, claims(), () => q('select * from kvl_members_private.member_identities')));
        await deny(as(role, claims(), () => q('select * from kvl_members_private.identity_requests')));
      }
      await deny(as('anon', {}, () => q('select public.kvl_member_get_self()')));
      await deny(member(A, SA, 'select kvl_members_private.member_json($1)', [B]));
      await deny(member(A, SA, 'select kvl_members_private.user_session_valid($1,$2)', [A, SA]));
      await deny(member(A, SA, 'select public.kvl_identity_begin($1,$2,$3,$4,$5,$6)', [A, SA, RID, CID, 'store', 'channel']));
    });

    await t.test('two members have separate profiles and cannot choose a different owner', async () => {
      const initial = await self(A, SA);
      assert.equal(initial.user_id, A);
      assert.equal(initial.publish_real_name, false);
      assert.equal(initial.identity_verified, false);
      assert.equal(initial.onboarding_ready, false);
      assert.equal(initial.benefits_active, false);
      await save(A, SA, '회원 하나', '첫 번째 이름');
      await save(B, SB, '회원 둘', '두 번째 이름');
      assert.equal((await self(A, SA)).real_name, '첫 번째 이름');
      assert.equal((await self(B, SB)).real_name, '두 번째 이름');
      await deny(member(A, SA, 'update kvl_members_private.member_profiles set real_name=$1 where user_id=$2', ['탈취', B]));
      await deny(member(A, SA, 'insert into kvl_members_private.member_profiles(user_id,nickname) values ($1,$2)', [C, '탈취']));
      await deny(member(A, SA, 'delete from kvl_members_private.member_profiles where user_id=$1', [B]));
      const visible = await as('kvl_members_api', claims(A, SA), () => q('select user_id from kvl_members_private.member_profiles'));
      assert.deepEqual(visible, [{ user_id: A }]);
      await as('kvl_members_api', claims(A, SA), () => q('update kvl_members_private.member_profiles set real_name=$1 where user_id=$2', ['RLS 탈취', B]));
      assert.equal((await self(B, SB)).real_name, '두 번째 이름');
    });

    await t.test('ownership stays immutable even if a future grant accidentally permits the column', async () => {
      await db.exec('grant update (user_id) on kvl_members_private.member_profiles to kvl_members_api');
      try {
        await deny(as('kvl_members_api', claims(A, SA), () => q('update kvl_members_private.member_profiles set user_id=$1 where user_id=$2', [C, A])));
      } finally { await db.exec('revoke update (user_id) on kvl_members_private.member_profiles from kvl_members_api'); }
    });

    await t.test('profile validation and disclosure are independent of identity and benefits', async () => {
      for (const [nick, name, publish] of [['a', '', false], ['a'.repeat(41), '', false], ['정상', 'a'.repeat(81), false], ['정상', '', true], ['이\n름', '', false], ['정상', '이\t름', false], ['정상', '', null]]) {
        await deny(save(A, SA, nick, name, publish), '22023');
      }
      const saved = await save(A, SA, '  닉네임  ', '  직접 입력 이름  ', true);
      assert.equal(saved.nickname, '닉네임');
      assert.equal(saved.real_name, '직접 입력 이름');
      assert.equal(saved.name_source, 'self_entered');
      assert.equal(saved.identity_verified, false);
      assert.equal(saved.benefits_active, false);
      assert.equal(saved.onboarding_ready, false);
      let projection = (await as('anon', {}, () => q('select public.kvl_member_public_author($1) as value', [A])))[0].value;
      assert.deepEqual(Object.keys(projection).sort(), ['author_id', 'name_source', 'public_author_name']);
      assert.equal(projection.public_author_name, '직접 입력 이름');
      await save(A, SA, '닉네임', '직접 입력 이름', false);
      projection = (await as('anon', {}, () => q('select public.kvl_member_public_author($1) as value', [A])))[0].value;
      assert.equal(projection.public_author_name, '닉네임');
      assert.equal(projection.name_source, 'nickname');
      assert.equal(JSON.stringify(projection).includes('직접 입력 이름'), false);
      assert.equal((await as('anon', {}, () => q('select public.kvl_member_public_author($1) as value', [C])))[0].value, null);
    });

    await t.test('persisted provider identity allows email-less Kakao and rejects unconfirmed email-only identities', async () => {
      assert.equal(await active(C, SC), false);
      await deny(self(C, SC));
      await db.query('insert into auth.identities(user_id,provider) values ($1,$2)', [C, 'email']);
      assert.equal(await active(C, SC, { user_metadata: { email_verified: true, provider: 'kakao' } }), false);
      await db.query('update auth.identities set provider=$1 where user_id=$2', ['kakao', C]);
      assert.equal(await active(C, SC), true);
      await save(C, SC, '카카오 회원');
      await db.query('update auth.identities set provider=$1 where user_id=$2', ['google', C]);
      assert.equal(await active(C, SC), true);
      await db.query('update auth.identities set provider=$1 where user_id=$2', ['untrusted', C]);
      assert.equal(await active(C, SC), false);
      await db.query('update auth.identities set provider=$1 where user_id=$2', ['kakao', C]);
    });

    await t.test('expired, mismatched, anonymous, malformed, banned, deleted, and revoked sessions fail closed', async () => {
      for (const extra of [{ exp: 1 }, { exp: 'not-a-number' }, { exp: null }, { role: 'anon' }, { is_anonymous: true }, { is_anonymous: 'bad' }, { session_id: 'bad' }, { session_id: null }, { sub: 'bad' }]) {
        assert.equal(await active(A, SA, extra), false);
      }
      assert.equal(await active(A, SB), false);
      for (const [column, value] of [['is_anonymous', 'true'], ['banned_until', "now()+interval '1 hour'"], ['deleted_at', 'now()']]) {
        await db.query(`update auth.users set ${column}=${value} where id=$1`, [A]);
        assert.equal(await active(A, SA), false);
        await db.query(`update auth.users set ${column}=${column === 'is_anonymous' ? 'false' : 'null'} where id=$1`, [A]);
      }
      await db.query("update auth.sessions set not_after=now()-interval '1 minute' where id=$1", [SA]);
      assert.equal(await active(A, SA), false);
      await db.query('update auth.sessions set not_after=null where id=$1', [SA]);
      await db.query('delete from auth.sessions where id=$1', [SA]);
      assert.equal(await active(A, SA), false);
      await deny(self(A, SA));
      await db.query('insert into auth.sessions(id,user_id) values ($1,$2)', [SA, A]);
      assert.equal(await active(A, SA), true);
    });

    await t.test('only a server-assigned administrator may read another real name and successful reads are audited', async () => {
      await deny(member(A, SA, 'select public.kvl_admin_get_member($1)', [B], { user_metadata: { role: 'admin' }, app_metadata: { role: 'admin' } }));
      await deny(member(A, SA, 'insert into kvl_members_private.member_admin_roles(user_id) values ($1)', [A]));
      await db.query('insert into kvl_members_private.member_admin_roles(user_id) values ($1)', [A]);
      const detail = (await member(A, SA, 'select public.kvl_admin_get_member($1) as value', [B]))[0].value;
      assert.equal(detail.real_name, '두 번째 이름');
      assert.deepEqual(await q('select actor_id,subject_id,action from kvl_members_private.admin_read_audit'), [{ actor_id: A, subject_id: B, action: 'member.profile.read' }]);
      assert.equal((await self(A, SA)).user_id, A);
      await db.query('update kvl_members_private.member_admin_roles set enabled=false where user_id=$1', [A]);
      await deny(member(A, SA, 'select public.kvl_admin_get_member($1)', [B]));
      await deny(member(A, SA, 'select * from kvl_members_private.admin_read_audit'));
    });

    await t.test('identity requests bind to the server-authenticated user/session and replace earlier pending requests', async () => {
      const request = await begin();
      assert.equal(request.identityVerificationId, RID);
      assert.equal(request.customerId, CID);
      await deny(getRequest(B, SB));
      await deny(getRequest(A, SB));
      await deny(getRequest(A, SA, 'z'.repeat(32)));
      await deny(begin(A, SB, 'c'.repeat(32), 'd'.repeat(32)));
      await begin(A, SA, 'c'.repeat(32), 'd'.repeat(32));
      await deny(getRequest());
      assert.equal((await getRequest(A, SA, 'c'.repeat(32))).identityVerificationId, 'c'.repeat(32));
      await db.query("update kvl_members_private.identity_requests set created_at=now()-interval '20 minutes',expires_at=now()-interval '10 minutes' where verification_id=$1", ['c'.repeat(32)]);
      await deny(getRequest(A, SA, 'c'.repeat(32)));
      await deny(consume(A, SA, 'c'.repeat(32), 'd'.repeat(32)));
    });

    await t.test('consume rejects mismatched bindings and stale timestamps without changing identity', async () => {
      await begin(A, SA, 'e'.repeat(32), 'f'.repeat(32));
      for (const args of [
        [A, SA, 'e'.repeat(32), CID],
        [B, SB, 'e'.repeat(32), 'f'.repeat(32)],
        [A, SA, 'e'.repeat(32), 'f'.repeat(32), '정상 이름', new Date(0).toISOString()],
        [A, SA, 'e'.repeat(32), 'f'.repeat(32), '정상 이름', new Date(Date.now() + 120000).toISOString()],
        [A, SA, 'e'.repeat(32), 'f'.repeat(32), '정상 이름', new Date().toISOString(), 'wrong-store'],
        [A, SA, 'e'.repeat(32), 'f'.repeat(32), '정상 이름', new Date().toISOString(), 'store-test', 'wrong-channel'],
        [A, SA, 'e'.repeat(32), 'f'.repeat(32), 'bad\nname'],
      ]) await assert.rejects(consume(...args), e => ['42501', '22023'].includes(e.code));
      assert.equal((await self(A, SA)).identity_verified, false);
      await deny(member(A, SA, 'insert into kvl_members_private.member_identities(user_id,verified_name,provider,verification_id,verified_at) values ($1,$2,$3,$4,now())', [A, '위조', 'portone', RID]));
      await db.query('delete from auth.sessions where id=$1', [SA]);
      await deny(consume(A, SA, 'e'.repeat(32), 'f'.repeat(32)));
      await db.query('insert into auth.sessions(id,user_id) values ($1,$2)', [SA, A]);
    });

    await t.test('atomic consume stores the provider name once, retracts mismatched-name disclosure, and never awards benefits', async () => {
      await save(A, SA, '닉네임', '내가 입력한 다른 이름', true);
      assert.deepEqual(await consume(A, SA, 'e'.repeat(32), 'f'.repeat(32)), { identity_verified: true });
      const profile = await self(A, SA);
      assert.equal(profile.real_name, '서버확인 이름');
      assert.equal(profile.publish_real_name, false);
      assert.equal(profile.name_source, 'nickname');
      assert.equal(profile.identity_verified, true);
      assert.equal(profile.onboarding_ready, true);
      assert.equal(profile.benefits_active, false);
      assert.equal((await member(A, SA, 'select public.kvl_member_is_ready() as value'))[0].value, true);
      await deny(consume(A, SA, 'e'.repeat(32), 'f'.repeat(32)));
      await deny(begin(A, SA, 'g'.repeat(32), 'h'.repeat(32)), '22023');
      await deny(save(A, SA, '다른 닉네임', '변경 시도', false), '22023');
      await deny(db.query('update kvl_members_private.member_identities set verified_name=$1 where user_id=$2', ['operator mutation also blocked', A]));
      const disclosed = await save(A, SA, '닉네임 변경', '서버확인 이름', true);
      assert.equal(disclosed.name_source, 'verified');
      assert.equal(disclosed.benefits_active, false);
      const projection = (await as('anon', {}, () => q('select public.kvl_member_public_author($1) as value', [A])))[0].value;
      assert.deepEqual(projection, { author_id: A, public_author_name: '서버확인 이름', name_source: 'verified' });
      await save(A, SA, '닉네임 변경', '서버확인 이름', false);
      assert.equal((await self(A, SA)).identity_verified, true);
      assert.equal((await q('select state from kvl_members_private.identity_requests where verification_id=$1', ['e'.repeat(32)]))[0].state, 'consumed');
    });

    await t.test('duplicate consume attempts produce exactly one identity and one success', async () => {
      await begin(B, SB, 'i'.repeat(32), 'j'.repeat(32));
      // PGlite serializes one connection; this proves replay atomicity, not hosted multi-connection scheduling.
      const sql = 'select public.kvl_identity_consume($1,$2,$3,$4,$5,$6,$7,$8) as value';
      const args = [B, SB, 'i'.repeat(32), 'j'.repeat(32), 'store-test', 'channel-test', '두 번째 이름', new Date().toISOString()];
      const outcomes = await as('service_role', { role: 'service_role' }, () => Promise.allSettled([q(sql, args), q(sql, args)]));
      assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(outcomes.filter(r => r.status === 'rejected').length, 1);
      assert.equal((await q('select count(*)::int as n from kvl_members_private.member_identities where user_id=$1', [B]))[0].n, 1);
      assert.deepEqual(await q('select note from kvl_private.preexisting_sentinel'), [{ note: 'old member draft is untouched' }]);
    });

    await t.test('identity-first onboarding exposes the verified name before a profile exists and permits the first profile save', async () => {
      await db.query('delete from kvl_members_private.member_profiles where user_id=$1', [C]);
      await begin(C, SC, 'k'.repeat(32), 'l'.repeat(32));
      await consume(C, SC, 'k'.repeat(32), 'l'.repeat(32), '먼저 확인한 이름');
      const beforeProfile = await self(C, SC);
      assert.equal(beforeProfile.identity_verified, true);
      assert.equal(beforeProfile.real_name, '먼저 확인한 이름');
      assert.equal(beforeProfile.nickname, '');
      assert.equal(beforeProfile.onboarding_ready, false);
      assert.equal(beforeProfile.publish_real_name, false);
      await deny(save(C, SC, '새 회원', '틀린 이름'), '22023');
      const profile = await save(C, SC, '새 회원', beforeProfile.real_name, false);
      assert.equal(profile.onboarding_ready, true);
      assert.equal(profile.benefits_active, false);
      assert.equal(profile.real_name, '먼저 확인한 이름');
    });
  } finally { await db.close(); }
});
