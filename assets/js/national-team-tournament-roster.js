(()=>{
  const params=new URLSearchParams(location.search);
  const competitionParam=params.get('competition')||'avc-men-continental-2026';
  const countryParam=params.get('country')||'대한민국';
  const hero=document.getElementById('ntRosterHero');
  const status=document.getElementById('ntRosterStatus');
  const summary=document.getElementById('ntRosterSummary');
  const players=document.getElementById('ntRosterPlayers');
  const sources=document.getElementById('ntRosterSources');
  const back=document.getElementById('ntRosterBack');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
  const display=s=>s===null||s===undefined||s===''?'—':esc(s);
  const positionText=p=>Array.isArray(p)?p.filter(Boolean).join(' / '):(p||'—');

  function renderPlayerTable(team){
    const rows=(team.players||[]).map(p=>{
      const vb=p.volleybox_url?`<a class="ntroster-vb" href="${esc(p.volleybox_url)}" target="_blank" rel="noopener noreferrer">Volleybox ↗</a>`:'—';
      const nameKo=p.name_ko?`<span class="ntroster-name-ko">${esc(p.name_ko)}</span>`:'';
      return `<tr>
        <td class="ntroster-no">${display(p.number)}</td>
        <td class="ntroster-name"><strong>${esc(p.name||'—')}</strong>${nameKo}</td>
        <td><span class="ntroster-position">${esc(positionText(p.positions))}</span></td>
        <td>${display(p.dob)}</td>
        <td>${p.height_cm?`${esc(p.height_cm)}cm`:'—'}</td>
        <td>${vb}</td>
      </tr>`;
    }).join('');
    players.className='ntroster-players-wrap';
    players.innerHTML=`<div class="ntroster-table-scroll"><table class="ntroster-table"><thead><tr><th>No.</th><th>선수명</th><th>포지션</th><th>생년월일</th><th>키</th><th>프로필</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  async function fetchOptionalJson(url){
    try{
      const r=await fetch(url,{cache:'no-store'});
      return r.ok?await r.json():null;
    }catch(_){return null;}
  }

  async function loadAvcMenCup(){
    const [master,indexData,rosterData,extendedData,extendedData2,extendedData3,extendedData4]=await Promise.all([
      fetch('data/master/competition_master.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('master');return r.json();}),
      fetch('data/competition/avc-men-cup-2026-men-roster-index.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('index');return r.json();}),
      fetch('data/competition/avc-men-cup-2026-men-rosters.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('rosters');return r.json();}),
      fetchOptionalJson('data/competition/avc-men-cup-2026-men-rosters-verified-2.json'),
      fetchOptionalJson('data/competition/avc-men-cup-2026-men-rosters-verified-3.json'),
      fetchOptionalJson('data/competition/avc-men-cup-2026-men-rosters-verified-4.json'),
      fetchOptionalJson('data/competition/avc-men-cup-2026-men-rosters-verified-5.json')
    ]);
    const item=(master||[]).find(x=>x?.system?.competition_id==='KVL-COMP-000003'||x?.system?.slug==='avc-men-cup-2026');
    if(!item)throw new Error('competition not found');
    const requested=norm(countryParam);
    const teams=[...((extendedData4&&extendedData4.teams)||[]),...((extendedData3&&extendedData3.teams)||[]),...(rosterData.teams||[]),...((extendedData&&extendedData.teams)||[]),...((extendedData2&&extendedData2.teams)||[])];
    const roster=teams.find(t=>[t.country,t.country_ko,t.participant_id,String(t.official_team_id)].some(v=>norm(v)===requested));
    const indexEntry=(indexData.rosters||[]).find(r=>roster?r.participant_id===roster.participant_id:[r.country,r.country_ko,r.participant_id].some(v=>norm(v)===requested));
    const countryName=roster?.country_ko||indexEntry?.country_ko||countryParam;
    const imported=Boolean(roster);
    const id=item.identity||{};
    const fmt=item.format||{};
    document.title=`${countryName} · ${id.name_ko} 로스터 | K-Volley Lab`;
    back.href='avc-men-cup.html';
    back.textContent='← AVC Men’s Cup';
    hero.dataset.gender='men';
    hero.innerHTML=`<p class="eyebrow">MEN · TOURNAMENT ROSTER</p><h1>${esc(countryName)}</h1><p>${esc(id.name_ko)} 대회 전용 공식 로스터</p><div class="ntroster-chips"><span>AVC · 아시아</span><span>${esc(fmt.dates||'2026')}</span><span>${esc(fmt.host||'Ahmedabad, India')}</span></div>`;
    status.textContent=imported?'검수 완료':'검수 완료 · 반영 대기';
    status.className=`ntroster-status ${imported?'active':'pending'}`;
    summary.innerHTML=`<article><span>대회</span><strong>${esc(id.name_ko)}</strong></article><article><span>엔트리 상태</span><strong>${imported?`${(roster.players||[]).length}명 반영 완료`:'공식 명단 검수 완료'}</strong></article><article><span>로스터 기준</span><strong>Volleyball World 공식 대회 엔트리</strong></article>`;
    if(imported){
      renderPlayerTable(roster);
    }else{
      players.className='ntroster-empty';
      players.innerHTML='이 국가의 공식 명단은 검수를 마쳤으며 사이트 데이터 반영을 진행 중입니다.';
    }
    const sourceLinks=[];
    if(indexEntry?.official_team_url)sourceLinks.push(`<a href="${esc(indexEntry.official_team_url)}" target="_blank" rel="noopener noreferrer">Volleyball World 팀 엔트리 ↗</a>`);
    if(item.data_links?.official)sourceLinks.push(`<a href="${esc(item.data_links.official)}" target="_blank" rel="noopener noreferrer">2026 AVC Men's Cup 공식 페이지 ↗</a>`);
    sources.innerHTML=sourceLinks.join('')||'<span>공식 출처 연결 준비 중입니다.</span>';
  }

  async function loadContinental(){
    const competitionId=competitionParam;
    const country=countryParam;
    const gender=competitionId.includes('-women-')||competitionId.includes('women')?'women':'men';
    const data=await fetch('data/national/continental-championships-2026.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('continental');return r.json();});
    const item=(data.competitions||[]).find(x=>x.id===competitionId);
    if(!item)throw new Error('competition not found');
    const participantNames=(item.participants||[]).map(x=>typeof x==='string'?x:x.name_ko).filter(Boolean);
    const isParticipant=participantNames.includes(country);
    document.title=`${country} · ${item.name_ko} 로스터 | K-Volley Lab`;
    back.href=`continental-championship-2026.html?id=${encodeURIComponent(item.id)}`;
    back.textContent=`← ${item.name_ko}`;
    hero.dataset.gender=gender;
    hero.innerHTML=`<p class="eyebrow">${gender==='women'?'WOMEN':'MEN'} · TOURNAMENT ROSTER</p><h1>${esc(country)}</h1><p>${esc(item.name_ko)} 대회 전용 공식 로스터</p><div class="ntroster-chips"><span>${esc(item.confederation)} · ${esc(item.region_ko)}</span><span>${esc(item.dates)}</span><span>${esc(item.host)}</span></div>`;
    status.textContent='공식 엔트리 대기';
    status.className='ntroster-status pending';
    summary.innerHTML=`<article><span>대회</span><strong>${esc(item.name_ko)}</strong></article><article><span>참가국 상태</span><strong>${isParticipant?'공식 참가국 확인':'참가 여부 확인 필요'}</strong></article><article><span>로스터 기준</span><strong>대회 공식 등록 엔트리</strong></article>`;
    players.className='ntroster-empty';
    players.innerHTML='대회 공식 엔트리가 확인되면 선수명 · 한글명 · 포지션 · 생년월일 · 키 · Volleybox 링크를 연결합니다.';
    const sourceLinks=[];
    if(item.official_url)sourceLinks.push(`<a href="${esc(item.official_url)}" target="_blank" rel="noopener">${esc(item.source_label||'대륙연맹 공식 발표')} ↗</a>`);
    if(item.calendar_url)sourceLinks.push(`<a href="${esc(item.calendar_url)}" target="_blank" rel="noopener">${esc(item.calendar_label||'공식 캘린더')} ↗</a>`);
    sources.innerHTML=sourceLinks.join('')||'<span>공식 로스터 출처 확인 후 연결합니다.</span>';
  }

  const isAvcMenCup=['avc-men-cup-2026','avc-men-cup','kvl-comp-000003'].includes(norm(competitionParam));
  (isAvcMenCup?loadAvcMenCup():loadContinental()).catch(()=>{
    hero.innerHTML='<p class="eyebrow">NATIONAL TEAM</p><h1>로스터 정보를 불러오지 못했습니다.</h1><p>대회 및 국가 정보를 다시 확인해주세요.</p>';
    status.textContent='불러오기 실패';
    status.className='ntroster-status pending';
  });
})();