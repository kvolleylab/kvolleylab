#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),contract=require('../assets/js/kvl-competition-data-v2.js');
const root=path.resolve(__dirname,'..');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function build(data,{validation=false}={}){
 const errors=contract.validate(data,{production:!validation});if(errors.length)throw Error(errors.join('\n'));
 const d=contract.normalize(data),title=d.seo?.title||`${d.displayName} | K-Volley Lab`,values={TITLE:esc(title),DESCRIPTION:esc(d.seo?.description||d.officialName),CANONICAL:esc(d.seo?.canonical||''),HERO:esc(d.hero?.pcImage||''),ROBOTS:validation?'<meta name="robots" content="noindex,nofollow,noarchive">':'',CONFIG:json({production:!validation}),DATA:json(d)};
 return fs.readFileSync(path.join(root,'templates/competition-page-production-v2.html'),'utf8').replace(/\{\{([A-Z]+)\}\}/g,(_,key)=>values[key]);
}
if(require.main===module){
 const args=process.argv.slice(2),get=flag=>{const i=args.indexOf(flag);return i<0?null:args[i+1];};
 try{const input=get('--data'),output=get('--out');if(!input||!output)throw Error('Usage: node scripts/create-competition-v2.cjs --data competition.json --out competition.html [--adapter normalizer.cjs] [--validation]');
  let d=JSON.parse(fs.readFileSync(input,'utf8'));if(get('--adapter'))d=require(path.resolve(get('--adapter')))(d);
  const html=build(d,{validation:args.includes('--validation')});fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});fs.writeFileSync(output,html,{flag:'wx'});process.stdout.write('Created '+output+'\n');
 }catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
module.exports={build};
