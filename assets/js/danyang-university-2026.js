(()=>{
  const root=document.getElementById('danyangSchedule');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtDate=date=>new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(`${date}T00:00:00+09:00`));
  let data=null;
  let division='전체';
  let venue='전체';
  let auditOpen=false;
  const filtered=()=>data.matches.filter(m=>(division==='전체'||m.division===division)&&(venue==='전체'||m.venue===venue));
  const dayDiff=(a,b)=>Math.round((new Date(`${b}T00:00:00+09:00`)-new Date(`${a}T00:00:00+09:00`))/86400000);

  function auditPreliminary(){
    const matches=data.matches.filter(m=>m.stage==='예선'&&m.confirmed!==false);
    const groupMap=new Map();
    matches.forEach(m=>{
      const key=`${m.division}-${m.group}`;
      if(!groupMap.has(key))groupMap.set(key,{division:m.division,group:m.group,teams:new Set(),matches:[]});
      const g=groupMap.get(key);g.teams.add(m.home);g.teams.add(m.away);g.matches.push(m);
    });
    const rows=[];
    const issues=[];
    let duplicatePairs=0,sameDayDuplicates=0;
    groupMap.forEach(g=>{
      const expectedPerTeam=g.teams.size-1;
      const expectedGroupMatches=g.teams.size*(g.teams.size-1)/2;
      if(g.matches.length!==expectedGroupMatches)issues.push(`${g.division} ${g.group}조 경기 수 ${g.matches.length}/${expectedGroupMatches}`);
      const pairSeen=new Set();
      g.matches.forEach(m=>{const pair=[m.home,m.away].sort((a,b)=>a.localeCompare(b,'ko')).join('|');if(pairSeen.has(pair))duplicatePairs++;pairSeen.add(pair)});
      [...g.teams].sort((a,b)=>a.localeCompare(b,'ko')).forEach(team=>{
        const games=g.matches.filter(m=>m.home===team||m.away===team).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
        const dates=games.map(m=>m.date),uniqueDates=new Set(dates);
        if(uniqueDates.size!==dates.length)sameDayDuplicates++;
        const opponents=new Set(games.map(m=>m.home===team?m.away:m.home));
        if(games.length!==expectedPerTeam||opponents.size!==expectedPerTeam)issues.push(`${team} 예선 대진 ${games.length}/${expectedPerTeam}`);
        let consecutive=0,minRest=null;
        for(let i=1;i<dates.length;i++){const gap=dayDiff(dates[i-1],dates[i]);if(gap===1)consecutive++;const rest=Math.max(0,gap-1);minRest=minRest===null?rest:Math.min(minRest,rest)}
        rows.push({division:g.division,group:g.group,team,games:games.length,expected:expectedPerTeam,opponents:opponents.size,consecutive,minRest:minRest??0,ok:games.length===expectedPerTeam&&opponents.size===expectedPerTeam&&uniqueDates.size===dates.length});
      });
    });
    return {groups:groupMap.size,teams:rows.length,rows,issues,duplicatePairs,sameDayDuplicates,ok:issues.length===0&&duplicatePairs===0&&sameDayDuplicates===0};
  }

  function auditPanel(){
    const a=auditPreliminary();
    const status=a.ok?'검수 통과':'확인 필요';
    return `<section class="du-audit ${a.ok?'is-ok':'is-warning'}"><div class="du-audit-head"><div><span class="du-audit-kicker">TEAM SCHEDULE AUDIT</span><h2>팀별 예선 일정 자동 검수</h2></div><button type="button" data-audit-toggle aria-expanded="${auditOpen}">${auditOpen?'검수표 닫기':'팀별 검수표 보기'}</button></div><div class="du-audit-metrics"><div><strong>${a.teams}</strong><span>참가팀 검수</span></div><div><strong>${a.groups}</strong><span>조 편성 검수</span></div><div><strong>${a.duplicatePairs}</strong><span>중복 대진</span></div><div><strong>${a.sameDayDuplicates}</strong><span>동일 날짜 중복</span></div></div><p class="du-audit-result"><b>${status}</b> · 조별 경기 수, 팀별 상대 수, 같은 날 중복 출전, 동일 대진 중복을 점검했습니다.</p>${auditOpen?`<div class="du-audit-table-wrap"><table class="du-audit-table"><thead><tr><th>부문</th><th>조</th><th>팀</th><th>경기</th><th>상대</th><th>연속 출전일</th><th>최소 휴식일</th><th>결과</th></tr></thead><tbody>${a.rows.map(r=>`<tr><td>${esc(r.division)}</td><td>${esc(r.group)}조</td><td>${esc(r.team)}</td><td>${r.games}/${r.expected}</td><td>${r.opponents}/${r.expected}</td><td>${r.consecutive}회</td><td>${r.minRest}일</td><td><span class="${r.ok?'du-audit-pass':'du-audit-fail'}">${r.ok?'정상':'확인'}</span></td></tr>`).join('')}</tbody></table></div>`:''}</section>`;
  }

  function controls(){
    return `<div class="du-controls"><div role="group" aria-label="부문 선택">${['전체','남대부','여대부'].map(x=>`<button data-division="${x}" class="${division===x?'active':''}">${x}</button>`).join('')}</div><div role="group" aria-label="경기장 선택">${['전체','national','culture'].map(x=>`<button data-venue="${x}" class="${venue===x?'active':''}">${x==='전체'?'전체 경기장':esc(data.venues[x])}</button>`).join('')}</div></div>`;
  }
  function matchRow(m){
    const meta=[m.division,m.group?`${m.group}조`:'',m.stage,m.broadcast?'TV 중계':''].filter(Boolean).join(' · ');
    const state=m.confirmed===false?'<span class="du-pending">대진 미확정</span>':'<span class="du-confirmed">공식 일정</span>';
    return `<article class="du-match ${m.confirmed===false?'is-pending':''}"><time>${esc(m.time||'시간 확인 중')}</time><div class="du-match-main"><span class="du-meta">${esc(meta)} · ${state}</span><strong>${esc(m.home)} <em>vs</em> ${esc(m.away)}</strong>${m.note?`<small>${esc(m.note)}</small>`:''}</div><span class="du-venue">${esc(data.venues[m.venue])}</span></article>`;
  }
  function render(){
    const list=filtered();
    const confirmed=list.filter(m=>m.confirmed!==false).length;
    const conditional=list.length-confirmed;
    const groups={};
    list.forEach(m=>(groups[m.date]||(groups[m.date]=[])).push(m));
    root.innerHTML=`${auditPanel()}${controls()}<div class="du-summary"><strong>공식 일정표 등록 ${list.length}경기</strong><span>대진 확정 ${confirmed}경기 · 조건부 대진 ${conditional}경기 · 한국시간 기준</span></div><div class="du-days">${Object.entries(groups).map(([date,matches])=>`<section class="du-day"><header><h2>${fmtDate(date)}</h2><span>${matches.length}경기</span></header><div class="du-list">${matches.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||a.venue.localeCompare(b.venue)).map(matchRow).join('')}</div></section>`).join('')}</div>`;
    root.querySelector('[data-audit-toggle]')?.addEventListener('click',()=>{auditOpen=!auditOpen;render()});
    root.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{division=b.dataset.division;render()});
    root.querySelectorAll('[data-venue]').forEach(b=>b.onclick=()=>{venue=b.dataset.venue;render()});
  }
  fetch('data/matches/danyang-university-2026.json?v=20260722-3',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('schedule');return r.json()}).then(json=>{data=json;document.getElementById('danyangNotice').textContent=json.competition.notice;render()}).catch(()=>{root.innerHTML='<div class="du-error">경기 일정을 불러오지 못했습니다.</div>'});
})();