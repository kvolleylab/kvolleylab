/* Loads normalized competition data into the same shared shell/controller/components. */
(async()=>{'use strict';
 const body=document.body,config=window.KVL_COMPETITION_PAGE_V2||{};
 try{
  let data=window.KVL_COMPETITION_V2_DATA;
  const readJSON=async url=>{const response=await fetch(url);if(!response.ok)throw Error('Competition JSON: '+response.status);return response.json();};
  if(config.collectionRoot){
   const contract=window.KVLCompetitionConfigV2,modules=window.KVLCompetitionModulesV2;
   const route=contract.locationFor(location.href,config.collectionRoot);
   const definition=await readJSON(route.configURL),errors=contract.validate(definition,{slug:route.slug});
   if(errors.length)throw Error(errors.join('; '));
   for(const module of definition.modules||[])if(!modules.has(module.id))throw Error('Unregistered module: '+module.id);
   const definitions=definition.modules||[];
   const [source,...payloads]=await Promise.all([definition.data,...definitions.map(m=>m.source)].map(file=>readJSON(new URL(file,route.base))));
   data=modules.apply(contract.assemble(definition,source,route),definitions,payloads);
  }
  if(config.source){const response=await fetch(new URL(config.source,location.href));if(!response.ok)throw Error('Competition data: '+response.status);data=await response.json();}
  if(typeof window.KVLCompetitionAdapterV2==='function')data=await window.KVLCompetitionAdapterV2(data);
  const api=window.KVLCompetitionDataV2,errors=api.validate(data||{},{production:config.production===true});if(errors.length)throw Error(errors.join('; '));
  window.KVL_COMPETITION_V2_DATA=api.normalize(data);body.dataset.kvlRenderState='loading';
  window.KVLCompetitionShellV2.ensureShell();window.KVLCompetitionTemplateV2.apply();window.KVLCompetitionComponentsV2.render();
  if(config.collectionRoot){
   const d=window.KVL_COMPETITION_V2_DATA,title=d.seo.title||`${d.displayName} | K-Volley Lab`;
   for(const [property,value] of Object.entries({'og:type':'website','og:title':title,'og:description':d.seo.description||d.officialName,'og:url':d.seo.canonical,'og:image':d.hero.pcImage?new URL(d.hero.pcImage,location.href).href:''})){
    let meta=document.querySelector(`meta[property="${property}"]`);if(!meta){meta=document.createElement('meta');meta.setAttribute('property',property);document.head.appendChild(meta);}meta.content=value;
   }
   let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}canonical.href=d.seo.canonical;
  }
  document.querySelector('[data-kvl-shell]').hidden=false;body.dataset.kvlRenderState='ready';
 }catch(error){console.error(error);body.dataset.kvlRenderState='error';const target=document.querySelector('[data-kvl-shell]');target.hidden=false;target.textContent='대회 정보를 불러오지 못했습니다. 주소를 확인해 주세요.';target.setAttribute('role','alert');
  let robots=document.querySelector('meta[name="robots"]');if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}robots.content='noindex,nofollow,noarchive';
 }finally{document.getElementById('kvlCompetitionLoading')?.remove();}
})();
