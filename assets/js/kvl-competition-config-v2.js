/* Competition Engine V2: config/data boundary, shared by browser and CLI. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLCompetitionConfigV2=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const metadata=['competitionId','displayName','officialName','season','gender','competitionFamily'];
const reserved=[...metadata,'structure','hero','seo'];
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function localJSON(value){return typeof value==='string'&&/^[a-z0-9][a-z0-9._/-]*\.json$/i.test(value)&&!value.split('/').some(part=>!part||part==='.'||part==='..');}
function validate(config,{slug}={}){
 const c=config||{},errors=[];
 if(c.schemaVersion!==2)errors.push('config.schemaVersion must be 2');
 if(!slugPattern.test(c.slug||''))errors.push('config.slug requires lowercase letters, digits and hyphens');
 if(slug&&c.slug!==slug)errors.push('config.slug disagrees with URL');
 if(!isObject(c.competition))errors.push('config.competition is required');
 if(isObject(c.competition)&&Object.keys(c.competition).some(key=>!metadata.includes(key)))errors.push('Unknown config.competition field');
 for(const key of metadata)if(c.competition?.[key]===undefined||!String(c.competition[key]).trim())errors.push('config.competition.'+key+' is required');
 if(!['avc','fivb','domestic'].includes(c.competition?.competitionFamily))errors.push('unsupported competition family');
 if(!isObject(c.structure))errors.push('config.structure is required');
 if(!localJSON(c.data))errors.push('config.data must be a relative JSON file');
 if(c.modules!==undefined&&!Array.isArray(c.modules))errors.push('config.modules must be an array');
 const ids=new Set();
 for(const m of Array.isArray(c.modules)?c.modules:[]){
  if(!m||!slugPattern.test(m.id||'')||ids.has(m.id))errors.push('modules require unique IDs');
  ids.add(m?.id);if(!localJSON(m?.source))errors.push('module source must be a relative JSON file');
  if(m?.options!==undefined&&!isObject(m.options))errors.push('module options must be an object');
 }
 return errors;
}
function locationFor(href,collectionRoot){
 const page=new URL(href),slug=page.searchParams.get('competition');
 if(!slug||!slugPattern.test(slug))throw Error('Missing or invalid competition slug');
 const root=new URL(collectionRoot,page);if(root.origin!==page.origin||!root.pathname.endsWith('/'))throw Error('Invalid competition collection');
 const base=new URL(slug+'/',root);
 return {slug,base:base.href,configURL:new URL('config.json',base).href,canonical:page.origin+page.pathname+'?competition='+encodeURIComponent(slug)};
}
function assemble(config,data,{slug,canonical}={}){
 const errors=validate(config,{slug});if(errors.length)throw Error(errors.join('; '));
 if(!isObject(data))throw Error('Competition data must be an object');
 for(const key of reserved)if(Object.hasOwn(data,key))throw Error(key+' belongs in config, not data');
 for(const key of ['participants','matches','finalRanking','qualifications','resources'])if(data[key]!==undefined&&!Array.isArray(data[key]))throw Error(key+' must be an array');
 const d=JSON.parse(JSON.stringify({...data,...config.competition,structure:config.structure,hero:config.hero||{},seo:{...config.seo,canonical}}));
 return d;
}
return {validate,assemble,locationFor,localJSON,metadata};
});
