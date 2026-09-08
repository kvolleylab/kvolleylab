/* K-Volley Lab participant roster hub v1
   Participants -> team/country -> roster dialog. No separate top-level roster tab. */
(function(){
  'use strict';
  const STYLE_ID='kvl-participant-roster-v1-css';
  const STYLE_HREF='assets/css/kvl-participant-roster-v1.css?v=20260908-1';
  const DIALOG_ID='kvl-participant-roster-dialog';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const ensureStyles=()=>{
    if(document.getElementById(STYLE_ID))return;
    const link=document.createElement('link');link.id=STYLE_ID;link.rel='stylesheet';link.href=STYLE_HREF;document.head.appendChild(link);
  };
  const shortStatus=value=>String(value||'').split('·')[0].trim();
  const flagUrl=(team,flags)=>flags?.[team.nameKo]||team.flagUrl||(team.flagCode?`https://flagcdn.com/w80/${esc(team.flagCode)}.png`:'');
  const playerName=p=>p.fullName||p.name||p.nameKo||'';
  const playerSub=p=>{
    const parts=[];
    if(p.nameKo&&p.nameKo!==playerName(p))parts.push(p.nameKo);
    if(p.heightCm)parts.push(`${p.heightCm}cm`);
    if(p.birthDate)parts.push(p.birthDate);
    return parts.join(' · ');
  };
  function ensureDialog(){
    let dialog=document.getElementById(DIALOG_ID);
    if(dialog)return dialog;
    dialog=document.createElement('dialog');dialog.id=DIALOG_ID;dialog.className='kvl-roster-dialog';
    dialog.addEventListener('close',()=>document.body.classList.remove('kvl-roster-dialog-open'));
    dialog.addEventListener('click',event=>{if(event.target===dialog&&typeof dialog.close==='function')dialog.close()});
    document.body.appendChild(dialog);return dialog;
  }
  function openTeam(team,flags){
    const dialog=ensureDialog();
    const flag=flagUrl(team,flags);
    const players=Array.isArray(team.players)?team.players:[];
    dialog.innerHTML=`
      <div class="kvl-roster-dialog-head">
        ${flag?`<img src="${flag}" alt="${esc(team.nameKo||team.nameEn)} 국기" loading="lazy">`:'<span></span>'}
        <div class="kvl-roster-dialog-title"><strong>${esc(team.nameKo||team.nameEn)}</strong><small>${esc(team.nameEn||'')} · ${esc(team.pool||'')}조</small></div>
        <button type="button" class="kvl-roster-dialog-close" aria-label="선수명단 닫기">×</button>
      </div>
      <div class="kvl-roster-dialog-status"><span>${players.length}명 등록 · 등번호 오름차순</span><b>${esc(shortStatus(team.verificationStatus)||`${players.length}명`)}</b></div>
      <div class="kvl-roster-dialog-body">
        ${players.map(p=>`<div class="kvl-roster-player">
          <span class="kvl-roster-number">${esc(p.number)}</span>
          <div class="kvl-roster-player-copy"><strong>${esc(playerName(p))}</strong><small>${esc(playerSub(p))}</small></div>
          <div class="kvl-roster-player-side"><span class="kvl-roster-pos">${esc(p.position||'-')}</span>${p.volleyboxUrl?`<a class="kvl-roster-vb" href="${esc(p.volleyboxUrl)}" target="_blank" rel="noopener noreferrer">Volleybox ↗</a>`:''}</div>
        </div>`).join('')}
      </div>
      <div class="kvl-roster-dialog-note">K-Volley Lab 검수 MASTER 기준 · 최종 검수 ${esc(team.lastVerified||'')}</div>`;
    dialog.querySelector('.kvl-roster-dialog-close')?.addEventListener('click',()=>{if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')});
    document.body.classList.add('kvl-roster-dialog-open');
    if(typeof dialog.showModal==='function'){if(!dialog.open)dialog.showModal()}else dialog.setAttribute('open','');
  }
  function render(root,data,options){
    if(!root||!data)return;
    ensureStyles();
    const opts=options||{};
    const teams=Array.isArray(data.teams)?data.teams:[];
    const flags=opts.flags||{};
    root.classList.add('kvl-roster-hub-ready');
    root.innerHTML=`<div class="kvl-roster-country-grid">${teams.map((team,index)=>{
      const flag=flagUrl(team,flags);const count=Number(team.rosterCount||team.players?.length||0);
      return `<button type="button" class="kvl-roster-country-card" data-kvl-roster-index="${index}" aria-label="${esc(team.nameKo||team.nameEn)} 선수명단 보기">
        ${flag?`<img class="kvl-roster-country-flag" src="${flag}" alt="${esc(team.nameKo||team.nameEn)} 국기" loading="lazy">`:'<span class="kvl-roster-country-flag"></span>'}
        <span class="kvl-roster-country-copy"><strong>${esc(team.nameKo||team.nameEn)}</strong><small>${esc(team.nameEn||'')}</small></span>
        <span class="kvl-roster-country-meta"><b>${esc(team.pool||'')}조 · ${count}명</b><em>선수명단 보기</em></span>
      </button>`}).join('')}</div><p class="kvl-roster-footnote">국가를 누르면 해당 팀의 대회 등록 선수명단을 확인할 수 있습니다.</p>`;
    root.querySelectorAll('[data-kvl-roster-index]').forEach(button=>button.addEventListener('click',()=>{
      const team=teams[Number(button.dataset.kvlRosterIndex)];if(team)openTeam(team,flags);
    }));
  }
  function addAvcQuickLink(){
    const overview=document.querySelector('#overview .avc-kpis');
    if(!overview||document.querySelector('#overview .kvl-roster-quick-link'))return;
    const button=document.createElement('button');button.type='button';button.className='kvl-roster-quick-link';button.innerHTML='<span><strong>선수명단</strong><br><span>참가국에서 국가별 등록 로스터 확인</span></span>';
    button.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('view','teams');location.href=url.toString()});
    overview.insertAdjacentElement('afterend',button);
  }
  function enhanceAvcMen(){
    if(!document.body.matches('[data-avc-gender="men"]'))return;
    const root=document.getElementById('teamRoot');if(!root)return;
    const dataSrc='data/competitions/avc-men-continental-2026-rosters.json?v=20260908-1';
    let rosterData=null,done=false;
    const tryRender=()=>{
      if(done||!rosterData)return;
      const cards=[...root.querySelectorAll('.avc-country-card')];if(!cards.length)return;
      const flags={};cards.forEach(card=>{const name=card.querySelector('strong')?.textContent?.trim();const src=card.querySelector('img')?.getAttribute('src');if(name&&src)flags[name]=src});
      done=true;observer.disconnect();render(root,rosterData,{flags});addAvcQuickLink();
    };
    const observer=new MutationObserver(tryRender);observer.observe(root,{childList:true,subtree:true});
    fetch(dataSrc,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`))).then(data=>{rosterData=data;tryRender()}).catch(error=>console.error('[KVLParticipantRoster] AVC men roster load failed',error));
    tryRender();
  }
  function addGenericQuickLink(root){
    const slot=root.querySelector('[data-kvl-slot="overview-extra"]');if(!slot||slot.querySelector('.kvl-roster-quick-link'))return;
    const button=document.createElement('button');button.type='button';button.className='kvl-roster-quick-link';button.innerHTML='<span><strong>선수명단</strong><br><span>참가팀에서 국가별 등록 로스터 확인</span></span>';
    button.addEventListener('click',()=>root.querySelector('[data-kvl-view="participants"]')?.click());slot.prepend(button);
  }
  function prepareGeneric(){
    const root=document.querySelector('[data-kvl-competition-v1]');if(!root)return;
    root.addEventListener('kvl:competition-ready',event=>{
      const cfg=event.detail?.config||window.KVLCompetitionTemplateV1?.getConfig?.();
      const src=cfg?.data?.rosters;if(!src||cfg?.features?.participants===false||cfg?.features?.participantRosters===false)return;
      fetch(src,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error(`HTTP ${r.status}`))).then(data=>{
        window.KVLCompetitionTemplateV1?.register('participants',({slot})=>{render(slot,data,{});return undefined});
        addGenericQuickLink(root);
      }).catch(error=>console.error('[KVLParticipantRoster] generic roster load failed',error));
    },{once:true});
  }
  ensureStyles();
  window.KVLParticipantRoster=Object.freeze({version:'1.0.0',render,openTeam});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{enhanceAvcMen();prepareGeneric()},{once:true});
  else{enhanceAvcMen();prepareGeneric()}
})();
