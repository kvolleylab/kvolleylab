(() => {
  const DATA_URL='data/national/national_team_history_v1.json';
  const CONTEXT_URL='data/national/national_team_context_v1.json';
  const LEGACY_URLS=['data/national/national_team_history_2018_2019.json','data/national/national_team_history_2016_2017.json','data/national/national_team_history_2014_2015.json','data/national/national_team_roster_2014_u18.json','data/national/national_team_history_2012_2013.json','data/national/national_team_roster_2012_u20.json','data/national/national_team_history_2010_2011.json','data/national/national_team_status_2015_corrections.json','data/national/national_team_world_u23_2015.json','data/national/national_team_roster_2010_u18.json','data/national/national_team_research_2010_u20.json','data/national/national_team_roster_2019_u19.json'];
  const LINK_URL='data/national/player_id_links_v1.json';
  const params=new URLSearchParams(location.search),scope=['senior','age'].includes(params.get('scope'))?params.get('scope'):'all';
  const AGE_LEVELS=['all','U16','U17','U18','U19','U20','U21','U23'];
  const SENIOR_CATEGORIES=['all','world','asia','olympic'];
  const requestedLevel=String(params.get('level')||'all').toUpperCase();
  const requestedCategory=String(params.get('category')||'all').toLowerCase();
  let targetEvent=String(params.get('event')||'');
  let targetFocused=false;
  let ageLevel=scope==='age'&&AGE_LEVELS.includes(requestedLevel)?requestedLevel:'all';
  let ageGender=scope==='age'&&['women','W'].includes(params.get('gender'))?'women':'men';
  let seniorCategory=scope==='senior'&&SENIOR_CATEGORIES.includes(requestedCategory)?requestedCategory:'all';
  const yearFilter=document.getElementById('yearFilter'),levelFilter=document.getElementById('levelFilter'),eventList=document.getElementById('eventList'),summaryGrid=document.getElementById('summaryGrid'),coverageList=document.getElementById('coverageList');
  let db; const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); const yearOf=d=>String(d||'').slice(0,4); const key=r=>`${r.name_ko}|${r.birth_date}`;
  const isAgeLevel=level=>/^U\d+$/i.test(String(level||'').trim());
  const inScope=e=>scope==='age'?isAgeLevel(e.level)&&(ageGender==='women'?String(e.gender).toUpperCase()==='W':String(e.gender).toUpperCase()!=='W'):scope==='senior'?!isAgeLevel(e.level):true;
  const eventText=e=>[e.organization,e.competition_name_ko,e.competition_name_en,e.level].filter(Boolean).join(' ');
  const seniorBucket=e=>{const text=eventText(e);if(/olympic|올림픽/i.test(text))return'olympic';if(/\bAVC\b|asian|asia|아시아|아시안/i.test(text))return'asia';if(/\bFIVB\b|\bVNL\b|nations league|world|세계|월드/i.test(text))return'world';return'other';};
  const inSeniorCategory=e=>seniorCategory==='all'||seniorBucket(e)===seniorCategory;
  const merge=x=>{if(!x)return;db.events=[...(x.events||[]),...db.events];db.sources=[...(x.sources||[]),...db.sources];db.rosters=[...(x.rosters||[]),...db.rosters];};
  const syncAgeTabs=()=>document.querySelectorAll('#ageLevelTabs button').forEach(btn=>{const current=btn.dataset.level===ageLevel;btn.classList.toggle('active',current);btn.setAttribute('aria-pressed',String(current));});
  const syncSeniorTabs=()=>document.querySelectorAll('#seniorCategoryTabs button').forEach(btn=>{const current=btn.dataset.category===seniorCategory;btn.classList.toggle('active',current);btn.setAttribute('aria-pressed',String(current));});
  function clearTarget(){if(!targetEvent)return;targetEvent='';targetFocused=false;const url=new URL(location.href);url.searchParams.delete('event');history.replaceState(history.state,'',url);}
  function setAgeLevel(level){if(!AGE_LEVELS.includes(level))return;clearTarget();ageLevel=level;const url=new URL(location.href);if(level==='all')url.searchParams.delete('level');else url.searchParams.set('level',level);history.replaceState(history.state,'',url);syncAgeTabs();render();}
  function setSeniorCategory(category){if(!SENIOR_CATEGORIES.includes(category))return;clearTarget();seniorCategory=category;const url=new URL(location.href);if(category==='all')url.searchParams.delete('category');else url.searchParams.set('category',category);history.replaceState(history.state,'',url);syncSeniorTabs();render();}
  function renderAgeTabs(){if(scope!=='age')return;let tabs=document.getElementById('ageLevelTabs');if(!tabs){tabs=document.createElement('nav');tabs.id='ageLevelTabs';tabs.className='age-level-tabs';tabs.setAttribute('aria-label','연령별 대표팀 단계');tabs.innerHTML=AGE_LEVELS.map(level=>`<button type="button" data-level="${level}" aria-pressed="false">${level==='all'?'전체':level}</button>`).join('');document.querySelector('.toolbar')?.insertAdjacentElement('beforebegin',tabs);tabs.addEventListener('click',e=>{const button=e.target.closest('button[data-level]');if(button)setAgeLevel(button.dataset.level);});}if(levelFilter?.parentElement)levelFilter.parentElement.hidden=true;syncAgeTabs();}
  function renderSeniorTabs(){if(scope!=='senior')return;let tabs=document.getElementById('seniorCategoryTabs');if(!tabs){const labels={all:'전체',world:'세계대회',asia:'AVC·아시아',olympic:'올림픽'};tabs=document.createElement('nav');tabs.id='seniorCategoryTabs';tabs.className='age-level-tabs senior-category-tabs';tabs.setAttribute('aria-label','성인 대표팀 대회 유형');tabs.innerHTML=SENIOR_CATEGORIES.map(category=>`<button type="button" data-category="${category}" aria-pressed="false">${labels[category]}</button>`).join('');document.querySelector('.toolbar')?.insertAdjacentElement('beforebegin',tabs);tabs.addEventListener('click',e=>{const button=e.target.closest('button[data-category]');if(button)setSeniorCategory(button.dataset.category);});}if(levelFilter?.parentElement)levelFilter.parentElement.hidden=true;syncSeniorTabs();}
  function fillYears(){
    const previous=yearFilter.value;
    const years=[...new Set(db.events.filter(inScope).map(e=>e.year))].sort((a,b)=>b-a);
    yearFilter.innerHTML='<option value="all">전체</option>'+years.map(y=>'<option value="'+esc(y)+'">'+esc(y)+'</option>').join('');
    if([...yearFilter.options].some(o=>o.value===previous))yearFilter.value=previous;
  }
  function updateAgeGender(){
    const switcher=document.getElementById('ageGenderSwitch'),notice=document.getElementById('ageGenderNotice');
    if(scope!=='age')return;
    document.body.classList.add('nt-age-mode');
    if(switcher)switcher.hidden=false;
    if(notice)notice.hidden=ageGender!=='women';
    document.querySelectorAll('[data-age-gender]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ageGender===ageGender)));
    const title=document.querySelector('.nt-history-wrap h1'),lead=document.querySelector('.nt-history-wrap .lead');
    if(title)title.textContent='대한민국 연령별 대표팀'; // Age-specific gender is shown by the selected functional toggle.
    if(lead)lead.textContent=ageGender==='women'?'공식 자료가 검증된 대회와 명단을 차례로 연결합니다. 아직 구축되지 않은 기록은 미출전과 구분합니다.':'연도와 연령대를 선택해 역대 출전대회, 그 당시 선수명단과 성적을 확인하세요.';
    document.title=(ageGender==='women'?'여자':'남자')+' 연령별 대표팀 | K-Volley Lab';
    const cta=document.getElementById('cohortCta');
    if(cta)cta.hidden=ageGender==='women';
  }
  function setAgeGender(value){
    if(scope!=='age'||!['men','women'].includes(value)||value===ageGender)return;
    clearTarget();
    ageGender=value;
    const url=new URL(location.href);
    if(value==='women')url.searchParams.set('gender','women');else url.searchParams.delete('gender');
    url.searchParams.delete('event');
    history.replaceState(history.state,'',url);
    yearFilter.value='all';fillYears();updateAgeGender();coverage();render();
  }
  function setup(){
    if(scope==='age'){
      const switcher=document.getElementById('ageGenderSwitch');
      if(switcher)switcher.addEventListener('click',e=>{const button=e.target.closest('button[data-age-gender]');if(button)setAgeGender(button.dataset.ageGender);});
      updateAgeGender();
    }
    fillYears();
    [...new Set(db.events.filter(inScope).map(e=>e.level))].sort().forEach(l=>levelFilter.insertAdjacentHTML('beforeend','<option value="'+esc(l)+'">'+esc(l)+'</option>'));
    const target=db.events.find(e=>e.event_id===targetEvent&&inScope(e));
    if(target){
      if([...yearFilter.options].some(o=>o.value===String(target.year)))yearFilter.value=String(target.year);
      if(scope==='age'){const targetLevel=String(target.level||'').toUpperCase();ageLevel=AGE_LEVELS.includes(targetLevel)?targetLevel:'all';}
      else if(scope==='senior'){const category=seniorBucket(target);seniorCategory=SENIOR_CATEGORIES.includes(category)?category:'all';}
    }
    const title=document.querySelector('.nt-history-wrap h1'),lead=document.querySelector('.nt-history-wrap .lead');
    if(scope==='senior'){
      if(title)title.textContent='대한민국 남자 성인 대표팀 히스토리';
      if(lead)lead.textContent='성인 대표팀의 역사 기록을 조회합니다. 종합 연혁은 올림픽·대표팀 로드맵에서 확인할 수 있습니다.';
      const crumb=document.getElementById('historyBreadcrumbCurrent');if(crumb)crumb.textContent='성인 대표팀 기록';
      renderSeniorTabs();
    }else if(scope==='age')renderAgeTabs();
  }
  function summary(events){
    const ids=new Set(events.map(e=>e.event_id));
    const scopedRosters=db.rosters.filter(r=>ids.has(r.event_id));
    const years=[...new Set(events.map(e=>Number(e.year)).filter(Boolean))].sort((a,b)=>a-b);
    const range=years.length?(years.length===1?String(years[0]):years[0]+'–'+years[years.length-1]):'등록 없음';
    summaryGrid.innerHTML=[[events.length,'등록 대회·상태'],[scopedRosters.length,'선수 명단 기록'],[new Set(scopedRosters.map(r=>yearOf(r.birth_date)).filter(Boolean)).size,'연결 세대'],[range,'자료 등록 연도']].map(([v,l])=>'<article class="summary-card"><strong>'+esc(v)+'</strong><span>'+l+'</span></article>').join('');
  }
  function pLink(r){return r.player_id?`<a href="player.html?id=${encodeURIComponent(r.player_id)}">${esc(r.name_ko)}</a>`:`<span>${esc(r.name_ko)}</span>`;}
  function rosterBlock(e,rs){
    if(!rs.length){
      const state=e.participation_status;
      const t=state==='competition_cancelled'?'대회 자체가 취소되어 대표팀 출전 명단이 없습니다.':state==='qualified_then_withdrew'?'출전권 확보 후 철회하여 최종 출전 명단이 없습니다.':state==='not_participated'?'한국이 이 대회에 참가하지 않았습니다.':state==='not_qualified'?'한국이 이 대회 출전권을 획득하지 못했습니다.':state==='research_pending'?'참가 여부 및 선수명단을 공식 자료로 추가 확인 중입니다.':'대회 정보는 등록되어 있으나 선수명단은 아직 구축되지 않았습니다.';
      return '<div class="empty">'+esc(t)+'</div>';
    }
    const rows=rs.map(r=>{
      const by=yearOf(r.birth_date),number=r.shirt_no??'-';
      return '<tr><td data-label="번호">'+esc(number)+'</td>'+
      '<td data-label="선수">'+pLink(r)+(r.captain?' <span class="captain" title="주장">C</span>':'')+'</td>'+
      '<td data-label="생년월일">'+esc(r.birth_date||'-')+'</td>'+
      '<td data-label="포지션">'+esc(r.position||'-')+'</td>'+
      '<td data-label="키">'+(r.height_cm?esc(r.height_cm)+'cm':'-')+'</td>'+
      '<td data-label="당시 소속">'+esc(r.club_snapshot||'-')+'</td>'+
      '<td data-label="세대">'+(by?'<a class="cohort-link" href="player-cohort.html?country=KOR&gender=M&birth_year='+encodeURIComponent(by)+'">'+esc(by)+'년생</a>':'-')+'</td></tr>';
    }).join('');
    return '<div class="table-scroll"><table><caption class="nt-roster-caption">'+esc(e.year)+' '+esc(e.level)+' 당시 대표선수 명단</caption><thead><tr><th>NO</th><th>선수</th><th>DOB</th><th>POS</th><th>키</th><th>당시 소속</th><th>세대</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  }
  function quality(e){
    if(e.participation_status==='competition_cancelled')return '대회 취소';
    if(e.participation_status==='not_participated')return '미참가';
    if(e.participation_status==='qualified_then_withdrew')return '출전 철회';
    if(e.participation_status==='not_qualified')return '미진출';
    const st=String(e.roster_status||'');
    if(st==='verified_official')return '공식 명단';
    if(/reconstructed|archive|crosscheck|secondary|copy/.test(st))return '원문 추가 대조';
    if(/pending|research|partial/.test(st))return '자료 확인 중';
    return '확인 상태 기록';
  }
  function focusTarget(){if(!targetEvent||targetFocused)return;const card=[...eventList.querySelectorAll('.event-card')].find(el=>el.dataset.eventId===targetEvent);if(!card)return;targetFocused=true;card.classList.add('is-target');card.setAttribute('tabindex','-1');setTimeout(()=>{card.scrollIntoView({behavior:'smooth',block:'center'});try{card.focus({preventScroll:true})}catch{}},80);}
  function render(){
    const y=yearFilter.value,l=scope==='age'?ageLevel:scope==='senior'?'all':levelFilter.value;
    const events=db.events.filter(e=>inScope(e)&&inSeniorCategory(e)&&(y==='all'||String(e.year)===y)&&(l==='all'||String(e.level).toUpperCase()===l)).sort((a,b)=>Number(b.year)-Number(a.year)||String(b.start_date||'').localeCompare(String(a.start_date||''))||String(a.event_id).localeCompare(String(b.event_id)));
    summary(events);
    if(!events.length){
      const message=scope==='age'&&ageGender==='women'?'여자 연령별 대표팀의 검증된 기록이 아직 등록되지 않았습니다. 자료 미구축은 미출전이나 미선발을 뜻하지 않습니다.':'선택한 조건에 등록된 대회 기록이 없습니다. 기록 미구축과 미참가는 서로 다릅니다.';
      eventList.innerHTML='<div class="empty" role="status">'+message+'</div>';return;
    }
    eventList.innerHTML=events.map(e=>{
      const rs=db.rosters.filter(r=>r.event_id===e.event_id).sort((a,b)=>Number(a.shirt_no??999)-Number(b.shirt_no??999)||String(a.name_ko).localeCompare(String(b.name_ko),'ko'));
      const src=(e.source_ids||[]).map(id=>db.sources.find(s=>s.source_id===id)).filter(Boolean);
      const details=scope==='age'
        ?'<details class="nt-age-roster-details"'+(e.event_id===targetEvent?' open':'')+'><summary>선수명단 '+rs.length+'명 · 상세 보기 <span aria-hidden="true">⌄</span></summary>'+rosterBlock(e,rs)+'</details>'
        :rosterBlock(e,rs);
      const date=e.start_date?esc(e.start_date)+(e.end_date?' ~ '+esc(e.end_date):''):'대회 일정 미확인';
      return '<article class="event-card" data-event-id="'+esc(e.event_id)+'"><div class="event-head"><div><div class="eyebrow">'+esc(e.year)+' · '+esc(e.level)+' · '+esc(e.organization||'')+'</div><h2>'+esc(e.competition_name_ko)+'</h2></div><div class="result-badge">'+esc(e.result||'결과 확인 중')+'</div></div>'+
        '<div class="event-meta"><span>감독 '+esc(e.head_coach||'미확인')+'</span><span>'+date+'</span><span>명단 '+rs.length+'명</span><span class="nt-age-quality">'+quality(e)+'</span></div>'+
        details+(e.note?'<p class="small">'+esc(e.note)+'</p>':'')+
        '<div class="source-row">출처 확인'+src.map(v=>' · <a href="'+esc(v.url||'#')+'" target="_blank" rel="noopener noreferrer">'+esc(v.publisher||'원문')+'</a>').join('')+'</div></article>';
    }).join('');
    focusTarget();
  }
  function coverage(){
    if(scope==='age'){
      const items=db.events.filter(inScope);
      const official=items.filter(e=>e.roster_status==='verified_official').length;
      const verify=items.filter(e=>/reconstructed|crosscheck|secondary|copy/.test(String(e.roster_status||''))).length;
      const other=items.length-official-verify;
      coverageList.innerHTML=[['공식 확인 명단 대회',official],['원문 추가 대조',verify],['기타 대회·참가 상태',other]].map(([label,value])=>'<div class="coverage-row"><span>'+label+'</span><b>'+value+'건</b></div>').join('');
      if(!items.length)coverageList.innerHTML='<p class="small">이 성별의 연령별 대회 자료는 아직 등록되지 않았습니다.</p>';
      return;
    }
    coverageList.innerHTML=(db.coverage||[]).map(x=>'<div class="coverage-row"><span>'+(x.from===x.to?x.from:x.from+'–'+x.to)+'</span><b data-status="'+esc(x.status)+'">'+esc(x.status)+'</b></div>').join('');
  }
  async function init(){try{const [base,ctx,links,...legacy]=await Promise.all([fetch(DATA_URL),fetch(CONTEXT_URL).catch(()=>null),fetch(LINK_URL).catch(()=>null),...LEGACY_URLS.map(u=>fetch(u).catch(()=>null))]);if(!base.ok)throw new Error(`HTTP ${base.status}`);db=await base.json();if(ctx&&ctx.ok)merge(await ctx.json());for(const r of legacy)if(r&&r.ok)merge(await r.json());db.events=db.events.filter((e,i,a)=>a.findIndex(x=>x.event_id===e.event_id)===i);
      // Read-time only: overlapping official/history snapshots must not show duplicate roster rows.
      const uniqueRosters=new Map();
      const completeness=r=>[r.player_id,r.source_id,r.position,r.height_cm,r.club_snapshot].filter(Boolean).length;
      for(const r of db.rosters){
        const k=[r.event_id,r.name_ko,r.birth_date||r.shirt_no||''].join('|');
        const old=uniqueRosters.get(k);
        if(!old||completeness(r)>=completeness(old))uniqueRosters.set(k,r);
      }
      db.rosters=[...uniqueRosters.values()];if(links&&links.ok){const m=new Map((await links.json()).links.map(x=>[`${x.name_ko}|${x.birth_date}`,x.player_id]));db.rosters.forEach(r=>{if(!r.player_id&&m.has(key(r)))r.player_id=m.get(key(r));});}setup();coverage();render();yearFilter.addEventListener('change',()=>{clearTarget();render();});levelFilter.addEventListener('change',()=>{clearTarget();render();});}catch(err){eventList.innerHTML=`<div class="empty">대표팀 DB를 불러오지 못했습니다. ${esc(err.message)}</div>`;}}init();
})();
