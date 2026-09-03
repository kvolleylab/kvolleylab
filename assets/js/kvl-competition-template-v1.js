(()=>{
  const root=document.querySelector('[data-kvl-competition-v1]');
  if(!root)return;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const src=root.dataset.competitionSrc||document.body.dataset.competitionSrc||'';
  const renderers=new Map();
  let config=null;

  const defaultLabels={
    overview:'한눈에 보기',schedule:'경기일정',groups:'조별순위',finalRanking:'최종순위',participants:'참가팀',rosters:'선수명단',resources:'공식자료'
  };
  const sectionOrder=['overview','schedule','groups','finalRanking','participants','rosters','resources'];

  const enabledSections=cfg=>sectionOrder.filter(key=>cfg.features?.[key]!==false);
  const participantLabel=cfg=>cfg.labels?.participants||({international:'참가국',university:'참가대학',school:'참가학교'}[cfg.competitionType]||'참가팀');
  const labelFor=(cfg,key)=>key==='participants'?participantLabel(cfg):(cfg.labels?.[key]||defaultLabels[key]);

  function applyTheme(cfg){
    root.dataset.gender=cfg.gender||'men';
    root.dataset.category=cfg.category||'international';
    const t=cfg.theme||{};
    const map={primary:'--kvl-comp-primary',primaryDark:'--kvl-comp-primary-2',accent:'--kvl-comp-accent',accentDark:'--kvl-comp-accent-dark',line:'--kvl-comp-line',soft:'--kvl-comp-soft'};
    Object.entries(map).forEach(([key,css])=>{if(t[key])root.style.setProperty(css,t[key])});
  }

  function hero(cfg){
    const dates=[cfg.startDate,cfg.endDate].filter(Boolean).join(' ~ ');
    const place=[cfg.location?.country,cfg.location?.city].filter(Boolean).join(' · ');
    const venue=cfg.location?.venue||'';
    const meta=[dates,place,venue].filter(Boolean).join(' · ');
    return `<section class="kvl-comp-hero"><div class="kvl-comp-hero-copy"><p class="kvl-comp-eyebrow">${esc(cfg.eyebrow||cfg.titleEn||'K-VOLLEY LAB COMPETITION')}</p><h1 class="kvl-comp-title">${esc(cfg.titleKo||'대회명')}</h1>${meta?`<p class="kvl-comp-meta">${esc(meta)}</p>`:''}</div>${cfg.statusLabel?`<span class="kvl-comp-status">${esc(cfg.statusLabel)}</span>`:''}</section>`;
  }

  function nav(cfg,active){
    return `<nav class="kvl-comp-nav" aria-label="대회 메뉴">${enabledSections(cfg).map(key=>`<a href="?view=${encodeURIComponent(key)}" data-kvl-view="${key}" class="${key===active?'is-active':''}">${esc(labelFor(cfg,key))}</a>`).join('')}</nav>`;
  }

  function sectionHead(cfg,key){
    const descriptions=cfg.sectionDescriptions||{};
    const eyebrow=(cfg.sectionEyebrows||{})[key]||key.toUpperCase();
    return `<div class="kvl-comp-section-head"><div><p class="kvl-comp-eyebrow">${esc(eyebrow)}</p><h2>${esc(labelFor(cfg,key))}</h2></div>${descriptions[key]?`<p>${esc(descriptions[key])}</p>`:''}</div>`;
  }

  function overview(cfg){
    const stats=Array.isArray(cfg.overviewStats)?cfg.overviewStats:[];
    const kpis=stats.length?`<div class="kvl-comp-kpis">${stats.map(s=>`<article class="kvl-comp-kpi"><span class="kvl-comp-kpi-label">${esc(s.label)}</span><div class="kvl-comp-kpi-value"><strong>${esc(s.value)}</strong><small>${esc(s.unit||'')}</small></div></article>`).join('')}</div>`:'';
    return `${sectionHead(cfg,'overview')}${kpis}<div class="kvl-comp-slot" data-kvl-slot="overview-extra"></div>`;
  }

  function genericSection(cfg,key){
    return `${sectionHead(cfg,key)}<div class="kvl-comp-slot" data-kvl-slot="${key}"><div class="kvl-comp-empty">${esc(labelFor(cfg,key))} 데이터를 연결하세요.</div></div>`;
  }

  function renderShell(cfg){
    const allowed=enabledSections(cfg);
    const params=new URLSearchParams(location.search);
    const requested=params.get('view');
    const active=allowed.includes(requested)?requested:(allowed[0]||'overview');
    root.innerHTML=`${hero(cfg)}${nav(cfg,active)}<div class="kvl-comp-sections">${allowed.map(key=>`<section id="kvl-${key}" class="kvl-comp-section ${key===active?'is-active':''}" data-kvl-section="${key}">${key==='overview'?overview(cfg):genericSection(cfg,key)}</section>`).join('')}</div>`;
    root.querySelectorAll('[data-kvl-view]').forEach(a=>a.addEventListener('click',event=>{
      event.preventDefault();
      const key=a.dataset.kvlView;
      root.querySelectorAll('[data-kvl-view]').forEach(link=>link.classList.toggle('is-active',link===a));
      root.querySelectorAll('[data-kvl-section]').forEach(section=>section.classList.toggle('is-active',section.dataset.kvlSection===key));
      const url=new URL(location.href);url.searchParams.set('view',key);history.replaceState(history.state,'',url);
    }));
    renderers.forEach((fn,key)=>runRenderer(key,fn));
  }

  function runRenderer(key,fn){
    const slot=root.querySelector(`[data-kvl-slot="${CSS.escape(key)}"]`);
    if(!slot||typeof fn!=='function')return;
    try{
      const output=fn({config,root,slot});
      if(output instanceof Node){slot.replaceChildren(output)}
      else if(typeof output==='string')slot.innerHTML=output;
    }catch(error){console.error('[KVLCompetitionV1]',key,error)}
  }

  const api={
    getConfig:()=>config,
    register(key,renderer){renderers.set(key,renderer);if(config)runRenderer(key,renderer)},
    refresh(){if(config)renderShell(config)},
    root
  };
  window.KVLCompetitionTemplateV1=api;

  if(!src){
    root.innerHTML='<div class="kvl-comp-empty">대회 데이터 경로(data-competition-src)가 지정되지 않았습니다.</div>';
    return;
  }

  fetch(src,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`))).then(cfg=>{
    config=cfg;
    applyTheme(cfg);
    renderShell(cfg);
    root.dispatchEvent(new CustomEvent('kvl:competition-ready',{detail:{config:cfg}}));
  }).catch(error=>{
    console.error('[KVLCompetitionV1] load failed',error);
    root.innerHTML='<div class="kvl-comp-empty">대회 데이터를 불러오지 못했습니다.</div>';
  });
})();
