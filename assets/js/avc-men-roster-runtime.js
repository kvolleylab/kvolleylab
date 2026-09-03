(()=>{
  const PAGES=new Set(['international-competition-avc-men-continental-2026.html','international-competition-avc-men-rosters-2026.html']);
  const path=(location.pathname.split('/').pop()||'').toLowerCase();
  if(!PAGES.has(path))return;
  const standalone=path==='international-competition-avc-men-rosters-2026.html';

  const DATA='data/competitions/avc-men-continental-2026-rosters.json?v=20260904-1';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const posOrder={S:1,OP:2,OH:3,MB:4,L:5,U:6,'':9};
  const fmtDob=v=>{if(!v)return '생년월일 미확인';const [y,m,d]=String(v).split('-');return y&&m&&d?`${y}.${m}.${d}`:v};
  const flag=t=>`https://flagcdn.com/w80/${t.flag}.png`;

  const addStyle=()=>{
    if(document.getElementById('avcMenRosterStyle'))return;
    const s=document.createElement('style');s.id='avcMenRosterStyle';s.textContent=`
      .avc-roster-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.avc-roster-toolbar p{margin:0;color:#64748b;font-size:13px}.avc-roster-team-tabs{display:flex;gap:8px;margin:0 0 22px;padding:4px 0 8px;overflow-x:auto;scrollbar-width:thin}.avc-roster-team-tab{display:flex;flex:0 0 auto;align-items:center;gap:7px;padding:9px 12px;border:1px solid #dbe7df;border-radius:999px;background:#fff;color:#40574a;font:900 12px Pretendard,Arial,sans-serif;cursor:pointer}.avc-roster-team-tab img{width:25px;height:17px;object-fit:contain}.avc-roster-team-tab:hover{border-color:#c9a44c;background:#fffdf7;color:#8a620f}.avc-roster-team-tab.is-active{border-color:#166534;background:#166534;color:#fff}.avc-roster-team-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 22px;border:1px solid #dbe7df;border-radius:18px;background:#f8fbf9}.avc-roster-team-id{display:flex;align-items:center;gap:14px}.avc-roster-team-id img{width:58px;height:40px;object-fit:contain;border-radius:5px;background:#fff}.avc-roster-team-id h3{margin:0;color:#17365d;font-size:23px}.avc-roster-team-id p{margin:4px 0 0;color:#718096;font-size:12px;font-weight:800}.avc-roster-status{padding:7px 11px;border-radius:999px;background:#e7f5ec;color:#166534;font-size:11px;font-weight:900;white-space:nowrap}.avc-roster-status.is-warning{background:#fff3cd;color:#8a6400}.avc-roster-warning{margin:12px 0 0;padding:12px 14px;border:1px solid #f0d58b;border-radius:12px;background:#fff9e7;color:#6f5511;font-size:12px;line-height:1.6}.avc-roster-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.avc-player-card{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:13px;align-items:center;min-height:96px;padding:15px 16px;border:1px solid #e0e8e3;border-radius:16px;background:#fff;box-shadow:0 4px 12px rgba(15,61,46,.035)}.avc-player-no{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#edf8f0;color:#166534;font-size:16px;font-weight:1000}.avc-player-no.is-empty{color:#9aa7a0;font-size:12px}.avc-player-copy{min-width:0}.avc-player-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.avc-player-pos{padding:4px 7px;border-radius:7px;background:#f0f4f2;color:#53675b;font-size:10px;font-weight:1000}.avc-player-copy h4{margin:0;color:#172033;font-size:16px;line-height:1.4}.avc-player-height{color:#166534;font-size:13px;font-weight:900}.avc-player-en{margin:4px 0 0;color:#6b7788;font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.avc-player-dob{margin:5px 0 0;color:#8a96a6;font-size:11px}.avc-vbox{display:inline-flex;align-items:center;justify-content:center;min-width:86px;padding:8px 10px;border:1px solid #d6e1db;border-radius:10px;background:#fff;color:#17365d;font-size:11px;font-weight:900;text-decoration:none}.avc-vbox:hover{border-color:#c9a44c;background:#fffdf7;color:#9a6d12}.avc-vbox.is-missing{color:#9aa3af;background:#f8fafc;cursor:default}.avc-roster-source{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:16px;border-top:1px solid #e6ece8;color:#7b8794;font-size:11px}.avc-roster-source a{color:#166534;font-weight:900;text-decoration:none}.avc-roster-source a:hover{text-decoration:underline}.avc-roster-loading{padding:34px;text-align:center;color:#718096;font-size:13px}.avc-roster-error{padding:24px;border:1px solid #f1c7c7;border-radius:14px;background:#fff7f7;color:#8c3e3e;text-align:center;font-size:13px}
      @media(max-width:820px){.avc-roster-grid{grid-template-columns:1fr}.avc-roster-team-head{align-items:flex-start;flex-direction:column}.avc-roster-status{align-self:flex-start}}
      @media(max-width:560px){.avc-section#players{padding:20px 14px}.avc-roster-toolbar{align-items:flex-start;flex-direction:column}.avc-player-card{grid-template-columns:46px minmax(0,1fr);gap:10px}.avc-player-no{width:40px;height:40px}.avc-vbox{grid-column:2;justify-self:start;margin-top:2px}.avc-roster-team-id h3{font-size:20px}.avc-roster-source{align-items:flex-start;flex-direction:column}}
    `;document.head.appendChild(s);
  };

  let rosterData=null;
  const loadData=async()=>{if(rosterData)return rosterData;const r=await fetch(DATA,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);rosterData=await r.json();return rosterData};
  const currentCode=data=>{const q=(new URLSearchParams(location.search).get('team')||'KOR').toUpperCase();return data.teams.some(t=>t.code===q)?q:'KOR'};

  const buildShell=()=>{
    const sources=document.getElementById('sources'),nav=document.querySelector('.avc-jump');
    if(!sources||!nav)return false;
    if(!nav.querySelector('[data-view="players"]')){
      const a=document.createElement('a');a.dataset.view='players';a.href='?view=players&team=KOR';a.textContent='선수명단';
      const sourceLink=nav.querySelector('[data-view="sources"]');sourceLink?nav.insertBefore(a,sourceLink):nav.appendChild(a);
    }
    if(!document.getElementById('players')){
      const section=document.createElement('section');section.id='players';section.className='avc-section avc-view';section.innerHTML=`<div class="avc-section-head"><div><p class="eyebrow">OFFICIAL ROSTERS</p><h2>선수명단</h2></div><p>국가별 최종 엔트리 · Volleybox 바로가기</p></div><div id="avcRosterRoot" class="avc-roster-loading">선수명단 불러오는 중…</div>`;sources.insertAdjacentElement('beforebegin',section);
    }
    return true;
  };

  const playerCard=p=>{
    const number=p.number===null||p.number===''?'—':p.number;
    const missing=number==='—';
    const pos=p.position||'—';
    const ko=p.nameKo||p.officialName||p.name||'이름 미확인';
    const height=p.height?`${p.height}cm`:'키 확인 불가';
    const en=p.name||p.officialName||'';
    const link=p.volleybox?`<a class="avc-vbox" href="${esc(p.volleybox)}" target="_blank" rel="noopener noreferrer">Volleybox ↗</a>`:`<span class="avc-vbox is-missing">링크 미확인</span>`;
    return `<article class="avc-player-card"><div class="avc-player-no ${missing?'is-empty':''}">${esc(number)}</div><div class="avc-player-copy"><div class="avc-player-top"><span class="avc-player-pos">${esc(pos)}</span><h4>${esc(ko)}</h4><span class="avc-player-height">${esc(height)}</span></div><p class="avc-player-en">${esc(en)}</p><p class="avc-player-dob">${esc(fmtDob(p.dob))}</p></div>${link}</article>`;
  };

  const render=async()=>{
    const root=document.getElementById('avcRosterRoot');if(!root)return;
    try{
      const data=await loadData();const code=currentCode(data);const team=data.teams.find(t=>t.code===code)||data.teams[0];
      const tabs=data.teams.map(t=>`<button class="avc-roster-team-tab ${t.code===team.code?'is-active':''}" type="button" data-team="${t.code}"><img src="${flag(t)}" alt="" loading="lazy"><span>${esc(t.nameKo)}</span></button>`).join('');
      const players=[...team.players].sort((a,b)=>(posOrder[a.position||'']??9)-(posOrder[b.position||'']??9)||((a.number??999)-(b.number??999)));
      const warn=team.code==='BRN'?`<div class="avc-roster-warning"><strong>바레인 확인 필요</strong> · 현재 공개 출국명단은 13명입니다. 개막 당일 Volleyball World 또는 현장 엔트리에서 14번째 선수를 확인하는 즉시 갱신합니다.</div>`:'';
      root.className='';root.innerHTML=`<div class="avc-roster-toolbar"><p>선수를 누르지 않고도 이름·포지션·신장·생년월일을 빠르게 확인할 수 있습니다.</p><span>${esc(data.updatedAt.slice(0,10))} 검수</span></div><div class="avc-roster-team-tabs" role="tablist" aria-label="국가 선택">${tabs}</div><div class="avc-roster-team-head"><div class="avc-roster-team-id"><img src="${flag(team)}" alt="${esc(team.nameKo)} 국기"><div><h3>${esc(team.nameKo)} <small>${esc(team.name)}</small></h3><p>${esc(team.pool)}조 · ${team.players.length}명</p></div></div><span class="avc-roster-status ${team.code==='BRN'?'is-warning':''}">${esc(team.status)}</span></div>${warn}<div class="avc-roster-grid">${players.map(playerCard).join('')}</div><div class="avc-roster-source"><span>공식 발표·Volleyball World 우선 / 불확실한 값은 공란 유지</span><a href="${esc(team.source)}" target="_blank" rel="noopener noreferrer">명단 출처 ↗</a></div>`;
      root.querySelectorAll('[data-team]').forEach(btn=>btn.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('view','players');url.searchParams.set('team',btn.dataset.team);history.replaceState(history.state,'',url);render();window.scrollTo({top:document.getElementById('players').offsetTop-16,behavior:'smooth'})}));
    }catch(err){root.className='avc-roster-error';root.textContent='선수명단을 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.';console.error(err)}
  };

  const activate=()=>{
    if(!standalone&&new URLSearchParams(location.search).get('view')!=='players')return;
    document.querySelectorAll('.avc-view').forEach(s=>s.classList.toggle('is-active',s.id==='players'));
    document.querySelectorAll('.avc-jump a[data-view]').forEach(a=>{const on=a.dataset.view==='players';a.classList.toggle('is-active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  };

  const init=()=>{
    addStyle();
    let tries=0;const timer=setInterval(()=>{tries++;if(buildShell()){clearInterval(timer);render();setTimeout(activate,0);setTimeout(activate,250)}else if(tries>50)clearInterval(timer)},50);
  };
  if(document.readyState==='loading')addEventListener('DOMContentLoaded',init,{once:true});else init();
})();