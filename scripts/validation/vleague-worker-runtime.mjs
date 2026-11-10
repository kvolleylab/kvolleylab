// Local workerd regression only; dummy credential, mocked responses, no live writes.
// npm install --prefix /tmp/kvl-worker-runtime wrangler@4.158.0
// KVL_MINIFLARE_MODULE=/tmp/kvl-worker-runtime/node_modules/miniflare/dist/src/index.js node scripts/validation/vleague-worker-runtime.mjs
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const runtime=process.env.KVL_MINIFLARE_MODULE;
if(!runtime)throw Error('Set KVL_MINIFLARE_MODULE to the pinned Wrangler dependency');
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(runtime));
const source=await readFile(new URL('../../infra/vleague-scheduler/scheduler.mjs',import.meta.url),'utf8');
for(const broken of [true,false]){
 const scheduler=broken?source.replace("redirect:'manual'","redirect:'error'"):source;
 const script=scheduler.replace(/^export /gm,'')+`
export default {async fetch(){
 const now=Date.parse('2026-11-10T10:00:00Z'),data=new Map(),calls=[];
 const storage={get:async k=>data.get(k),put:async(k,v)=>data.set(k,v),delete:async k=>data.delete(k)};
 const fetcher=async(url,options)=>{
  // Exercise workerd's real Request validation, which the Node mocks missed.
  new Request(url,options);calls.push(url);
  if(url.includes('/runs?'))return Response.json({workflow_runs:[]});
  if(url.includes('/dispatches'))return new Response(null,{status:204});
  return Response.json({matches:Array.from({length:126},(_,i)=>({id:String(i),date:'2026-12-01',time:'19:00',status:'scheduled'}))});
 };
 try{return Response.json({result:await tick({KVL_SCHEDULER_APPROVED:'true',KVL_NOTIFICATIONS_APPROVED:'false',GITHUB_TOKEN:'DUMMY_TEST_ONLY'},storage,now,fetcher),calls:calls.length});}
 catch(e){return Response.json({failure:failureDetails(e),calls:calls.length});}
}}`;
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,compatibilityDate:'2026-11-06',script}));
 try{
  const result=await(await mf.dispatchFetch('http://localhost')).json();
  if(broken){assert.equal(result.failure.stage,'GITHUB_RUNS');assert.equal(result.calls,0);}
  else{assert.equal(result.result.dispatched,true);assert.equal(result.calls,4);}
  console.log(JSON.stringify({case:broken?'original-mode-reproduces-pre-request-failure':'fixed-mode-reaches-mocked-dispatch',...result}));
 }finally{await mf.dispose();}
}
