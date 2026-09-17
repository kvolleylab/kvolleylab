#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const configAPI=require('../assets/js/kvl-competition-config-v2.js'),modules=require('../assets/js/kvl-competition-modules-v2.js'),dataAPI=require('../assets/js/kvl-competition-data-v2.js');
const repo=path.resolve(__dirname,'..'),read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function create(slug,{root=path.join(repo,'data/competitions')}={}){
 configAPI.locationFor('https://kvolleylab.com/competition.html?competition='+encodeURIComponent(slug),'/data/competitions/');
 const directory=path.join(root,slug);fs.mkdirSync(root,{recursive:true});fs.mkdirSync(directory);
 const config=read(path.join(repo,'templates/competition-config-v2.starter.json'));config.slug=slug;
 fs.writeFileSync(path.join(directory,'config.json'),JSON.stringify(config,null,2)+'\n',{flag:'wx'});
 fs.copyFileSync(path.join(repo,'templates/competition-content-v2.starter.json'),path.join(directory,'data.json'),fs.constants.COPYFILE_EXCL);
 return directory;
}
function check(directory,{validation=false}={}){
 const slug=path.basename(path.resolve(directory)),c=read(path.join(directory,'config.json'));
 const errors=configAPI.validate(c,{slug});if(errors.length)throw Error(errors.join('\n'));
 const canonical='https://kvolleylab.com/competition.html?competition='+slug;
 const d=modules.apply(configAPI.assemble(c,read(path.join(directory,c.data)),{slug,canonical}),c.modules||[],(c.modules||[]).map(m=>read(path.join(directory,m.source))));
 const problems=dataAPI.validate(d,{production:!validation});if(problems.length)throw Error(problems.join('\n'));
 return dataAPI.normalize(d);
}
if(require.main===module){
 const args=process.argv.slice(2),get=key=>args[args.indexOf(key)+1];
 try{
  if(args.includes('--check')){check(get('--check'),{validation:args.includes('--validation')});console.log('PASS config/data/modules');}
  else if(args.includes('--slug')){const slug=get('--slug');console.log('Created '+create(slug));console.log('Fill config.json and data.json, then run --check. URL: /competition.html?competition='+slug);}
  else throw Error('Usage: node scripts/scaffold-competition-v2.cjs --slug event-2032-men | --check data/competitions/event-2032-men [--validation]');
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={create,check};
