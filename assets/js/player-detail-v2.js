(()=>{
  const masterUrls=['data/master/player_master_229_v2.json','data/master/player_master_international_v1.json'];
  const timelineUrl='data/timeline/player_timeline_v1.json';
  const area=document.getElementById('playerArea');
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const val=(v,f='-')=>v===null||v===undefined||v===''?f:String(v);

  Promise.all([
    Promise.all(masterUrls.map(url=>fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(url);return r.json()}))).then(groups=>groups.flat()),
    fetch(timelineUrl,{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[])
  ]).then(([players,timelines])=>{
    const q=new URLSearchParams(location.search);const id=q.get('id');const name=q.get('name');
    const player=players.find(p=>p.system?.player_id===id)||players.find(p=>name&&((p.identity?.name_ko||'').toLowerCase()===name.toLowerCase()||(p.identity?.name_en||'').toLowerCase()===name.toLowerCase()));
    const timeline=timelines.find(t=>t.player_id===player?.system?.player_id)?.events||[];render(player,timeline);
  }).catch(()=>{area.innerHTML='<div class="pd-empty">선수 데이터를 불러오지 못했습니다.</div>'});

  function renderTimeline(events){if(!events.length)return '<div class="pd-empty">확인된 성장·이적 이력이 아직 연결되지 않았습니다.</div>';return[...events].sort((a,b)=>String(b.start_date||b.year||'').localeCompare(String(a.start_date||a.year||''))).map(event=>{const period=event.end_date?`${val(event.start_date,event.year)} ~ ${event.end_date}`:`${val(event.start_date,event.year)} ~ 현재`;const title=event.team||event.organization||event.title||'-';const detail=[event.position,event.note].filter(Boolean).join(' · ');return`<div class="pd-timeline-item"><div class="pd-timeline-year">${esc(period)}</div><div><strong>${esc(title)}</strong><div>${esc(detail)}</div><small>${esc(event.event_type||'')}</small></div></div>`}).join('')}

  function render(p,timelineEvents){
    if(!p){area.innerHTML='<div class="pd-empty">선수를 찾을 수 없습니다.</div>';return}
    const s=p.system||{},i=p.identity||{},ph=p.physical||{},v=p.volleyball||{},l=p.links||{},r=p.current_roster||{};
    const title=i.name_ko||i.name_en||'선수';const grade=r.grade??v.grade??'';const draft=Boolean(r.draft_eligible??v.draft_eligible??false);const school=r.school_name||r.team_name||v.national_team||'';
    document.title=`${title} | K-Volley Lab`;
    const ext=[['Volleybox',l.volleybox],['FIVB / VNL',l.fivb_profile],['KOVO',l.kovo_profile],['Instagram',l.instagram],['YouTube',l.youtube]].filter(([,u])=>u).map(([n,u])=>`<a href="${esc(u)}" target="_blank" rel="noopener">${n}</a>`).join('');
    const sources=(p.source_ids||[]).map(x=>`<div class="pd-source">${esc(x)}</div>`).join('')||'<div class="pd-empty">출처 ID 연결 준비 중</div>';
    const timeline=renderTimeline(timelineEvents);
    area.innerHTML=`<section class="pd-hero"><div class="pd-card"><p class="eyebrow">K-Volley Lab Player</p><h1 class="pd-title">${esc(title)}</h1><div class="pd-sub">${esc(val(i.name_en,''))}</div><div class="pd-badges"><span class="pd-badge">${esc(val(i.nationality))}</span><span class="pd-badge">${esc(val(v.position||r.position))}</span><span class="pd-badge">${ph.height_cm?`${esc(ph.height_cm)}cm`:'키 확인 불가'}</span>${grade?`<span class="pd-badge">${esc(grade)}학년</span>`:''}${draft?'<span class="pd-badge">드래프트 대상</span>':''}</div></div><div class="pd-card"><div class="pd-summary"><div class="pd-stat"><span>소속</span><strong>${esc(val(school))}</strong></div><div class="pd-stat"><span>학년</span><strong>${grade?`${esc(grade)}학년`:'-'}</strong></div><div class="pd-stat"><span>등번호</span><strong>${esc(val(r.jersey_number))}</strong></div><div class="pd-stat"><span>상태</span><strong>${draft?'드래프트 대상':esc(val(v.entry_status||s.status))}</strong></div></div></div></section><section class="pd-grid"><article class="pd-card pd-section"><h2>기본정보</h2><div class="pd-info"><div class="pd-info-item"><span>한글명</span><strong>${esc(val(i.name_ko))}</strong></div><div class="pd-info-item"><span>영문명</span><strong>${esc(val(i.name_en))}</strong></div><div class="pd-info-item"><span>생년월일</span><strong>${esc(val(i.birth_date))}</strong></div><div class="pd-info-item"><span>포지션</span><strong>${esc(val(v.position||r.position))}</strong></div><div class="pd-info-item"><span>키</span><strong>${ph.height_cm?`${esc(ph.height_cm)}cm`:'키 확인 불가'}</strong></div><div class="pd-info-item"><span>체중</span><strong>${ph.weight_kg?`${esc(ph.weight_kg)}kg`:'-'}</strong></div><div class="pd-info-item"><span>출신학교</span><strong>${esc(val(r.previous_school))}</strong></div></div></article><article class="pd-card pd-section"><h2>공식 링크</h2><div class="pd-links">${ext||'<div class="pd-empty">공식 프로필 링크 준비 중</div>'}</div></article><article class="pd-card pd-section"><h2>Career Timeline</h2><div class="pd-timeline">${timeline}</div></article><article class="pd-card pd-section"><h2>대회 참가 이력</h2><div class="pd-empty">VNL·AVC·국가대표·학교대회 로스터가 Competition Master와 연결되면 자동 표시됩니다.</div></article><article class="pd-card pd-section"><h2>출처</h2><div class="pd-source-list">${sources}</div></article><article class="pd-card pd-section"><h2>정보 정정</h2><div class="pd-empty">공개 출처와 다른 정보가 있다면 Request 메뉴를 통해 선수명과 수정 근거를 보내주세요.</div></article></section>`;
  }
})();