import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '../tools/membership/node_modules/@electric-sql/pglite/dist/index.js';
const migration=readFileSync(new URL('../supabase/migrations/202610240001_player_members.sql',import.meta.url),'utf8');
const seed=readFileSync(new URL('../supabase/seeds/player-id-allowlist.sql',import.meta.url),'utf8');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',SA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',SB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
test('PostgreSQL enforces ownership, verified sessions and immutable player IDs',async t=>{
  const db=new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users,not_after timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    grant usage on schema auth,public to authenticated,anon;
    grant execute on function auth.jwt(),auth.uid() to authenticated,anon;
    insert into auth.users values('${A}',now()),('${B}',now());
    insert into auth.sessions values('${SA}','${A}',null),('${SB}','${B}',null);`);
  await db.exec(migration);await db.exec(seed);
  async function as(role,id,session,fn,extra={}){
    await db.exec(`set role ${role}`);
    await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:id,session_id:session,exp:Math.floor(Date.now()/1000)+3600,is_anonymous:false,...extra})]);
    try{return await fn()}finally{await db.exec('reset role')}
  }
  const note=async body=>(await db.query("insert into public.kvl_player_notes(player_id,title,body) values('KVL-P-000001','観察',$1) returning *",[body])).rows[0];
  let aNote,bNote;
  await t.test('two members can bookmark the same permanent player ID and create separate notes',async()=>{
    aNote=await as('authenticated',A,SA,async()=>{await db.exec("insert into public.kvl_player_bookmarks(player_id) values('KVL-P-000001')");return note('MEMBER_A_PRIVATE')});
    bNote=await as('authenticated',B,SB,async()=>{await db.exec("insert into public.kvl_player_bookmarks(player_id) values('KVL-P-000001')");return note('MEMBER_B_PRIVATE')});
    assert.equal(aNote.user_id,A);assert.equal(bNote.user_id,B);assert.notEqual(aNote.id,bNote.id);
  });
  await t.test('anonymous SELECT, INSERT, UPDATE and DELETE are denied',async()=>{
    for(const sql of ["select * from public.kvl_player_notes","insert into public.kvl_player_notes(player_id,body) values('KVL-P-000001','x')","update public.kvl_player_notes set body='x',revision=2","delete from public.kvl_player_notes","select * from public.kvl_player_bookmarks","insert into public.kvl_player_bookmarks(player_id) values('KVL-P-000001')"])
      await as('anon',null,null,()=>assert.rejects(db.exec(sql),/permission denied/));
  });
  await t.test('member B cannot read, modify or delete member A notes by guessing note ID',async()=>{
    await as('authenticated',B,SB,async()=>{
      assert.equal((await db.query('select * from public.kvl_player_notes where id=$1',[aNote.id])).rows.length,0);
      assert.equal((await db.query("update public.kvl_player_notes set body='ATTACK',revision=2 where id=$1 returning id",[aNote.id])).rows.length,0);
      assert.equal((await db.query('delete from public.kvl_player_notes where id=$1 returning id',[aNote.id])).rows.length,0);
      assert.equal((await db.query('select * from public.kvl_player_notes')).rows[0].body,'MEMBER_B_PRIVATE');
      assert.equal((await db.query('delete from public.kvl_player_bookmarks where user_id=$1 returning player_id',[A])).rows.length,0);
    });
  });
  await t.test('spoofed user_id, ownership transfer, player replacement and timestamp edits are denied',async()=>{
    await as('authenticated',B,SB,async()=>{
      await assert.rejects(db.query("insert into public.kvl_player_notes(user_id,player_id,body) values($1,'KVL-P-000001','spoof')",[A]),/permission denied/);
      await assert.rejects(db.query('update public.kvl_player_notes set user_id=$1 where id=$2',[A,bNote.id]),/permission denied/);
      await assert.rejects(db.query("update public.kvl_player_notes set player_id='KVL-P-000002' where id=$1",[bNote.id]),/permission denied/);
      await assert.rejects(db.query("update public.kvl_player_notes set created_at=now() where id=$1",[bNote.id]),/permission denied/);
    });
  });
  await t.test('unknown player IDs and malformed notes never enter private storage',async()=>{
    await as('authenticated',A,SA,async()=>{
      await assert.rejects(db.exec("insert into public.kvl_player_bookmarks(player_id) values('KVL-P-999999999')"),/foreign key/);
      await assert.rejects(note('  '),/check constraint/);
      await assert.rejects(note('x'.repeat(6001)),/check constraint/);
    });
  });
  await t.test('multiple notes are allowed; stale edits cannot overwrite a newer revision',async()=>{
    await as('authenticated',A,SA,async()=>{
      const second=await note('SECOND_NOTE');assert.notEqual(second.id,aNote.id);
      const updated=await db.query("update public.kvl_player_notes set body='UPDATED',revision=2 where id=$1 and revision=1 returning revision",[aNote.id]);assert.equal(updated.rows[0].revision,2);
      assert.equal((await db.query("update public.kvl_player_notes set body='STALE',revision=2 where id=$1 and revision=1 returning id",[aNote.id])).rows.length,0);
      await assert.rejects(db.query("update public.kvl_player_notes set body='BAD',revision=4 where id=$1",[aNote.id]),/revision conflict/);
      assert.equal((await db.query('delete from public.kvl_player_notes where id=$1 returning id',[second.id])).rows.length,1);
    });
  });
  await t.test('a user cannot forge another member session, skip verification, or use expired JWT claims',async()=>{
    for(const [id,sid,extra] of [[A,SB,{}],[A,null,{}],[A,SA,{is_anonymous:true}],[A,SA,{exp:1}]])await as('authenticated',id,sid,async()=>{
      assert.equal((await db.query('select public.kvl_member_session_active() as valid')).rows[0].valid,false);
      assert.equal((await db.query('select * from public.kvl_player_notes')).rows.length,0);
      await assert.rejects(note('DENIED'),/row-level security/);
    },extra);
    await db.query('update auth.users set email_confirmed_at=null where id=$1',[A]);
    await as('authenticated',A,SA,()=>assert.rejects(note('UNVERIFIED'),/row-level security/));
    await db.query('update auth.users set email_confirmed_at=now() where id=$1',[A]);
  });
  await t.test('logging out removes the session and immediately blocks the still-unexpired token',async()=>{
    await db.query('delete from auth.sessions where id=$1',[SA]);
    await as('authenticated',A,SA,async()=>{
      assert.equal((await db.query('select * from public.kvl_player_notes')).rows.length,0);
      assert.equal((await db.query('select * from public.kvl_player_bookmarks')).rows.length,0);
      await assert.rejects(note('AFTER_LOGOUT'),/row-level security/);
    });
    await as('authenticated',B,SB,async()=>assert.equal((await db.query('select * from public.kvl_player_notes')).rows[0].body,'MEMBER_B_PRIVATE'));
  });
  await t.test('ID registry and auth session tables are not directly exposed to members',async()=>{
    await as('authenticated',B,SB,async()=>{
      await assert.rejects(db.exec('select * from kvl_private.player_ids'),/permission denied/);
      await assert.rejects(db.exec("insert into kvl_private.player_ids values('NEW','x')"),/permission denied/);
      await assert.rejects(db.exec('select * from auth.sessions'),/permission denied/);
    });
    assert.equal((await db.query('select count(*)::int n from kvl_private.player_ids')).rows[0].n,1842);
    const policies=(await db.query("select tablename,rowsecurity from pg_tables where tablename like 'kvl_player_%'" )).rows;assert.ok(policies.every(p=>p.rowsecurity));
  });
  await db.close();
});
