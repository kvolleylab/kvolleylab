'use strict';
// Execute the established public loader (including reviewed identity overlays), not a new merger.
const fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const root=path.resolve(process.argv[2]||'.');
(async()=>{
 const dom=new JSDOM('<body data-player-workspace><main id="playerArea"></main></body>',{
  url:'https://kvolleylab.com/players.html',runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const w=dom.window;w.Blob=Blob;w.Response=Response;w.DecompressionStream=DecompressionStream;
 w.fetch=async url=>{
  const file=path.resolve(root,new URL(url,w.location.href).pathname.slice(1));
  if(!file.startsWith(root+path.sep))throw new Error('outside repository');
  try{return new Response(fs.readFileSync(file),{status:200});}catch{return new Response('',{status:404});}
 };
 try {
  for(const f of ['player-school-master-v2.js','player-school-master-compat-v2.js','player-search-v2.js'])
   w.eval(fs.readFileSync(path.join(root,'assets/js',f),'utf8'));
  let timer;
  const catalog=await Promise.race([w.KVLPlayerCatalogReady,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),20000);})]).finally(()=>clearTimeout(timer));
  if(!Array.isArray(catalog)||!catalog.length)throw new Error('empty catalog');
  await new Promise(resolve=>process.stdout.write(JSON.stringify(catalog.map(p=>({playerId:p.playerId,nameKo:p.nameKo,birthDate:p.birthDate}))),resolve));
 } finally {w.close();}
})().catch(()=>{process.stderr.write('CATALOG_NOT_VERIFIED\n');process.exitCode=2;});
