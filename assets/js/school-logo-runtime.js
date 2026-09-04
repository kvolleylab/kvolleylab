(()=>{
  if(!document.querySelector('link[href*="kvl-competition-standard.css"]')){
    const competitionStyle=document.createElement('link');
    competitionStyle.rel='stylesheet';
    competitionStyle.href='assets/css/kvl-competition-standard.css?v=20260904-1';
    document.head.appendChild(competitionStyle);
  }
  const currentPath=(location.pathname.split('/').pop()||'').toLowerCase();
  if(currentPath==='international-competition-avc-women-continental-2026.html'&&!document.querySelector('script[src*="avc-women-combined-ranking-runtime.js"]')){
    const rankingRuntime=document.createElement('script');
    rankingRuntime.src='assets/js/avc-women-combined-ranking-runtime.js?v=20260904-3';
    rankingRuntime.defer=true;
    document.head.appendChild(rankingRuntime);
  }
  if(currentPath==='international-competition-avc-men-continental-2026.html'&&!document.querySelector('script[src*="avc-men-combined-ranking-runtime.js"]')){
    const rankingRuntime=document.createElement('script');
    rankingRuntime.src='assets/js/avc-men-combined-ranking-runtime.js?v=20260904-1';
    rankingRuntime.defer=true;
    document.head.appendChild(rankingRuntime);
  }
  const MANIFEST='data/master/school_logo_manifest_2026.json?v=20260802-1';
  const normalize=value=>String(value||'').trim().replace(/\s+/g,'');
  const teamFromLogo=el=>{
    const aria=el.getAttribute('aria-label')||'';
    if(aria)return aria.replace(/\s*로고\s*(자리)?\s*$/,'').trim();
    const card=el.closest('.sc-team-card,.sc-team,.sc-horizontal-side,.sc-champion,.dc-ranking-list p');
    return card?.textContent?.replace(/[🥇🥈🥉·]/g,' ').trim()||'';
  };
  const fallbackInitials=name=>String(name||'팀').replace(/고등학교|중학교|여자|사범대학부속|스포츠과학|체육|전자/g,'').slice(0,2)||'팀';
  fetch(MANIFEST,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(manifest=>{
    const aliases=manifest.aliases||{},teams=manifest.teams||{},base=manifest.basePath||'assets/images/school-logos/';
    const canonical=name=>aliases[name]||name;
    const entryFor=name=>{
      const clean=canonical(String(name||'').trim());
      return teams[clean]||teams[normalize(clean)]||null;
    };
    const pathFor=(name,entry)=>{
      if(typeof entry==='string')return entry.includes('/')?entry:`${base}${entry}`;
      const path=entry?.asset_path||entry?.path||entry?.file||'';
      return path?(path.includes('/')?path:`${base}${path}`):'';
    };
    const enhance=root=>{
      root.querySelectorAll?.('.sc-team-logo').forEach(el=>{
        if(el.dataset.logoChecked==='1')return;
        el.dataset.logoChecked='1';
        const name=teamFromLogo(el),entry=entryFor(name),src=pathFor(name,entry);
        if(!src)return;
        el.classList.add('has-school-logo');
        el.innerHTML=`<img src="${src}" alt="${canonical(name)} 로고" loading="lazy">`;
        const img=el.querySelector('img');
        img.addEventListener('error',()=>{el.classList.remove('has-school-logo');el.textContent=fallbackInitials(name)},{once:true});
      });
    };
    enhance(document);
    new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)enhance(node)}))).observe(document.body,{childList:true,subtree:true});
    window.KVLSchoolLogos={manifest,canonical,entryFor,pathFor,refresh:()=>enhance(document)};
  }).catch(()=>{});
})();