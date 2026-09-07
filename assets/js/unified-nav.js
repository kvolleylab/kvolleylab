(()=>{
  const PRIVATE_REVIEW_MODE=true;
  if(!document.querySelector('link[href*="pretendard-global.css"]')){const fontLink=document.createElement('link');fontLink.rel='stylesheet';fontLink.href='assets/css/pretendard-global.css?v=20260725-1';document.head.appendChild(fontLink)}
  if(!document.querySelector('link[href*="school-logo-runtime.css"]')){const logoStyle=document.createElement('link');logoStyle.rel='stylesheet';logoStyle.href='assets/css/school-logo-runtime.css?v=20260903-3';document.head.appendChild(logoStyle)}
  if(!document.querySelector('script[src*="school-logo-runtime.js"]')){const logoScript=document.createElement('script');logoScript.src='assets/js/school-logo-runtime.js?v=20260802-1';logoScript.defer=true;document.head.appendChild(logoScript)}
  if(!document.querySelector('script[src*="avc-continental-gender-runtime.js"]')){const genderScript=document.createElement('script');genderScript.src='assets/js/avc-continental-gender-runtime.js?v=20260903-2';genderScript.defer=true;document.head.appendChild(genderScript)}
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

  if(path==='international-competition-avc-women-continental-2026.html'){
    const ensureAvcWomenVenueKpi=()=>{
      const kpis=document.querySelector('#overview .avc-kpis');
      if(!kpis)return;
      if(!document.getElementById('kvlAvcWomenVenueKpi')){
        const card=document.createElement('div');
        card.id='kvlAvcWomenVenueKpi';
        card.className='kvl-avc-venue-kpi';
        card.setAttribute('aria-label','대회 장소: 중국 톈진 올림픽 센터 체육관');
        card.innerHTML='<span>장소</span><strong>중국 톈진</strong><small>올림픽 센터 체육관</small>';
        kpis.appendChild(card);
      }
      if(!document.getElementById('kvlAvcWomenVenueKpiStyle')){
        const style=document.createElement('style');
        style.id='kvlAvcWomenVenueKpiStyle';
        style.textContent=`
          body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi{box-sizing:border-box;padding:22px;border:1px solid var(--kvl-women-line,#EDBED0);border-radius:18px;background:var(--kvl-women-soft-2,#FFF8FB)}
          body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi span,body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi small{display:block;color:#748397;font-size:inherit;font-weight:400;line-height:1.35}
          body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi strong{display:block;margin-top:10px;color:var(--kvl-women-dark,#A43F68);font-size:20px;line-height:1.35;word-break:keep-all}
          body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi small{margin-top:3px;white-space:nowrap}
          @media (min-width:901px){body[data-avc-gender="women"] #overview .avc-kpis{grid-template-columns:repeat(5,minmax(0,1fr))!important}}
          @media (min-width:681px) and (max-width:900px){body[data-avc-gender="women"] #overview .avc-kpis{grid-template-columns:repeat(3,minmax(0,1fr))!important}body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi{grid-column:span 2}}
          @media (max-width:680px){body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi{grid-column:1/-1;min-height:92px;padding:13px 12px;border-radius:14px}body[data-avc-gender="women"] #overview .avc-kpis .kvl-avc-venue-kpi strong{font-size:20px;line-height:1.2;letter-spacing:-.035em;white-space:nowrap}}
        `;
        document.head.appendChild(style);
      }
    };

    const ensureAvcWomenUiStyle=()=>{
      if(document.getElementById('kvlAvcWomenUiPolishStyle'))return;
      const style=document.createElement('style');
      style.id='kvlAvcWomenUiPolishStyle';
      style.textContent=`
        body[data-avc-gender="women"] #overview .cd-calendar-head{align-items:flex-start!important;justify-content:flex-start!important;flex-direction:column!important;gap:4px!important}
        body[data-avc-gender="women"] #overview .cd-calendar-head>p{margin:0!important;text-align:left!important}
        body[data-avc-gender="women"] #groups .avc-combined-head{align-items:flex-start!important;justify-content:flex-start!important;flex-direction:column!important;gap:4px!important}
        body[data-avc-gender="women"] #groups .avc-combined-head>div{width:100%!important}
        body[data-avc-gender="women"] #groups .avc-combined-head .eyebrow,body[data-avc-gender="women"] #groups .avc-combined-head h3,body[data-avc-gender="women"] #groups .avc-combined-head>p{margin-left:0!important;margin-right:0!important;text-align:left!important;white-space:nowrap!important}
        body[data-avc-gender="women"] #groups .avc-combined{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
        body[data-avc-gender="women"] #groups .kvl-combined-table{min-width:870px;background:#fff}
        body[data-avc-gender="women"] #groups .kvl-combined-line{display:grid;grid-template-columns:64px 30px 118px 96px 90px 60px 104px 104px 78px;gap:8px;align-items:center;min-height:46px;padding:7px 13px;border-top:1px solid #f4e3ea;box-sizing:border-box}
        body[data-avc-gender="women"] #groups .kvl-combined-line:first-child{border-top:0}
        body[data-avc-gender="women"] #groups .kvl-combined-line.is-head{min-height:38px;background:var(--kvl-women-soft,#FFF2F7);color:#765563;font-size:10px;font-weight:1000}
        body[data-avc-gender="women"] #groups .kvl-combined-line.is-korea{background:var(--kvl-women-soft,#FFF2F7)}
        body[data-avc-gender="women"] #groups .kvl-combined-line img{display:block;width:28px;height:19px;object-fit:contain}
        body[data-avc-gender="women"] #groups .kvl-combined-rank{color:var(--kvl-women-dark,#A43F68);font-size:12px;font-weight:1000;white-space:nowrap}
        body[data-avc-gender="women"] #groups .kvl-combined-team{color:#17365d;font-size:13px;font-weight:900;white-space:nowrap}
        body[data-avc-gender="women"] #groups .kvl-combined-stat{color:#708078;font-size:11px;font-weight:800;text-align:center;white-space:nowrap}
        body[data-avc-gender="women"] #groups .kvl-combined-result{display:inline-flex;align-items:center;justify-content:center;min-height:26px;padding:4px 7px;border-radius:999px;background:#eef8f1;color:#166534;font-size:10px;font-weight:1000;white-space:nowrap;box-sizing:border-box}
        body[data-avc-gender="women"] #groups .kvl-combined-result.is-out{background:#f3f4f6;color:#6b7280}
        body[data-avc-gender="women"] #sources .avc-source{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;overflow:hidden!important}
        body[data-avc-gender="women"] #sources .avc-source strong{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
        body[data-avc-gender="women"] #sources .avc-source a{display:inline-flex!important;box-sizing:border-box!important;align-items:center!important;justify-content:center!important;max-width:100%!important;padding:6px 8px!important;border-radius:999px!important;background:var(--kvl-women-soft,#FFF2F7)!important;font-size:11px!important;line-height:1!important;white-space:nowrap!important}
        @media(max-width:680px){
          body[data-avc-gender="women"] #overview .cd-calendar-head{gap:3px!important}
          body[data-avc-gender="women"] #overview .cd-calendar-head>p{font-size:11px!important;line-height:1.4!important}
          body[data-avc-gender="women"] #groups .avc-combined-head{gap:3px!important}
          body[data-avc-gender="women"] #groups .avc-combined-head h3{font-size:16px!important;line-height:1.25!important;letter-spacing:-.03em!important}
          body[data-avc-gender="women"] #groups .avc-combined-head>p{font-size:9px!important;line-height:1.35!important;letter-spacing:-.035em!important}
          body[data-avc-gender="women"] #groups .kvl-combined-table{min-width:760px}
          body[data-avc-gender="women"] #groups .kvl-combined-line{grid-template-columns:48px 28px 86px 88px 72px 48px 82px 82px 62px;gap:6px;min-height:44px;padding:7px 9px}
          body[data-avc-gender="women"] #groups .kvl-combined-line.is-head{font-size:9px}
          body[data-avc-gender="women"] #groups .kvl-combined-rank{font-size:11px}
          body[data-avc-gender="women"] #groups .kvl-combined-team{font-size:11px}
          body[data-avc-gender="women"] #groups .kvl-combined-stat{font-size:10px}
          body[data-avc-gender="women"] #groups .kvl-combined-result{padding:4px 5px;font-size:9px}
          html body[data-avc-gender="women"] #sources .avc-source{grid-template-columns:minmax(0,1fr) auto!important;gap:6px!important;padding:10px 10px!important}
          html body[data-avc-gender="women"] #sources .avc-source strong{font-size:11px!important}
          html body[data-avc-gender="women"] #sources .avc-source a{padding:5px 7px!important;font-size:10px!important}
        }
      `;
      document.head.appendChild(style);
    };

    const polishAvcWomenHeaders=()=>{
      const combined=document.querySelector('#groups .avc-combined-head');
      if(combined){
        const eye=combined.querySelector('.eyebrow');if(eye)eye.textContent='TEAMS COMBINED RANKING';
        const h3=combined.querySelector('h3');if(h3)h3.textContent='예선 종합순위 · 전체 12개국';
        const p=combined.querySelector(':scope > p');if(p)p.textContent='조별리그 18/18경기 기준 · 대회 규정 자동계산 · 최종확정';
      }
    };

    const setupAvcWomenSources=()=>{
      const root=document.getElementById('sourceRoot');if(!root)return;
      const apply=()=>root.querySelectorAll('.avc-source a').forEach(a=>{if(a.textContent.trim()!=='공식페이지 →')a.textContent='공식페이지 →'});
      apply();
      new MutationObserver(apply).observe(root,{childList:true,subtree:true});
    };

    const setupAvcWomenCombinedRanking=()=>{
      const root=document.getElementById('combinedRankingRoot');if(!root)return;
      let markup='';
      const apply=()=>{if(markup&&!root.querySelector('.kvl-combined-table'))root.innerHTML=markup};
      new MutationObserver(apply).observe(root,{childList:true});
      const ratio=(a,b)=>b===0?Number.POSITIVE_INFINITY:a/b;
      const compareStats=(a,b)=>(b.wins-a.wins)||(b.leaguePoints-a.leaguePoints)||(ratio(b.setsFor,b.setsAgainst)-ratio(a.setsFor,a.setsAgainst))||(ratio(b.pointsFor,b.pointsAgainst)-ratio(a.pointsFor,a.pointsAgainst))||a.team.localeCompare(b.team,'ko');
      const ratioText=v=>Number.isFinite(v)?v.toFixed(3):'MAX';
      fetch('data/competitions/avc-women-continental-2026.json?v=20260907-2',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(r.status)).then(data=>{
        const stats=new Map();
        (data.groups||[]).forEach(g=>(g.teams||[]).forEach(team=>stats.set(team,{team,pool:g.id,played:0,wins:0,leaguePoints:0,setsFor:0,setsAgainst:0,pointsFor:0,pointsAgainst:0,poolRank:0})));
        (data.matches||[]).filter(m=>m.stage==='조별리그').forEach(m=>{
          const a=stats.get(m.teamA),b=stats.get(m.teamB);if(!a||!b)return;
          const setsA=Number(m.setsA)||0,setsB=Number(m.setsB)||0;
          a.played++;b.played++;a.setsFor+=setsA;a.setsAgainst+=setsB;b.setsFor+=setsB;b.setsAgainst+=setsA;
          (m.sets||[]).forEach(s=>{const pa=Number(s[0])||0,pb=Number(s[1])||0;a.pointsFor+=pa;a.pointsAgainst+=pb;b.pointsFor+=pb;b.pointsAgainst+=pa});
          if(setsA>setsB){a.wins++;if(setsB===2){a.leaguePoints+=2;b.leaguePoints+=1}else a.leaguePoints+=3}else{b.wins++;if(setsA===2){b.leaguePoints+=2;a.leaguePoints+=1}else b.leaguePoints+=3}
        });
        [...new Set([...stats.values()].map(s=>s.pool))].forEach(pool=>{[...stats.values()].filter(s=>s.pool===pool).sort(compareStats).forEach((s,i)=>{s.poolRank=i+1})});
        const rows=[...stats.values()].sort((a,b)=>(a.poolRank-b.poolRank)||compareStats(a,b)).map((s,i)=>({...s,combinedRank:i+1}));
        const flagMap={중국:'cn',이란:'ir',대만:'tw',이라크:'iq',태국:'th',인도네시아:'id',카자흐스탄:'kz',호주:'au',일본:'jp',대한민국:'kr',베트남:'vn',홍콩:'hk'};
        const head='<div class="kvl-combined-line is-head"><span>종합순위</span><span>국기</span><span>국가</span><span>결과</span><span>승리 경기수</span><span>승점</span><span>세트 득실률</span><span>득점 득실률</span><span>조순위</span></div>';
        const body=rows.map(s=>{const qualified=s.combinedRank<=8;return `<div class="kvl-combined-line ${s.team==='대한민국'?'is-korea':''}"><span class="kvl-combined-rank">${s.combinedRank}위</span><img src="https://flagcdn.com/w80/${flagMap[s.team]||''}.png" alt="${s.team} 국기" loading="lazy"><strong class="kvl-combined-team">${s.team}</strong><span class="kvl-combined-result ${qualified?'':'is-out'}">${qualified?'8강 진출':'조별리그 탈락'}</span><span class="kvl-combined-stat">${s.wins}</span><span class="kvl-combined-stat">${s.leaguePoints}</span><span class="kvl-combined-stat">${ratioText(ratio(s.setsFor,s.setsAgainst))}</span><span class="kvl-combined-stat">${ratioText(ratio(s.pointsFor,s.pointsAgainst))}</span><span class="kvl-combined-stat">${s.pool}조 ${s.poolRank}위</span></div>`}).join('');
        markup=`<div class="kvl-combined-table">${head}${body}</div>`;
        apply();
      }).catch(()=>{});
    };

    const watchAvcWomenVenueKpi=()=>{
      const kpis=document.querySelector('#overview .avc-kpis');
      if(!kpis)return;
      ensureAvcWomenVenueKpi();
      new MutationObserver(()=>ensureAvcWomenVenueKpi()).observe(kpis,{childList:true});
    };
    const setupAvcWomenUi=()=>{ensureAvcWomenUiStyle();polishAvcWomenHeaders();watchAvcWomenVenueKpi();setupAvcWomenCombinedRanking();setupAvcWomenSources()};
    if(document.readyState==='loading')addEventListener('DOMContentLoaded',setupAvcWomenUi,{once:true});
    else setupAvcWomenUi();
  }

  const UNIVERSITY_COMPETITION_PATHS=new Set(['university-competition.html','university-competition-danyang.html']);
  if(UNIVERSITY_COMPETITION_PATHS.has(path)){
    const kuvlLogoPath='assets/images/universities/kuvf-logo.png';
    const applyKuvfLogo=()=>{
      const el=document.getElementById('cdCompetitionLogo');
      if(!el)return;
      const current=el.querySelector('img');
      if(current&&current.getAttribute('src')===kuvlLogoPath)return;
      el.innerHTML=`<img src="${kuvlLogoPath}" alt="한국대학배구연맹 로고" loading="eager">`;
    };
    const watchKuvfLogo=()=>{
      const el=document.getElementById('cdCompetitionLogo');
      if(!el)return;
      applyKuvfLogo();
      new MutationObserver(applyKuvfLogo).observe(el,{childList:true,subtree:true});
    };
    if(document.readyState==='loading')addEventListener('DOMContentLoaded',watchKuvfLogo,{once:true});
    else watchKuvfLogo();
  }

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
  if(!document.querySelector('script[src*="kvl-global-sidebar-v1.js"]')){const script=document.createElement('script');script.src='assets/js/kvl-global-sidebar-v1.js?v=20260902-4';script.defer=true;document.head.appendChild(script)}

  if(path==='vnl.html'){
    if(!document.querySelector('link[href*="competition-hub.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/competition-hub.css?v=20260728-2';document.head.appendChild(link)}
    if(!document.querySelector('link[href*="vnl-schedule-stage.css"]')){const link=document.createElement('link');link.rel='stylesheet';link.href='assets/css/vnl-schedule-stage.css?v=20260728-1';document.head.appendChild(link)}

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

      const schedule=document.querySelector('#schedule');
      if(schedule&&!schedule.dataset.scheduleRefined){
        schedule.dataset.scheduleRefined='1';
        schedule.classList.add('vnl-schedule-stage');
        const links=schedule.querySelector('.schedule-links');
        const calendarLink=links?.querySelector('a');
        const head=schedule.querySelector('.vnl-section-head');
        if(calendarLink&&head){
          const entry=document.createElement('div');
          entry.className='vnl-calendar-entry';
          entry.innerHTML='<div><strong>2026 VNL 남자부 월별 달력</strong><p>전체 경기 일정을 한국시간 기준 달력에서 확인하고, 경기 결과가 등록되면 같은 화면에서 확인합니다.</p></div>';
          const button=calendarLink.cloneNode(true);
          button.textContent='월별 달력 열기';
          entry.appendChild(button);
          head.insertAdjacentElement('afterend',entry);
        }
        if(links&&!schedule.querySelector('.vnl-team-filter-label')){
          const label=document.createElement('p');
          label.className='vnl-team-filter-label';
          label.textContent='국가별 일정 바로가기';
          links.insertAdjacentElement('beforebegin',label);
        }
      }
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