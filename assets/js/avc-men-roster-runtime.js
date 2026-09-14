(()=>{
  const PAGES=new Set(['international-competition-avc-men-continental-2026.html','international-competition-avc-men-rosters-2026.html']);
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!PAGES.has(path))return;
  const standalone=path==='international-competition-avc-men-rosters-2026.html';

  const DATA='data/competitions/avc-men-continental-2026-rosters.json?v=20260904-1';
  const CLUBS='data/competitions/avc-men-continental-2026-clubs-2026-27.json?v=20260914-3';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const posOrder={S:1,OP:2,OH:3,MB:4,L:5,U:6,'':9};
  const fmtDob=v=>{if(!v)return '생년월일 미확인';const [y,m,d]=String(v).split('-');return y&&m&&d?`${y}.${m}.${d}`:v};
  const flag=t=>`https://flagcdn.com/w80/${t.flag}.png`;
  const params=()=>new URLSearchParams(location.search);
  const isPrintAll=()=>params().get('print')==='all';

  const COUNTRY_FLAGS={
    Japan:'🇯🇵',Italy:'🇮🇹',Poland:'🇵🇱','Türkiye':'🇹🇷',Germany:'🇩🇪',Czechia:'🇨🇿',France:'🇫🇷',Portugal:'🇵🇹',India:'🇮🇳','South Korea':'🇰🇷',Taiwan:'🇹🇼',Iran:'🇮🇷',Oman:'🇴🇲'
  };
  const LEAGUE_META={
    'Osaka Bluteon':['🇯🇵','Japan','SV.League Men'],
    'Suntory Sunbirds Osaka':['🇯🇵','Japan','SV.League Men'],
    'Wolfdogs Nagoya':['🇯🇵','Japan','SV.League Men'],
    'JTEKT STINGS Aichi':['🇯🇵','Japan','SV.League Men'],
    'Hiroshima Thunders':['🇯🇵','Japan','SV.League Men'],
    'Allianz Milano':['🇮🇹','Italy','SuperLega'],
    'BOGDANKA LUK Lublin':['🇵🇱','Poland','PlusLiga'],
    'Ziraat Bankkart Ankara':['🇹🇷','Türkiye','SMS Grup Efeler Ligi'],
    'Baden Volleys SSC Karlsruhe':['🇩🇪','Germany','1. Bundesliga'],
    'VfB Friedrichshafen':['🇩🇪','Germany','1. Bundesliga'],
    'Valsa Group Modena':['🇮🇹','Italy','SuperLega'],
    'VK Lvi Praha':['🇨🇿','Czechia','Extraliga mužů'],
    'AS Cannes':['🇫🇷','France','Ligue A Masculine'],
    'Cuneo Volley':['🇮🇹','Italy','SuperLega'],
    'Pallavolo Padova':['🇮🇹','Italy','SuperLega'],
    'Sporting CP':['🇵🇹','Portugal','Liga UNA Seguros'],
    'Cisterna Volley':['🇮🇹','Italy','SuperLega'],
    'Bengaluru Torpedoes':['🇮🇳','India','Prime Volleyball League'],
    'Kochi Blue Spikers':['🇮🇳','India','Prime Volleyball League'],
    'Chennai Blitz':['🇮🇳','India','Prime Volleyball League'],
    'KB손해보험':['🇰🇷','South Korea','V-League'],
    '현대캐피탈':['🇰🇷','South Korea','V-League'],
    '우리카드':['🇰🇷','South Korea','V-League'],
    'OK저축은행':['🇰🇷','South Korea','V-League'],
    '한국전력':['🇰🇷','South Korea','V-League'],
    '대한항공':['🇰🇷','South Korea','V-League'],
    '국군체육부대':['🇰🇷','South Korea','Korea Armed Forces'],
    'Taichung Winstreak':['🇹🇼','Taiwan','TPVL'],
    'TSG SkyHawks':['🇹🇼','Taiwan','TPVL'],
    'Taipei East Power':['🇹🇼','Taiwan','TPVL']
  };

  const addStyle=()=>{
    if(document.getElementById('avcMenRosterStyle'))return;
    const s=document.createElement('style');s.id='avcMenRosterStyle';s.textContent=`
      .avc-roster-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.avc-roster-toolbar p{margin:0;color:#64748b;font-size:13px}.avc-roster-toolbar-side{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.avc-roster-print-actions{display:flex;gap:6px}.avc-roster-print-btn{padding:7px 10px;border:1px solid #d6e1db;border-radius:9px;background:#fff;color:#40574a;font:900 11px Pretendard,Arial,sans-serif;cursor:pointer}.avc-roster-print-btn:hover{border-color:#c9a44c;background:#fffdf7;color:#8a620f}.avc-roster-team-tabs{display:flex;gap:8px;margin:0 0 22px;padding:4px 0 8px;overflow-x:auto;scrollbar-width:thin}.avc-roster-team-tab{display:flex;flex:0 0 auto;align-items:center;gap:7px;padding:9px 12px;border:1px solid #dbe7df;border-radius:999px;background:#fff;color:#40574a;font:900 12px Pretendard,Arial,sans-serif;cursor:pointer}.avc-roster-team-tab img{width:25px;height:17px;object-fit:contain}.avc-roster-team-tab:hover{border-color:#c9a44c;background:#fffdf7;color:#8a620f}.avc-roster-team-tab.is-active{border-color:#166534;background:#166534;color:#fff}.avc-roster-team-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 22px;border:1px solid #dbe7df;border-radius:18px;background:#f8fbf9}.avc-roster-team-id{display:flex;align-items:center;gap:14px}.avc-roster-team-id img{width:58px;height:40px;object-fit:contain;border-radius:5px;background:#fff}.avc-roster-team-id h3{margin:0;color:#17365d;font-size:23px}.avc-roster-team-id p{margin:4px 0 0;color:#718096;font-size:12px;font-weight:800}.avc-roster-status{padding:7px 11px;border-radius:999px;background:#e7f5ec;color:#166534;font-size:11px;font-weight:900;white-space:nowrap}.avc-roster-status.is-warning{background:#fff3cd;color:#8a6400}.avc-roster-warning{margin:12px 0 0;padding:12px 14px;border:1px solid #f0d58b;border-radius:12px;background:#fff9e7;color:#6f5511;font-size:12px;line-height:1.6}.avc-roster-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.avc-player-card{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:13px;align-items:center;min-height:108px;padding:15px 16px;border:1px solid #e0e8e3;border-radius:16px;background:#fff;box-shadow:0 4px 12px rgba(15,61,46,.035)}.avc-player-no{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#edf8f0;color:#166534;font-size:16px;font-weight:1000}.avc-player-no.is-empty{color:#9aa7a0;font-size:12px}.avc-player-copy{min-width:0}.avc-player-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.avc-player-pos{padding:4px 7px;border-radius:7px;background:#f0f4f2;color:#53675b;font-size:10px;font-weight:1000}.avc-player-copy h4{margin:0;color:#172033;font-size:16px;line-height:1.4}.avc-player-height{color:#166534;font-size:13px;font-weight:900}.avc-player-en{margin:4px 0 0;color:#6b7788;font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.avc-player-dob{margin:5px 0 0;color:#8a96a6;font-size:11px}.avc-player-club{margin:7px 0 0;line-height:1.35}.avc-player-club-name{display:block;color:#40574a;font-size:12px;font-weight:900}.avc-player-club-league{display:block;margin-top:2px;color:#8a96a6;font-size:10px;font-weight:800}.avc-vbox{display:inline-flex;align-items:center;justify-content:center;min-width:58px;padding:8px 10px;border:1px solid #d6e1db;border-radius:10px;background:#fff;color:#17365d;font-size:11px;font-weight:900;text-decoration:none}.avc-vbox:hover{border-color:#c9a44c;background:#fffdf7;color:#9a6d12}.avc-vbox.is-missing{color:#9aa3af;background:#f8fafc;cursor:default}.avc-roster-source{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid #e6ece8;color:#7b8794;font-size:11px}.avc-roster-source a{color:#166534;font-weight:900;text-decoration:none}.avc-roster-source a:hover{text-decoration:underline}.avc-roster-loading{padding:34px;text-align:center;color:#718096;font-size:13px}.avc-roster-error{padding:24px;border:1px solid #f1c7c7;border-radius:14px;background:#fff7f7;color:#8c3e3e;text-align:center;font-size:13px}.avc-print-all-team{margin:0 0 34px}
      @media(max-width:820px){.avc-roster-grid{grid-template-columns:1fr}.avc-roster-team-head{align-items:flex-start;flex-direction:column}.avc-roster-status{align-self:flex-start}}
      @media(max-width:560px){.avc-section#players{padding:20px 14px}.avc-roster-toolbar{align-items:flex-start;flex-direction:column}.avc-roster-toolbar-side{justify-content:flex-start}.avc-player-card{grid-template-columns:46px minmax(0,1fr);gap:10px}.avc-player-no{width:40px;height:40px}.avc-vbox{grid-column:2;justify-self:start;margin-top:2px}.avc-roster-team-id h3{font-size:20px}.avc-roster-source{align-items:flex-start;flex-direction:column}}
      @media print{.avc-roster-team-tabs,.avc-roster-print-actions,.avc-vbox{display:none!important}.avc-roster-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.avc-player-card{box-shadow:none;break-inside:avoid;page-break-inside:avoid}.avc-print-all-team{break-after:page;page-break-after:always}.avc-print-all-team:last-child{break-after:auto;page-break-after:auto}.avc-roster-source a{display:none!important}}
    `;document.head.appendChild(s);
  };

  let dataPromise=null;
  const loadData=()=>{
    if(dataPromise)return dataPromise;
    dataPromise=Promise.all([
      fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Roster HTTP ${r.status}`);return r.json()}),
      fetch(CLUBS,{cache:'no-store'}).then(r=>r.ok?r.json():({teams:{},unknownDisplay:'미확인'})).catch(()=>({teams:{},unknownDisplay:'미확인'}))
    ]).then(([data,clubs])=>({data,clubs}));
    return dataPromise;
  };
  const currentCode=data=>{const q=(params().get('team')||'KOR').toUpperCase();return data.teams.some(t=>t.code===q)?q:'KOR'};
  const clubInfo=(clubs,teamCode,number)=>{
    const fallback=clubs?.unknownDisplay||'미확인';
    if(number===null||number===undefined||number==='')return {club:fallback,league:null};
    const rec=clubs?.teams?.[teamCode]?.[String(number)];
    if(!rec)return {club:fallback,league:null};
    if(rec.status==='CONFIRMED'){
      const fromJson=rec.leagueCountry&&rec.leagueName?[COUNTRY_FLAGS[rec.leagueCountry]||'🌐',rec.leagueCountry,rec.leagueName]:null;
      return {club:rec.club||fallback,league:fromJson||LEAGUE_META[rec.club]||null};
    }
    if(rec.status==='FREE_AGENT')return {club:'FA / 무소속',league:null};
    return {club:fallback,league:null};
  };

  const buildShell=()=>{
    const sources=document.getElementById('sources'),nav=document.querySelector('.avc-jump');
    if(!sources||!nav)return false;
    if(!nav.querySelector('[data-view="players"]')){
      const a=document.createElement('a');a.dataset.view='players';a.href='?view=players&team=KOR';a.textContent='선수명단';
      const sourceLink=nav.querySelector('[data-view="sources"]');sourceLink?nav.insertBefore(a,sourceLink):nav.appendChild(a);
    }
    if(!document.getElementById('players')){
      const section=document.createElement('section');section.id='players';section.className='avc-section avc-view';section.innerHTML=`<div class="avc-section-head"><div><p class="eyebrow">OFFICIAL ROSTERS</p><h2>선수명단</h2></div><p>국가별 최종 엔트리 · 2026-27 소속팀/리그 · VB 바로가기</p></div><div id="avcRosterRoot" class="avc-roster-loading">선수명단 불러오는 중…</div>`;sources.insertAdjacentElement('beforebegin',section);
    }
    return true;
  };

  const playerCard=(p,teamCode,clubs)=>{
    const number=p.number===null||p.number===''?'—':p.number;
    const missing=number==='—';
    const pos=p.position||'—';
    const ko=p.nameKo||p.officialName||p.name||'이름 미확인';
    const height=p.height?`${p.height}cm`:'키 확인 불가';
    const en=p.name||p.officialName||'';
    const info=clubInfo(clubs,teamCode,p.number);
    const league=info.league?`<span class="avc-player-club-league">${esc(info.league[0])} ${esc(info.league[1])} · ${esc(info.league[2])}</span>`:'';
    const link=p.volleybox?`<a class="avc-vbox" href="${esc(p.volleybox)}" target="_blank" rel="noopener noreferrer">VB↗</a>`:`<span class="avc-vbox is-missing">VB 미확인</span>`;
    return `<article class="avc-player-card"><div class="avc-player-no ${missing?'is-empty':''}">${esc(number)}</div><div class="avc-player-copy"><div class="avc-player-top"><span class="avc-player-pos">${esc(pos)}</span><h4>${esc(ko)}</h4><span class="avc-player-height">${esc(height)}</span></div><p class="avc-player-en">${esc(en)}</p><p class="avc-player-dob">${esc(fmtDob(p.dob))}</p><div class="avc-player-club"><span class="avc-player-club-name">${esc(info.club)}</span>${league}</div></div>${link}</article>`;
  };

  const teamBlock=(team,clubs,wrapClass='')=>{
    const players=[...team.players].sort((a,b)=>(posOrder[a.position||'']??9)-(posOrder[b.position||'']??9)||((a.number??999)-(b.number??999)));
    const warn=team.code==='BRN'?`<div class="avc-roster-warning"><strong>바레인 확인 필요</strong> · 현재 공개 출국명단은 13명입니다. 개막 당일 Volleyball World 또는 현장 엔트리에서 14번째 선수를 확인하는 즉시 갱신합니다.</div>`:'';
    return `<div class="${wrapClass}"><div class="avc-roster-team-head"><div class="avc-roster-team-id"><img src="${flag(team)}" alt="${esc(team.nameKo)} 국기"><div><h3>${esc(team.nameKo)} <small>${esc(team.name)}</small></h3><p>${esc(team.pool)}조 · ${team.players.length}명</p></div></div><span class="avc-roster-status ${team.code==='BRN'?'is-warning':''}">${esc(team.status)}</span></div>${warn}<div class="avc-roster-grid">${players.map(p=>playerCard(p,team.code,clubs)).join('')}</div><div class="avc-roster-source"><span>공식 발표·Volleyball World 우선 / 26-27 소속팀은 검수상태에 따라 공개</span><a href="${esc(team.source)}" target="_blank" rel="noopener noreferrer">명단 출처 ↗</a></div></div>`;
  };

  const toolbar=(data,clubs,all)=>`<div class="avc-roster-toolbar"><p>${all?'전체 참가국 12팀 인쇄 모드':'선수를 누르지 않고도 이름·포지션·신장·생년월일·26-27 소속팀과 리그를 빠르게 확인할 수 있습니다.'}</p><div class="avc-roster-toolbar-side"><span>명단 ${esc(data.updatedAt.slice(0,10))} · 소속팀 ${esc(clubs.updatedAt||'미확인')} 검수</span><div class="avc-roster-print-actions"><button class="avc-roster-print-btn" type="button" data-print-current>${all?'전체 12팀 인쇄':'현재팀 인쇄'}</button>${all?'':'<button class="avc-roster-print-btn" type="button" data-print-all>전체 12팀 인쇄</button>'}</div></div></div>`;

  const bindPrint=(root,all)=>{
    root.querySelector('[data-print-current]')?.addEventListener('click',()=>window.print());
    root.querySelector('[data-print-all]')?.addEventListener('click',()=>{
      const url=new URL(location.href);url.searchParams.set('view','players');url.searchParams.set('print','all');url.searchParams.set('autoprint','1');location.href=url;
    });
    if(all&&params().get('autoprint')==='1')setTimeout(()=>window.print(),250);
  };

  const render=async()=>{
    const root=document.getElementById('avcRosterRoot');if(!root)return;
    try{
      const {data,clubs}=await loadData();
      const all=isPrintAll();
      if(all){
        root.className='';
        root.innerHTML=`${toolbar(data,clubs,true)}<div class="avc-print-all">${data.teams.map(t=>teamBlock(t,clubs,'avc-print-all-team')).join('')}</div>`;
        bindPrint(root,true);
        return;
      }
      const code=currentCode(data);const team=data.teams.find(t=>t.code===code)||data.teams[0];
      const tabs=data.teams.map(t=>`<button class="avc-roster-team-tab ${t.code===team.code?'is-active':''}" type="button" data-team="${t.code}"><img src="${flag(t)}" alt="" loading="lazy"><span>${esc(t.nameKo)}</span></button>`).join('');
      root.className='';root.innerHTML=`${toolbar(data,clubs,false)}<div class="avc-roster-team-tabs" role="tablist" aria-label="국가 선택">${tabs}</div>${teamBlock(team,clubs)}`;
      root.querySelectorAll('[data-team]').forEach(btn=>btn.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('view','players');url.searchParams.set('team',btn.dataset.team);url.searchParams.delete('print');url.searchParams.delete('autoprint');history.replaceState(history.state,'',url);render();window.scrollTo({top:document.getElementById('players').offsetTop-16,behavior:'smooth'})}));
      bindPrint(root,false);
    }catch(err){root.className='avc-roster-error';root.textContent='선수명단을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.';console.error(err)}
  };

  const activate=()=>{
    if(!standalone&&params().get('view')!=='players')return;
    document.querySelectorAll('.avc-view').forEach(s=>s.classList.toggle('is-active',s.id==='players'));
    document.querySelectorAll('.avc-jump a[data-view]').forEach(a=>{const on=a.dataset.view==='players';a.classList.toggle('is-active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  };

  const init=()=>{
    addStyle();
    let tries=0;const timer=setInterval(()=>{tries++;if(buildShell()){clearInterval(timer);render();setTimeout(activate,0);setTimeout(activate,250)}else if(tries>50)clearInterval(timer)},50);
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',init,{once:true});else init();
})();