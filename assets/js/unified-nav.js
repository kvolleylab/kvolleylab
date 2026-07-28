(()=>{
  const PRIVATE_REVIEW_MODE=true;
  if(!document.querySelector('link[href*="pretendard-global.css"]')){const fontLink=document.createElement('link');fontLink.rel='stylesheet';fontLink.href='assets/css/pretendard-global.css?v=20260725-1';document.head.appendChild(fontLink)}
  if(PRIVATE_REVIEW_MODE){
    const robotsContent='noindex,nofollow,noarchive,nosnippet,noimageindex';
    const ensureMeta=(name,content)=>{
      let meta=document.head.querySelector(`meta[name="${name}"]`);
      if(!meta){meta=document.createElement('meta');meta.name=name;document.head.appendChild(meta)}
      meta.content=content;
    };
    ensureMeta('robots',robotsContent);
    ensureMeta('googlebot',robotsContent);
    ensureMeta('bingbot',robotsContent);
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach(script=>script.remove());
    document.documentElement.dataset.siteMode='private-review';
    addEventListener('DOMContentLoaded',()=>{
      if(!document.querySelector('.kvl-review-mode-badge')){
        document.body.insertAdjacentHTML('beforeend','<div class="kvl-review-mode-badge" role="status" style="position:fixed;right:14px;bottom:14px;z-index:1900;padding:7px 10px;border:1px solid #e4c76d;border-radius:999px;background:#fff8df;color:#72520a;font:800 11px Pretendard,Arial,sans-serif;box-shadow:0 5px 16px rgba(15,35,63,.12)">비공개 · 데이터 검수 중</div>');
      }
    },{once:true});
  }

  const MATCH_PREFIX='KVL-M-2026-VNL-';
  const toCanonical=id=>{const v=String(id||'');const m=v.match(/^KVL-M-(\d{6})$/);return m?`${MATCH_PREFIX}${m[1]}`:v};
  const toLegacy=id=>{const v=String(id||'');const m=v.match(/^KVL-M-2026-VNL-(\d{6})$/);return m?`KVL-M-${m[1]}`:v};
  window.KVLMatchIds={toCanonical,toLegacy};

  const favoritesKey='kvl.favoriteMatches.v1';
  try{const saved=JSON.parse(localStorage.getItem(favoritesKey)||'[]');const migrated=[...new Set(saved.map(toCanonical))];if(JSON.stringify(saved)!==JSON.stringify(migrated))localStorage.setItem(favoritesKey,JSON.stringify(migrated))}catch{}

  document.documentElement.classList.add('kvl-sidebar-shell-ready');
  try{document.documentElement.classList.toggle('kvl-sidebar-pref-collapsed',localStorage.getItem('kvl.sidebarCollapsed.v1')==='1')}catch{}

  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const params=new URLSearchParams(location.search);
  const matchId=params.get('id');
  if(path==='match.html'&&matchId){
    const canonical=toCanonical(matchId);
    const legacy=toLegacy(canonical);
    window.KVL_CANONICAL_MATCH_ID=canonical;
    if(legacy!==matchId){
      const temporary=new URL(location.href);temporary.searchParams.set('id',legacy);history.replaceState(history.state,'',temporary);
      setTimeout(()=>{const restored=new URL(location.href);restored.searchParams.set('id',canonical);history.replaceState(history.state,'',restored)},0);
    }
  }

  const rewriteMatchLinks=root=>(root||document).querySelectorAll?.('a[href*="match.html?id="]').forEach(anchor=>{
    try{const url=new URL(anchor.getAttribute('href'),location.href);const id=url.searchParams.get('id');if(!id)return;url.searchParams.set('id',toCanonical(id));anchor.setAttribute('href',`${url.pathname.split('/').pop()}${url.search}${url.hash}`)}catch{}
  });
  rewriteMatchLinks(document);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)rewriteMatchLinks(node)}))).observe(document.documentElement,{childList:true,subtree:true});

  document.querySelectorAll('body>.site-header,body>.kvl-unified-header').forEach(header=>header.style.display='none');
  if(!document.querySelector('link[href*="kvl-global-sidebar-v1.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/kvl-global-sidebar-v1.css?v=20260722-10';document.head.appendChild(link)}
  if(!document.querySelector('link[href*="kvl-global-sidebar-submenus.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/kvl-global-sidebar-submenus.css?v=20260725-1';document.head.appendChild(link)}
  if(!document.querySelector('script[src*="kvl-global-sidebar-v1.js"]')){const script=document.createElement('script');script.src='assets/js/kvl-global-sidebar-v1.js?v=20260725-1';script.defer=true;document.head.appendChild(script)}

  if(path==='vnl.html'){
    if(!document.querySelector('link[href*="competition-hub.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/competition-hub.css?v=20260728-1';document.head.appendChild(link)}

    const applyVnlCompetitionDesign=()=>{
      const main=document.querySelector('main');
      if(!main||main.dataset.competitionDesign==='1')return;
      main.dataset.competitionDesign='1';
      main.classList.add('competition-hub');

      const hero=document.querySelector('.vnl-hero');
      if(hero){
        hero.classList.add('competition-hero');
        if(!hero.querySelector(':scope > .competition-hero-content')){
          const content=document.createElement('div');
          content.className='competition-hero-content';
          [...hero.children].forEach(child=>content.appendChild(child));
          hero.appendChild(content);
        }
        hero.querySelector('.vnl-meta')?.classList.add('competition-meta');
      }

      const tabsWrap=document.querySelector('.vnl-tabs-wrap');
      const tabs=document.querySelector('.vnl-tabs');
      tabsWrap?.classList.add('competition-tabs-wrap');
      tabs?.classList.add('competition-tabs');
      if(tabs){
        const order=['overview','schedule','standings','teams','entries','players','resources'];
        const labels={overview:'개요',schedule:'일정·결과',standings:'순위',teams:'참가팀',entries:'엔트리',players:'선수',resources:'자료'};
        const links=new Map([...tabs.querySelectorAll('a[href^="#"]')].map(a=>[a.getAttribute('href').slice(1),a]));
        order.forEach(id=>{const link=links.get(id);if(link){link.textContent=labels[id];tabs.appendChild(link)}});
      }

      document.querySelectorAll('.vnl-section').forEach(section=>section.classList.add('competition-section'));
      document.querySelectorAll('.vnl-section-head').forEach(head=>head.classList.add('competition-section-head'));
      document.querySelectorAll('.quick-grid').forEach(grid=>grid.classList.add('competition-summary-grid'));
      document.querySelectorAll('.hub-card').forEach(card=>card.classList.add('competition-summary-card'));
      document.querySelectorAll('.team-grid').forEach(grid=>grid.classList.add('competition-team-grid'));
      document.querySelectorAll('.team-card').forEach(card=>card.classList.add('competition-team-card'));

      const styleStandings=()=>{
        document.querySelectorAll('.vnl-standings-wrap').forEach(wrap=>wrap.classList.add('competition-table-wrap'));
        document.querySelectorAll('.vnl-standings-table').forEach(table=>table.classList.add('competition-table'));
      };
      styleStandings();
      const standingsArea=document.querySelector('#vnlStandingsArea');
      if(standingsArea)new MutationObserver(styleStandings).observe(standingsArea,{childList:true,subtree:true});
    };

    if(document.readyState==='loading')addEventListener('DOMContentLoaded',applyVnlCompetitionDesign,{once:true});
    else applyVnlCompetitionDesign();

    if(!document.querySelector('.kvl-season-context')){
      const season=params.get('season')||'2026';
      if(!params.get('season')){const normalized=new URL(location.href);normalized.searchParams.set('season',season);history.replaceState(history.state,'',normalized)}
      const context=document.createElement('div');
      context.className='kvl-season-context';
      context.innerHTML=`<div class="kvl-season-breadcrumb"><a href="competition.html">Competition</a><span>›</span><span>VNL Men</span><span>›</span><strong>${season}</strong></div><div class="kvl-season-switcher"><span>SEASON</span><a class="active" href="vnl.html?season=2026">2026</a></div>`;
      const main=document.querySelector('main');if(main)main.insertAdjacentElement('beforebegin',context);
      document.querySelectorAll('a[href="schedules.html?tournament=vnl"]').forEach(a=>a.href=`schedules.html?competition=vnl&season=${season}`);
      document.querySelectorAll('a[href*="schedules.html?tournament=vnl&team="]').forEach(a=>{const url=new URL(a.getAttribute('href'),location.href);a.href=`schedules.html?competition=vnl&season=${season}&team=${encodeURIComponent(url.searchParams.get('team')||'')}`});
    }
  }
})();