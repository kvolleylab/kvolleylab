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
  if(currentPath==='international-competition-avc-men-continental-2026.html'&&!document.querySelector('script[src*="avc-men-live-status-runtime.js"]')){
    const liveStatusRuntime=document.createElement('script');
    liveStatusRuntime.src='assets/js/avc-men-live-status-runtime.js?v=20260904-1';
    liveStatusRuntime.defer=true;
    document.head.appendChild(liveStatusRuntime);
  }
  if(window.KVLSchoolLogos)return;
  const MANIFEST='data/master/school_logo_manifest_2026.json?v=20261027-1';
  const normalize=value=>String(value||'').trim().replace(/\s+/g,'');
  const teamFromLogo=el=>{
    const aria=el.getAttribute('aria-label')||'';
    if(aria)return aria.replace(/\s*로고\s*(자리)?\s*$/,'').trim();
    const card=el.closest('.sc-team-card,.sc-team,.sc-horizontal-side,.sc-champion,.dc-ranking-list p');
    return card?.textContent?.replace(/[🥇🥈🥉·]/g,' ').trim()||'';
  };
  const fallbackInitials=name=>String(name||'팀').replace(/고등학교|중학교|여자|사범대학부속|스포츠과학|체육|전자/g,'').slice(0,2)||'팀';
  // Display assets and location labels never create or replace routing/Master IDs.
  const api={manifest:null,canonical:name=>String(name||'').trim(),entryFor:()=>null,pathFor:()=>'',profileName:name=>name,decorate:data=>data,refresh:()=>{}};
  window.KVLSchoolLogos=api;
  api.ready=fetch(MANIFEST,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(manifest=>{
    const aliases={...manifest.aliases,...manifest.displayAliases},teams=manifest.teams||{},base=manifest.basePath||'assets/images/school-logos/';
    const names=new Map(Object.keys(teams).map(name=>[normalize(name),name]));
    Object.entries(teams).forEach(([name,entry])=>[entry.school_name,...(entry.aliases||[])].filter(Boolean).forEach(alias=>names.set(normalize(alias),name)));
    Object.entries(aliases).forEach(([alias,name])=>names.set(normalize(alias),names.get(normalize(name))||name));
    const canonical=name=>names.get(normalize(name))||String(name||'').trim();
    const entryFor=(name,region,competitionId)=>{
      const scoped=manifest.competitionAliases?.[competitionId]||{};
      const alias=Object.keys(scoped).find(alias=>normalize(alias)===normalize(name));
      const entry=teams[canonical(alias?scoped[alias]:name)]||null;
      // A duplicate school name from a different represented province stays unassigned.
      return entry&&region&&entry.province&&normalize(region)!==normalize(entry.province)&&!normalize(region).startsWith(normalize(entry.province))?null:entry;
    };
    const pathFor=(name,entry)=>{
      if(typeof entry==='string')return entry.includes('/')?entry:`${base}${entry}`;
      const path=entry?.asset_path||entry?.path||entry?.file||'';
      return path?(path.includes('/')?path:`${base}${path}`):'';
    };
    const profileName=name=>entryFor(name)?.display_name||name;
    const decorate=data=>{
      if(String(data?.competitionFamily||data?.family||'').toLowerCase()!=='domestic')return data;
      return {...data,participants:(data.participants||[]).map(team=>{
        const entry=entryFor(team.fullName||team.name,team.region,data.competitionId)||entryFor(team.name,team.region,data.competitionId);
        if(!entry)return team;
        const src=pathFor(team.name,entry);
        return {...team,...(src?{logo:src}:{}),schoolDisplayName:entry.display_name||entry.school_name,schoolRegion:entry.location_short||'',logoVerifiedAt:entry.verified_at};
      })};
    };
    const enhance=root=>{
      const elements=[...(root.matches?.('.sc-team-logo')?[root]:[]),...(root.querySelectorAll?.('.sc-team-logo')||[])];
      elements.forEach(el=>{
        const name=teamFromLogo(el),entry=entryFor(name),src=pathFor(name,entry);
        if(el.dataset.logoChecked===name)return;
        el.dataset.logoChecked=name;
        if(!src){if(el.classList.contains('has-school-logo')){el.classList.remove('has-school-logo');el.textContent=fallbackInitials(name);}return;}
        el.classList.add('has-school-logo');
        const img=document.createElement('img');img.src=src;img.alt=`${canonical(name)} 로고`;img.loading='lazy';el.replaceChildren(img);
        img.addEventListener('error',()=>{el.classList.remove('has-school-logo');el.textContent=fallbackInitials(name)},{once:true});
      });
    };
    enhance(document);
    new MutationObserver(records=>records.forEach(record=>{if(record.type==='attributes')enhance(record.target);else record.addedNodes.forEach(node=>{if(node.nodeType===1)enhance(node)});})).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label']});
    Object.assign(api,{manifest,canonical,entryFor,pathFor,profileName,decorate,refresh:()=>enhance(document)});
    window.dispatchEvent(new CustomEvent('kvl:school-logos-ready'));
    return api;
  }).catch(()=>api);
})();
