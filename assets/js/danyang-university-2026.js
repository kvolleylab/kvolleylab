(()=>{
  const root=document.getElementById('danyangSchedule');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtDate=date=>new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(`${date}T00:00:00+09:00`));
  let data=null;
  let division='전체';
  let venue='전체';
  const filtered=()=>data.matches.filter(m=>(division==='전체'||m.division===division)&&(venue==='전체'||m.venue===venue));
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
    root.innerHTML=`${controls()}<div class="du-summary"><strong>공식 일정표 등록 ${list.length}경기</strong><span>대진 확정 ${confirmed}경기 · 조건부 대진 ${conditional}경기 · 한국시간 기준</span></div><div class="du-days">${Object.entries(groups).map(([date,matches])=>`<section class="du-day"><header><h2>${fmtDate(date)}</h2><span>${matches.length}경기</span></header><div class="du-list">${matches.sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||a.venue.localeCompare(b.venue)).map(matchRow).join('')}</div></section>`).join('')}</div>`;
    root.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{division=b.dataset.division;render()});
    root.querySelectorAll('[data-venue]').forEach(b=>b.onclick=()=>{venue=b.dataset.venue;render()});
  }
  fetch('data/matches/danyang-university-2026.json?v=20260722-2',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('schedule');return r.json()}).then(json=>{data=json;document.getElementById('danyangNotice').textContent=json.competition.notice;render()}).catch(()=>{root.innerHTML='<div class="du-error">경기 일정을 불러오지 못했습니다.</div>'});
})();