/* Export the already-validated Horizon fixture; do not invent a second dataset. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),createDummy=require('./fixtures/competition-v2-dummy.js');
const repo=path.resolve(__dirname,'..'),d=createDummy({gender:'women'}),slug='horizon-2031-women';
const config={schemaVersion:2,slug,competition:{},structure:d.structure,hero:d.hero,seo:d.seo,data:'data.json',modules:[{id:'rosters',source:'rosters.json'},{id:'qualifications',source:'qualifications.json'}]};
for(const key of ['competitionId','displayName','officialName','gender','competitionFamily']){config.competition[key]=d[key];delete d[key];}
config.competition.season='2031';delete config.seo.canonical;
for(const key of ['structure','hero','seo'])delete d[key];
const files={'config.json':config,'rosters.json':d.rosters,'qualifications.json':d.qualifications};delete d.rosters;delete d.qualifications;files['data.json']=d;
const dir=path.join(__dirname,'fixtures/competitions',slug);fs.mkdirSync(dir,{recursive:true});
for(const [name,data] of Object.entries(files))fs.writeFileSync(path.join(dir,name),JSON.stringify(data,null,2)+'\n');
const shared=fs.readFileSync(path.join(repo,'competition.html'),'utf8');
fs.writeFileSync(path.join(__dirname,'competition-page-v2-config-smoke.html'),shared.replace('<title>배구 대회 | K-Volley Lab</title>','<title>KVL V2 config 검증</title><meta name="robots" content="noindex,nofollow,noarchive">').replace("production:true,deferRender:true,collectionRoot:'/data/competitions/'","production:false,deferRender:true,collectionRoot:'/tests/fixtures/competitions/'"));
console.log('Exported Horizon config/data/modules and one shared validation entry');
