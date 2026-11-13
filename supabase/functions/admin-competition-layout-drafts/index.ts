/* KVL competition design drafts API; DRAFT ONLY, never publishes. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.84.0";
import postgres from "npm:postgres@3.4.5";
import {cleanTokens,normalizeScope,revisionValue} from "../_shared/kvl-layout-tokens-v1.mjs";

const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
const publishableKeys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}") as Record<string,string>;
const publishableKey=publishableKeys.default||Deno.env.get("SUPABASE_ANON_KEY")!;
const sql=postgres(Deno.env.get("SUPABASE_DB_URL")!,{max:1,prepare:false,idle_timeout:20});
const ORIGIN="https://kvolleylab.com";
const headers={
  "Access-Control-Allow-Origin":ORIGIN,
  "Access-Control-Allow-Headers":"authorization,x-client-info,apikey,content-type",
  "Access-Control-Allow-Methods":"POST,OPTIONS",
  "Cache-Control":"no-store","Vary":"Origin"
};
const respond=(status:number,body:Record<string,unknown>)=>
  new Response(JSON.stringify(body),{status,headers:{...headers,"Content-Type":"application/json"}});
const rev=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>0;

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
  if(req.method!=="POST")return respond(405,{ok:false,error:"method_not_allowed"});
  const origin=req.headers.get("Origin");
  if(origin&&origin!==ORIGIN)return respond(403,{ok:false,error:"origin_not_allowed"});
  const bearer=req.headers.get("Authorization")||"";
  if(!bearer.startsWith("Bearer ")||bearer.length>12000)return respond(401,{ok:false,error:"login_required"});
  try{
    const client=createClient(supabaseUrl,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await client.auth.getUser(bearer.slice(7));
    if(error||!data.user)return respond(401,{ok:false,error:"invalid_session"});
    const userId=data.user.id;
    const admins=await sql`select 1 from kvl_admin_private.admin_accounts where user_id=${userId}::uuid and active=true limit 1`;
    if(!admins.length)return respond(403,{ok:false,error:"admin_only"});
    const raw=await req.text();
    if(raw.length>16384)return respond(413,{ok:false,error:"request_too_large"});
    let body:Record<string,unknown>;
    try{body=JSON.parse(raw);}catch{return respond(400,{ok:false,error:"invalid_json"});}
    if(!body||typeof body!=="object"||Array.isArray(body))return respond(400,{ok:false,error:"invalid_body"});
    const action=String(body.action||"");
    if(action==="status")return respond(200,{ok:true,publish_available:false,mode:"draft_only"});
    if(action==="list"){
      const items=await sql`select scope,scope_key,tokens,revision,updated_at
        from kvl_admin_private.competition_layout_drafts where user_id=${userId}::uuid
        order by updated_at desc limit 300`;
      return respond(200,{ok:true,items});
    }
    let scope:string,scopeKey:string;
    try{({scope,scopeKey}=normalizeScope(body.scope,body.scope_key));}
    catch{return respond(400,{ok:false,error:"invalid_scope"});}
    if(action==="history"){
      const records=await sql`select id,revision from kvl_admin_private.competition_layout_drafts
        where user_id=${userId}::uuid and scope=${scope} and scope_key=${scopeKey} limit 1`;
      if(!records.length)return respond(200,{ok:true,current_revision:null,items:[]});
      const items=await sql`select revision,action,created_at,tokens
        from kvl_admin_private.competition_layout_draft_revisions where layout_id=${records[0].id}::uuid
        order by revision desc limit 40`;
      return respond(200,{ok:true,current_revision:records[0].revision,items});
    }
    if(action!=="save"&&action!=="restore")return respond(400,{ok:false,error:"unknown_action"});
    let expected:number|null;
    try{
      if(!Object.hasOwn(body,"expected_revision"))throw Error("bad");
      expected=revisionValue(body.expected_revision);
    }catch{return respond(400,{ok:false,error:"invalid_revision"});}
    let tokens:Record<string,unknown>={};
    let restoreRevision:number|null=null;
    if(action==="save"){
      try{tokens=cleanTokens(body.tokens);}catch{return respond(400,{ok:false,error:"invalid_tokens"});}
    }else{
      if(!rev(body.restore_revision))return respond(400,{ok:false,error:"invalid_restore_revision"});
      restoreRevision=Number(body.restore_revision);
    }
    // Postgres.js infers JSON input types from bare ::jsonb casts and can
    // double-encode an already-stringified parameter into a JSONB string.
    // Bind as TEXT first, then let PostgreSQL parse the JSON text into an
    // object. The table's jsonb_typeof(tokens)='object' CHECK remains enabled.
    const result=await sql.begin(async tx=>{
      const rows=await tx`select id,revision from kvl_admin_private.competition_layout_drafts
        where user_id=${userId}::uuid and scope=${scope} and scope_key=${scopeKey} for update`;
      if(rows.length){
        const row=rows[0];
        if(row.revision!==expected)return {conflict:true,revision:row.revision};
        if(restoreRevision!==null){
          const history=await tx`select tokens from kvl_admin_private.competition_layout_draft_revisions
            where layout_id=${row.id}::uuid and revision=${restoreRevision} limit 1`;
          if(!history.length)return {missing:true};
          tokens=cleanTokens(history[0].tokens);
        }
        const revision=row.revision+1;
        await tx`update kvl_admin_private.competition_layout_drafts
          set tokens=${JSON.stringify(tokens)}::text::jsonb,revision=${revision},updated_at=clock_timestamp()
          where id=${row.id}::uuid`;
        await tx`insert into kvl_admin_private.competition_layout_draft_revisions
          (layout_id,editor_user_id,revision,tokens,action)
          values(${row.id}::uuid,${userId}::uuid,${revision},${JSON.stringify(tokens)}::text::jsonb,${action})`;
        return {revision,tokens};
      }
      if(expected!==null)return {conflict:true,revision:null};
      if(restoreRevision!==null)return {missing:true};
      const inserted=await tx`insert into kvl_admin_private.competition_layout_drafts
        (user_id,scope,scope_key,tokens,revision)
        values(${userId}::uuid,${scope},${scopeKey},${JSON.stringify(tokens)}::text::jsonb,1) returning id`;
      await tx`insert into kvl_admin_private.competition_layout_draft_revisions
        (layout_id,editor_user_id,revision,tokens,action)
        values(${inserted[0].id}::uuid,${userId}::uuid,1,${JSON.stringify(tokens)}::text::jsonb,'save')`;
      return {revision:1,tokens};
    });
    if("conflict" in result)return respond(409,{ok:false,error:"revision_conflict",current_revision:result.revision});
    if("missing" in result)return respond(404,{ok:false,error:"revision_not_found"});
    return respond(200,{ok:true,scope,scope_key:scopeKey,mode:"draft_only",revision:result.revision,tokens:result.tokens});
  }catch(error){
    if((error as {code?:string})?.code==="23505")return respond(409,{ok:false,error:"revision_conflict"});
    return respond(500,{ok:false,error:"internal_error"});
  }
});
