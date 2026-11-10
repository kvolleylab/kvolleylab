import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.84.0";
import postgres from "npm:postgres@3.4.5";

const allowedOrigins=new Set(["https://kvolleylab.com"]);
const databaseUrl=Deno.env.get("SUPABASE_DB_URL")!;
const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
const publishableKeys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}") as Record<string,string>;
const publishableKey=publishableKeys.default||Deno.env.get("SUPABASE_ANON_KEY")!;
const sql=postgres(databaseUrl,{max:1,prepare:false,idle_timeout:20});

function cors(origin:string|null){
  const allowed=origin&&allowedOrigins.has(origin)?origin:"https://kvolleylab.com";
  return {"Access-Control-Allow-Origin":allowed,"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
}
function reply(origin:string|null,status:number,body:Record<string,unknown>){
  return new Response(JSON.stringify(body),{status,headers:{...cors(origin),"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
}

Deno.serve(async req=>{
  const origin=req.headers.get("Origin");
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});
  if(req.method!=="POST")return reply(origin,405,{ok:false,error:"method_not_allowed"});
  if(origin&&!allowedOrigins.has(origin))return reply(origin,403,{ok:false,error:"origin_not_allowed"});
  try{
    const auth=req.headers.get("Authorization")||"";
    const token=auth.startsWith("Bearer ")?auth.slice(7):"";
    if(!token)return reply(origin,200,{ok:true,authenticated:false,access:false,role:"guest"});
    const authClient=createClient(supabaseUrl,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await authClient.auth.getUser(token);
    if(error||!data.user)return reply(origin,200,{ok:true,authenticated:false,access:false,role:"guest"});
    const userId=data.user.id;
    const admin=await sql`select 1 from kvl_admin_private.admin_accounts where user_id=${userId}::uuid and active=true limit 1`;
    if(admin.length)return reply(origin,200,{ok:true,authenticated:true,access:true,role:"admin",email:data.user.email||null});
    const member=await sql`select active,status,nickname,real_name_public,identity_verified from kvl_members_private.member_accounts where user_id=${userId}::uuid limit 1`;
    if(!member.length)return reply(origin,200,{ok:true,authenticated:true,access:false,role:"unregistered",email:data.user.email||null});
    const row=member[0],access=row.active===true&&row.status==="active";
    return reply(origin,200,{ok:true,authenticated:true,access,role:"member",member_status:row.status,nickname:row.nickname||"",real_name_public:row.real_name_public===true,identity_verified:row.identity_verified===true,email:data.user.email||null});
  }catch(err){
    console.error("member-access",err instanceof Error?err.message:String(err));
    return reply(origin,500,{ok:false,error:"server_error"});
  }
});