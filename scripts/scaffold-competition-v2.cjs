#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const configAPI=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js'),dataAPI=require('../assets/js/kvl-competition-data-v2.js');
const operationsAPI=require('./kvl-competition-operations-v1.cjs');
const repo=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function create(slug,{root=path.join(repo,'data/competitions')}={}){
 configAPI.locationFor('https://kvolleylab.com/competition-engine.html?competition='+encodeURIComponent(slug),'/data/competitions/');
 const config=read(path.join(repo,'templates/competition-config-v2.starter.json'));config.slug=slug;
 const data=read(path.join(repo,'templates/competition-content-v2.starter.json'));
 const operations=read(path.join(repo,'templates/competition-operations-v1.starter.json'));
 operations.competition.slug=slug;operations.page.route='/competition-engine.html?competition='+slug;
 // Read all starters before reserving a new directory. Never open an existing event.
 const directory=path.join(root,slug),written=[];fs.mkdirSync(root,{recursive:true});fs.mkdirSync(directory);
 try{
  for(const [name,value] of [['config.json',config],['data.json',data],['operations.json',operations]]){
   const file=path.join(directory,name);fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{flag:'wx'});written.push(file);
  }
 }catch(error){
  for(const file of written)fs.unlinkSync(file);
  try{fs.rmdirSync(directory);}catch{/* Preserve any unexpected file created by another process. */}
  throw error;
 }
 return directory;
}
function check(directory,{validation=false,moduleFiles=[]}={}){
 for(const file of moduleFiles)require(path.resolve(file))(modules);
 const slug=path.basename(path.resolve(directory)),c=read(path.join(directory,'config.json'));
 const errors=configAPI.validate(c,{slug});if(errors.length)throw Error(errors.join('\n'));
 const canonical='https://kvolleylab.com/competition-engine.html?competition='+slug;
 const d=modules.apply(configAPI.assemble(c,read(path.join(directory,c.data)),{slug,canonical}),c.modules||[],(c.modules||[]).map(m=>read(path.join(directory,m.source))));
 const problems=dataAPI.validate(d,{production:!validation});if(problems.length)throw Error(problems.join('\n'));
 return dataAPI.normalize(d);
}
function checkOperations(directory,options={}){return operationsAPI.check(directory,options);}
function readyToActivate(directory,options={}){
 const data=check(directory,{...options,validation:false});
 const operations=checkOperations(directory,{...options,readyToActivate:true});
 return {data,operations};
}
if(require.main===module){
 const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1];
 try{
  const moduleFiles=args.flatMap((arg,index)=>arg==='--module'?[args[index+1]]:[]);
  if(args.includes('--ready-to-activate')){readyToActivate(get('--ready-to-activate'),{moduleFiles});console.log('PASS activation review gate. No activation, MASTER write, scheduling, or deployment performed.');}
  else if(args.includes('--check-operations')){checkOperations(get('--check-operations'));console.log('PASS operations evidence contract. Runtime and permissions are not re-verified by this command.');}
  else if(args.includes('--check')){check(get('--check'),{validation:args.includes('--validation'),moduleFiles});console.log('PASS config/data/modules (page data only; operations not checked)');}
  else if(args.includes('--slug')){const slug=get('--slug');console.log('Created '+create(slug));console.log('Fill config.json, data.json and operations.json. State: DRAFT; automation disabled. Run --ready-to-activate after source, MASTER, schedule and archive QA. URL: /competition-engine.html?competition='+slug);}
  else throw Error('Usage: node scripts/scaffold-competition-v2.cjs --slug event-2032-men | --check directory [--validation] | --check-operations directory | --ready-to-activate directory');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={create,check,checkOperations,readyToActivate};
