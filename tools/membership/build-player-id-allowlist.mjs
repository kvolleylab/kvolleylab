// Read the existing runtime loader; do not reconstruct or replace the player MASTER.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(new URL('../..',import.meta.url).pathname);
const dom=new JSDOM('<body data-player-workspace></body>',{url:'https://kvolleylab.com/players.html',runScripts:'outside-only'});
const w=dom.window;w.DecompressionStream=DecompressionStream;w.Response=Response;w.Blob=Blob;
w.fetch=async input=>{try{return new Response(fs.readFileSync(path.join(root,new URL(input,w.location.href).pathname)))}catch{return new Response('',{status:404})}};
for(const f of ['player-school-master-v2.js','player-school-master-compat-v2.js','player-search-v2.js'])w.eval(fs.readFileSync(path.join(root,'assets/js',f),'utf8'));
const catalog=await w.KVLPlayerCatalogReady,ids=catalog.map(p=>p.playerId).sort();
if(new Set(ids).size!==ids.length||ids.some(id=>!/^[-A-Z0-9_]+$/.test(id)))throw new Error('Unsafe or duplicate player ID');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sql=`-- Existing player IDs only. Run after schema migration; append on conflict, never delete.\ninsert into kvl_private.player_ids (player_id,source_commit) values\n`+ids.map(id=>`('${id}','${commit}')`).join(',\n')+'\non conflict (player_id) do nothing;\n';
fs.mkdirSync(path.join(root,'supabase/seeds'),{recursive:true});
fs.writeFileSync(path.join(root,'supabase/seeds/player-id-allowlist.sql'),sql);
console.log(JSON.stringify({count:ids.length,unique:new Set(ids).size,source_commit:commit}));dom.window.close();
