/* Loads normalized competition data into the same shared shell/controller/components. */
(async()=>{'use strict';
 const body=document.body,config=window.KVL_COMPETITION_PAGE_V2||{};
 try{
  let data=window.KVL_COMPETITION_V2_DATA;
  if(config.source){const response=await fetch(new URL(config.source,location.href));if(!response.ok)throw Error('Competition data: '+response.status);data=await response.json();}
  if(typeof window.KVLCompetitionAdapterV2==='function')data=await window.KVLCompetitionAdapterV2(data);
  const api=window.KVLCompetitionDataV2,errors=api.validate(data||{},{production:config.production===true});if(errors.length)throw Error(errors.join('; '));
  window.KVL_COMPETITION_V2_DATA=api.normalize(data);body.dataset.kvlRenderState='loading';
  window.KVLCompetitionShellV2.ensureShell();window.KVLCompetitionTemplateV2.apply();window.KVLCompetitionComponentsV2.render();body.dataset.kvlRenderState='ready';
 }catch(error){console.error(error);body.dataset.kvlRenderState='error';const target=document.querySelector('[data-kvl-shell]');target.hidden=false;target.textContent='대회 정보를 불러오지 못했습니다.';target.setAttribute('role','alert');}
})();
