/* K-Volley Lab mobile competition roster v1 */
(function(){
  'use strict';
  const STYLE_ID='kvl-competition-roster-v1-css';
  const STYLE_HREF='assets/css/kvl-competition-roster-v1.css?v=20260908-2';
  const ROUTES={
    'international-competition-avc-men-continental-2026.html':[
      'data/competitions/avc-men-continental-2026-rosters-a.json',
      'data/competitions/avc-men-continental-2026-rosters-b.json',
      'data/competitions/avc-men-continental-2026-rosters-c.json'
    ]
  };
  const flagMap={JPN:'jp',AUS:'au',BRN:'bh',OMA:'om',IRI:'ir',CHN:'cn',IND:'in',NZL:'nz',QAT:'qa',KOR:'kr',TPE:'tw',THA:'th'};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ensureStyle=()=>{if(document.getElementById(STYLE_ID))return;const l=document.createElement('link');l.id=STYLE_ID;l.rel='stylesheet';l.href=STYLE_HREF;document.head.appendChild(l)};
  const currentFile=()=>location.pathname.split('/').filter(Boolean).pop()||'index.html';
  const normalizeSources=value=>Array.isArray(value)?value.map(String).map(s=>s.trim()).filter(Boolean):(typeof value==='string'&&value.trim()?[value.trim()]:[]);
  const legacySources=()=>{const custom=document.getElementById('teamRoot')?.dataset.kvlRosterSources;if(custom)return custom.split(',').map(s=>s.trim()).filter(Boolean);return ROUTES[currentFile()]||[]};
  const flagUrl=team=>flagMap[team.code]?`https://flagcdn.com/w80/${flagMap[team.code]}.png`:'';
  const playerRow=p=>`<div class="kvl-roster-row"><span class="kvl-roster-no">${esc(p.number)}</span><div class="kvl-roster-player"><strong>${esc(p.officialName||p.fullName)}</strong><small>${esc(p.koreanName)}${p.birthDate?` · ${esc(p.birthDate)}`:''}</small></div><span class="kvl-roster-pos">${esc(p.position)}</span><span class="kvl-roster-height">${p.heightCm?`${esc(p.heightCm)}cm`:'-'}</span></div>`;
  const teamCard=team=>`<article class="kvl-roster-team-card" data-team="${esc(team.name)}"><button class="kvl-roster-team-button" type="button" aria-expanded="false"><img src="${flagUrl(team)}" alt="${esc(team.name)} 국기" loading="lazy"><span class="kvl-roster-team-copy"><strong>${esc(team.name)}</strong><small>${esc(team.en)}</small></span><span class="kvl-roster-team-meta">${esc(team.group)}조 · ${esc(team.count)}명</span><span class="kvl-roster-chevron" aria-hidden="true">⌄</span></button><div class="kvl-roster-panel"><div class="kvl-roster-head"><span>#</span><span>선수</span><span>POS</span><span>키</span></div>${(team.players||[]).slice().sort((a,b)=>Number(a.number)-Number(b.number)).map(playerRow).join('')}<div class="kvl-roster-source-note">K-Volley Lab 선수명단 MASTER 기준 · ${esc(team.status||'등록 명단')}</div></div></article>`;
  function render(root,teams){root.innerHTML=teams.map(teamCard).join('');root.dataset.kvlRosterRendered='1';root.onclick=e=>{const btn=e.target.closest('.kvl-roster-team-button');if(!btn)return;const card=btn.closest('.kvl-roster-team-card'),open=!card.classList.contains('is-open');root.querySelectorAll('.kvl-roster-team-card.is-open').forEach(c=>{if(c!==card){c.classList.remove('is-open');c.querySelector('button')?.setAttribute('aria-expanded','false')}});card.classList.toggle('is-open',open);btn.setAttribute('aria-expanded',open?'true':'false')}}
  function shortcutMarkup(){return '<span class="kvl-roster-shortcut-copy"><strong>선수명단 보기</strong><span>참가국을 선택하면 등록 로스터를 확인할 수 있습니다.</span></span><b>›</b>'}
  function addLegacyShortcut(){const kpis=document.querySelector('#overview .avc-kpis');if(!kpis||document.querySelector('#overview .kvl-roster-shortcut'))return;const a=document.createElement('a'),u=new URL(location.href);u.searchParams.set('view','teams');u.searchParams.set('team','대한민국');a.className='kvl-roster-shortcut';a.href=u.pathname+u.search;a.innerHTML=shortcutMarkup();kpis.insertAdjacentElement('afterend',a)}
  function addGenericShortcut(root){const slot=root.querySelector('[data-kvl-slot="overview-extra"]');if(!slot||slot.querySelector('.kvl-roster-shortcut'))return;const a=document.createElement('a');a.className='kvl-roster-shortcut';a.href='?view=participants';a.innerHTML=shortcutMarkup();a.addEventListener('click',event=>{const target=root.querySelector('[data-kvl-view="participants"]');if(!target)return;event.preventDefault();target.click()});slot.prepend(a)}
  function openRequested(root){const name=new URLSearchParams(location.search).get('team');if(!name)return;const card=[...root.querySelectorAll('.kvl-roster-team-card')].find(c=>c.dataset.team===name);if(!card)return;card.classList.add('is-open');card.querySelector('button')?.setAttribute('aria-expanded','true');requestAnimationFrame(()=>card.scrollIntoView({block:'start'}))}
  async function fetchTeams(urls){const parts=await Promise.all(urls.map(u=>fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`${r.status} ${u}`);return r.json()})));return parts.flatMap(p=>p.teams||[])}
  async function initLegacy(){const root=document.getElementById('teamRoot'),urls=legacySources();if(!root||!urls.length)return;ensureStyle();addLegacyShortcut();try{const teams=await fetchTeams(urls);const paint=()=>{render(root,teams);openRequested(root)};let tries=0;const settle=setInterval(()=>{tries++;if(!root.querySelector('.kvl-roster-team-card'))paint();if(tries>=50)clearInterval(settle)},100);paint();}catch(err){console.error('[KVL roster legacy]',err)}}
  async function initGeneric(root,cfg){if(!root||!cfg||cfg.features?.participants===false||cfg.features?.participantRosters===false)return;const urls=normalizeSources(cfg.data?.rosters);if(!urls.length)return;ensureStyle();try{const teams=await fetchTeams(urls);const api=window.KVLCompetitionTemplateV1;if(!api?.register)return;api.register('participants',({slot})=>{render(slot,teams);openRequested(slot)});addGenericShortcut(root)}catch(err){console.error('[KVL roster template]',err)}}
  function watchGeneric(){const root=document.querySelector('[data-kvl-competition-v1]');if(!root)return;let started=false;const start=cfg=>{if(started||!cfg)return;started=true;initGeneric(root,cfg)};root.addEventListener('kvl:competition-ready',event=>start(event.detail?.config),{once:true});start(window.KVLCompetitionTemplateV1?.getConfig?.())}
  function init(){initLegacy();watchGeneric()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.KVLCompetitionRoster=Object.freeze({version:'1.1.0',init,render});
})();