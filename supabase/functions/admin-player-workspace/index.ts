import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.84.0";
import postgres from "npm:postgres@3.4.5";

const allowedOrigins = new Set(["https://kvolleylab.com"]);
const databaseUrl = Deno.env.get("SUPABASE_DB_URL")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}") as Record<string,string>;
const publishableKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY")!;
const sql = postgres(databaseUrl, { max: 1, prepare: false, idle_timeout: 20 });

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://kvolleylab.com";
  return {"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
}
function response(origin:string|null,status:number,body:Record<string,unknown>){return new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
function validPlayerId(v:unknown){return typeof v==="string"&&/^KVL-P-\d{6}$/.test(v)}
function validUuid(v:unknown){return typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function validRevision(v:unknown){return Number.isInteger(v)&&Number(v)>0}

Deno.serve(async req=>{
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return response(origin,405,{ok:false,error:"method_not_allowed"});
  if(origin&&!allowedOrigins.has(origin))return response(origin,403,{ok:false,error:"origin_not_allowed"});
  try{
    const auth=req.headers.get("Authorization")||"";const token=auth.startsWith("Bearer ")?auth.slice(7):"";
    if(!token)return response(origin,401,{ok:false,error:"login_required"});
    const authClient=createClient(supabaseUrl,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await authClient.auth.getUser(token);if(error||!data.user)return response(origin,401,{ok:false,error:"invalid_session"});
    const userId=data.user.id;
    const admins=await sql`select active from kvl_admin_private.admin_accounts where user_id=${userId}::uuid and active=true limit 1`;
    if(!admins.length)return response(origin,403,{ok:false,error:"admin_only"});
    const body=await req.json().catch(()=>({}));const action=body?.action;

    if(action==="status"){
      const [b]=await sql`select count(*)::int as count from kvl_admin_private.bookmarks where user_id=${userId}::uuid`;
      const [n]=await sql`select count(*)::int as count from kvl_admin_private.notes where user_id=${userId}::uuid`;
      return response(origin,200,{ok:true,bookmark_count:b.count,note_count:n.count});
    }
    if(action==="list_bookmarks"){
      const items=await sql`select player_id,created_at from kvl_admin_private.bookmarks where user_id=${userId}::uuid order by created_at desc limit 1000`;
      return response(origin,200,{ok:true,items});
    }
    if(action==="toggle_bookmark"){
      if(!validPlayerId(body.player_id))return response(origin,400,{ok:false,error:"invalid_player_id"});
      const existing=await sql`select 1 from kvl_admin_private.bookmarks where user_id=${userId}::uuid and player_id=${body.player_id} limit 1`;
      if(existing.length){await sql`delete from kvl_admin_private.bookmarks where user_id=${userId}::uuid and player_id=${body.player_id}`;return response(origin,200,{ok:true,saved:false});}
      await sql`insert into kvl_admin_private.bookmarks(user_id,player_id) values(${userId}::uuid,${body.player_id}) on conflict do nothing`;
      return response(origin,200,{ok:true,saved:true});
    }
    if(action==="list_notes"){
      const items=await sql`select id,player_id,season,title,body,revision,created_at,updated_at from kvl_admin_private.notes where user_id=${userId}::uuid order by updated_at desc limit 500`;
      return response(origin,200,{ok:true,items});
    }
    if(action==="save_note"){
      if(!validPlayerId(body.player_id))return response(origin,400,{ok:false,error:"invalid_player_id"});
      const season=String(body.season||"").trim().slice(0,20),title=String(body.title||"").trim().slice(0,120),noteBody=String(body.body||"").trim().slice(0,10000);
      if(!season||!title||!noteBody)return response(origin,400,{ok:false,error:"note_fields_required"});
      if(body.id){
        if(!validUuid(body.id)||!validRevision(body.expected_revision))return response(origin,400,{ok:false,error:"invalid_note_revision"});
        const rows=await sql`update kvl_admin_private.notes set season=${season},title=${title},body=${noteBody},revision=revision+1,updated_at=clock_timestamp() where id=${body.id}::uuid and user_id=${userId}::uuid and player_id=${body.player_id} and revision=${body.expected_revision} returning id,revision,updated_at`;
        if(!rows.length)return response(origin,409,{ok:false,error:"note_changed_reload"});return response(origin,200,{ok:true,item:rows[0]});
      }
      const rows=await sql`insert into kvl_admin_private.notes(user_id,player_id,season,title,body) values(${userId}::uuid,${body.player_id},${season},${title},${noteBody}) returning id,revision,updated_at`;
      return response(origin,200,{ok:true,item:rows[0]});
    }
    if(action==="delete_note"){
      if(!validUuid(body.id)||!validRevision(body.expected_revision))return response(origin,400,{ok:false,error:"invalid_note_revision"});
      const rows=await sql`delete from kvl_admin_private.notes where id=${body.id}::uuid and user_id=${userId}::uuid and revision=${body.expected_revision} returning id`;
      if(!rows.length)return response(origin,409,{ok:false,error:"note_changed_reload"});return response(origin,200,{ok:true});
    }
    return response(origin,400,{ok:false,error:"unknown_action"});
  }catch(err){console.error("admin-player-workspace",err instanceof Error?err.message:String(err));return response(origin,500,{ok:false,error:"server_error"})}
});