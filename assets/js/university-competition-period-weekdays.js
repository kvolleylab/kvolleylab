(()=>{
'use strict';
const config={
  'gosung-2026':'2026-06-25(목) ~ 2026-07-03(금) · 경남 고성',
  'danyang-2026':'2026-08-12(수) ~ 2026-08-20(목) · 충북 단양'
};
const value=config[document.body?.dataset.competition];
if(!value)return;
const apply=()=>{
  const meta=document.getElementById('cdMeta');
  if(meta&&meta.textContent!==value)meta.textContent=value;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
const meta=document.getElementById('cdMeta');
if(meta)new MutationObserver(apply).observe(meta,{childList:true,subtree:true,characterData:true});
})();
