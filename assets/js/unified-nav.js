(()=>{
  const MATCH_PREFIX='KVL-M-2026-VNL-';
  const toCanonical=id=>{const v=String(id||'');const m=v.match(/^KVL-M-(\d{6})$/);return m?`${MATCH_PREFIX}${m[1]}`:v};
  const toLegacy=id=>{const v=String(id||'');const m=v.match(/^KVL-M-2026-VNL-(\d{6})$/);return m?`KVL-M-${m[1]}`:v};
  window.KVLMatchIds={toCanonical,toLegacy};

  const favoritesKey='kvl.favoriteMatches.v1';
  try{
    const saved=JSON.parse(localStorage.getItem(favoritesKey)||'[]');
    const migrated=[...new Set(saved.map(toCanonical))];
    if(JSON.stringify(saved)!==JSON.stringify(migrated))localStorage.setItem(favoritesKey,JSON.stringify(migrated));
  }catch{}

  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const params=new URLSearchParams(location.search);
  const matchId=params.get('id');
  if(path==='match.html'&&matchId){
    const canonical=toCanonical(matchId);
    const legacy=toLegacy(canonical);
    window.KVL_CANONICAL_MATCH_ID=canonical;
    if(legacy!==matchId){
      const temporary=new URL(location.href);
      temporary.searchParams.set('id',legacy);
      history.replaceState(history.state,'',temporary);
      setTimeout(()=>{const restored=new URL(location.href);restored.searchParams.set('id',canonical);history.replaceState(history.state,'',restored)},0);
    }
  }

  const rewriteMatchLinks=root=>(root||document).querySelectorAll?.('a[href*="match.html?id="]').forEach(anchor=>{
    try{
      const url=new URL(anchor.getAttribute('href'),location.href);
      const id=url.searchParams.get('id');
      if(!id)return;
      url.searchParams.set('id',toCanonical(id));
      anchor.setAttribute('href',`${url.pathname.split('/').pop()}${url.search}${url.hash}`);
    }catch{}
  });
  rewriteMatchLinks(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)rewriteMatchLinks(node)}))).observe(document.documentElement,{childList:true,subtree:true});

  document.querySelectorAll('body>.site-header,body>.kvl-unified-header').forEach(header=>header.style.display='none');

  if(!document.querySelector('link[href*="kvl-global-sidebar-v1.css"]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='assets/css/kvl-global-sidebar-v1.css?v=20260722-7';
    document.head.appendChild(link);
  }
  if(!document.querySelector('script[src*="kvl-global-sidebar-v1.js"]')){
    const script=document.createElement('script');
    script.src='assets/js/kvl-global-sidebar-v1.js?v=20260722-7';
    script.defer=true;
    document.head.appendChild(script);
  }

  if(path==='vnl.html'&&!document.querySelector('.kvl-season-context')){
    const season=params.get('season')||'2026';
    if(!params.get('season')){
      const normalized=new URL(location.href);
      normalized.searchParams.set('season',season);
      history.replaceState(history.state,'',normalized);
    }
    const context=document.createElement('div');
    context.className='kvl-season-context';
    context.innerHTML=`<div class="kvl-season-breadcrumb"><a href="competition.html">Competition</a><span>›</span><span>VNL Men</span><span>›</span><strong>${season}</strong></div><div class="kvl-season-switcher"><span>SEASON</span><a class="active" href="vnl.html?season=2026">2026</a></div>`;
    const main=document.querySelector('main');
    if(main)main.insertAdjacentElement('beforebegin',context);
    document.querySelectorAll('a[href="schedules.html?tournament=vnl"]').forEach(a=>a.href=`schedules.html?competition=vnl&season=${season}`);
    document.querySelectorAll('a[href*="schedules.html?tournament=vnl&team="]').forEach(a=>{
      const url=new URL(a.getAttribute('href'),location.href);
      a.href=`schedules.html?competition=vnl&season=${season}&team=${encodeURIComponent(url.searchParams.get('team')||'')}`;
    });
  }
})();