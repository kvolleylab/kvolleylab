/* Run only against disposable PostgreSQL test service, NEVER against live Supabase.
 * Node 20+; postgres@3.4.5, no production credentials.
 */
"use strict";
const assert=require("node:assert/strict");
const postgres=require("postgres");
const url=process.env.KVL_FIXTURE_DB_URL;
if(!url || !/^postgres:\/\/kvl_fixture:/.test(url))throw Error("No disposable fixture DB configured");

async function main(){
 const sql=postgres(url,{max:1,prepare:false,idle_timeout:10});
 try{
   await sql`create temporary table kvl_layout_fixture (
      id serial primary key, tokens jsonb not null check
      (jsonb_typeof(tokens)='object' and pg_column_size(tokens)<=8192),
      revision int not null default 1)`;
   await sql`create temporary table kvl_layout_history_fixture (
      draft_id int not null references kvl_layout_fixture(id),
      revision int not null, tokens jsonb not null check
      (jsonb_typeof(tokens)='object' and pg_column_size(tokens)<=8192))`;
   const sample={nameSize:15,logoSize:52,nameMode:"two"};
   // Reproduce the old broken binding. Postgres.js can double-encode an
   // already JSON.stringify'd parameter when the inferred OID is jsonb.
   let rejected=false;
   try {
     await sql`insert into kvl_layout_fixture (tokens)
       values (${JSON.stringify(sample)}::jsonb)`;
   }catch(err){
     rejected=err.code==="23514";
     if(!rejected)throw err;
   }
   assert.equal(rejected,true,"old bare jsonb binding must reproduce reported check violation");

   // First draft + first revision must commit atomically with JSONB OBJECT.
   const first=await sql.begin(async tx=>{
     const draft=await tx`insert into kvl_layout_fixture(tokens,revision)
       values (${JSON.stringify(sample)}::text::jsonb,1)
       returning id, tokens, jsonb_typeof(tokens) as kind`;
     const history=await tx`insert into kvl_layout_history_fixture(draft_id,revision,tokens)
       values(${draft[0].id},1,${JSON.stringify(sample)}::text::jsonb)
       returning tokens,jsonb_typeof(tokens) as kind`;
     return {draft:draft[0],history:history[0]};
   });
   assert.equal(first.draft.kind,"object");
   assert.deepEqual(first.draft.tokens,sample);
   assert.equal(first.history.kind,"object");
   assert.deepEqual(first.history.tokens,sample);

   // Re-save and append history with same protected object type.
   const edited={...sample,nameSize:16,logoSize:55};
   await sql.begin(async tx=>{
     await tx`update kvl_layout_fixture
       set tokens=${JSON.stringify(edited)}::text::jsonb,revision=2
       where id=${first.draft.id}`;
     await tx`insert into kvl_layout_history_fixture(draft_id,revision,tokens)
       values(${first.draft.id},2,${JSON.stringify(edited)}::text::jsonb)`;
   });
   const row=await sql`select tokens,jsonb_typeof(tokens) as kind,revision
     from kvl_layout_fixture where id=${first.draft.id}`;
   assert.equal(row[0].kind,"object");
   assert.deepEqual(row[0].tokens,edited);
   assert.equal(row[0].revision,2);

   // Restore history v1 as v3: no stringified JSON scalar stored.
   const h=await sql`select tokens from kvl_layout_history_fixture
     where draft_id=${first.draft.id} and revision=1`;
   await sql.begin(async tx=>{
     await tx`update kvl_layout_fixture
       set tokens=${JSON.stringify(h[0].tokens)}::text::jsonb,revision=3
       where id=${first.draft.id}`;
     await tx`insert into kvl_layout_history_fixture(draft_id,revision,tokens)
       values(${first.draft.id},3,${JSON.stringify(h[0].tokens)}::text::jsonb)`;
   });
   const restored=await sql`select revision,tokens,jsonb_typeof(tokens) as kind
     from kvl_layout_fixture where id=${first.draft.id}`;
   assert.equal(restored[0].kind,"object");
   assert.deepEqual(restored[0].tokens,sample);
   assert.equal(restored[0].revision,3);
   const count=await sql`select count(*)::int as total from kvl_layout_history_fixture`;
   assert.equal(count[0].total,3);
   console.log("PASS: real PostgreSQL 17/Postgres.js 3.4.5 - legacy rejected, save, update, revision and restore are JSONB objects");
 }finally{
   await sql.end({timeout:5});
 }
}
main().catch(e=>{console.error("TEST_FAILED:",e.code||e.name||"unknown");process.exitCode=1});
