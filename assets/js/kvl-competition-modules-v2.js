/* DATA ONLY extensions. A module returns declared schema fields, never markup. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLCompetitionModulesV2=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const allowed=new Set(['qualifications','rosters','resources','focus','matches','standings','finalRanking']);
const registry=new Map(),copy=value=>JSON.parse(JSON.stringify(value));
function register(id,{fields,normalize}){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||registry.has(id))throw Error('Invalid or duplicate module: '+id);
 if(!Array.isArray(fields)||!fields.length||fields.some(key=>!allowed.has(key))||typeof normalize!=='function')throw Error('Invalid DATA ONLY module contract');
 registry.set(id,{fields:[...fields],normalize});
}
function apply(data,definitions=[],payloads=[]){
 let result=copy(data);const claimed=new Set();
 if(definitions.length!==payloads.length)throw Error('Missing module payload');
 definitions.forEach((definition,index)=>{
  const module=registry.get(definition.id);if(!module)throw Error('Unregistered module: '+definition.id);
  for(const key of module.fields)if(claimed.has(key)||Object.hasOwn(result,key))throw Error('Module field already supplied: '+key);
  const patch=module.normalize(copy(payloads[index]),copy(definition.options||{}),copy(result));
  if(!patch||Array.isArray(patch)||typeof patch!=='object'||Object.keys(patch).some(key=>!module.fields.includes(key))||module.fields.some(key=>!Object.hasOwn(patch,key)))throw Error('Module returned undeclared or missing fields');
  for(const key of module.fields)claimed.add(key);
  result={...result,...copy(patch)};
 });
 return result;
}
for(const field of ['qualifications','rosters','resources','focus'])register(field,{fields:[field],normalize:payload=>{
 const array=['qualifications','resources'].includes(field);
 if(array?!Array.isArray(payload):!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('Invalid '+field+' module data');
 return {[field]:payload};
}});
return {register,apply,has:id=>registry.has(id),ids:()=>[...registry.keys()]};
});
