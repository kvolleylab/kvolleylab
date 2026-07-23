(()=>{
  const root=document.getElementById('danyangSchedule');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let data=null,division='전체',venue='전체',team='전체';
  const year=2026,month=8;
  const pad=n=>String(n).padStart(2,'0');
  const iso=d=>`${year}-${pad(month)}-${pad(d)}`;
  const teams=()=>[...new Set(data.matches.flatMap(m=>[m.home,m.away]).filter(x=>x&&!x.includes('진출팀')&&!x.includes('승리팀')&&!x.includes('위팀'))) ].sort((a,b)=>a.localeCompare(b,'ko'));
  const filtered=()=>data.matches.filter(m=>(division==='전체'||m.division===division)&&(venue==='전체'||m.venue===venue)&&(team==='전체'||m.home===team||m.away===team));
  const color=m=>m.division==='여대부'?'#9b59b6':m.stage==='예선'?'#1d7a46':'#c28a12';
  function controls(){
    return `<section class="du-toolbar"><div class="du-filter-block"><strong>부문</strong><div>${['전체','남대부','여대부'].map(x=>`<button data-division="${x}" class="${division===x?'active':''}">${x}</button>`).join('')}</div></div><div class="du-filter-block"><strong>경기장</strong><div>${['전체','national','culture'].map(x=>`<button data-venue="${x}" class="${venue===x?'active':''}">${x==='전체'?'전체':esc(data.venues[x])}</button>`).join('')}</div></div><label class="du-team-select"><strong>팀별 일정</strong><select data-team><option>전체</option>${teams().map(x=>`<option${team===x?' selected':''}>${esc(x)}</option>`).join('')}</select></label></section>`;
  }
  function eventCard(m){
    const state=m.confirmed===false?'대진 미확정':'공식 일정';
    return `<article class="du-cal-event ${m.confirmed===false?'pending':''}" style="--event-color:${color(m)}"><span class="du-cal-time">${esc(m.time||'시간 확인 중')}</span><strong>${esc(m.home)} <em>vs</em> ${esc(m.away)}</strong><small>${esc(m.division)}${m.group?` · ${esc(m.group)}조`:''} · ${esc(m.stage)} · ${esc(data.venues[m.venue])}</small><span>${state}${m.broadcast?' · TV':''}</span></article>`;
  }
  function calendar(){
    const list=filtered();
    const byDate={};list.forEach(m=>(byDate[m.date]||(byDate[m.date]=[])).push(m));
    const first=new Date(year,month-1,1).getDay();
    const offset=first===0?6:first-1;
    const last=new Date(year,month,0).getDate();
    const cells=[];
    for(let i=0;i<42;i++){
      const d=i-offset+1;
      if(d<1||d>last){cells.push('<div class="du-cal-cell empty"></div>');continue}
      const date=iso(d),matches=(byDate[date]||[]).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||a.venue.localeCompare(b.venue));
      cells.push(`<section class="du-cal-cell ${matches.length?'has-games':''}"><header><b>${d}</b><span>${matches.length?`${matches.length}경기`:''}</span></header><div class="du-cal-events">${matches.map(eventCard).join('')}</div></section>`);
    }
    return `<section class="du-calendar-wrap"><div class="du-calendar-head"><button disabled>‹</button><div><strong>2026년 8월</strong><span>한국시간(KST) 기준</span></div><button disabled>›</button></div><div class="du-weekdays">${['월','화','수','목','금','토','일'].map((x,i)=>`<span class="${i===5?'sat':i===6?'sun':''}">${x}</span>`).join('')}</div><div class="du-calendar-grid">${cells.join('')}</div></section>`;
  }
  function agenda(){
    const list=filtered().sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'));
    return `<aside class="du-agenda"><h2>선택 일정 <span>${list.length}</span></h2><div>${list.map(m=>`<article><time>${m.date.slice(5).replace('-','.')} ${esc(m.time||'미정')}</time><strong>${esc(m.home)} <em>vs</em> ${esc(m.away)}</strong><small>${esc(m.division)} · ${esc(m.stage)} · ${esc(data.venues[m.venue])}</small></article>`).join('')||'<p class="du-empty">조건에 맞는 일정이 없습니다.</p>'}</div></aside>`;
  }
  function render(){
    const list=filtered(),confirmed=list.filter(m=>m.confirmed!==false).length;
    root.innerHTML=`${controls()}<div class="du-summary"><strong>등록 ${list.length}경기</strong><span>대진 확정 ${confirmed}경기 · 조건부 대진 ${list.length-confirmed}경기</span></div><div class="du-schedule-layout">${calendar()}${agenda()}</div>`;
    root.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{division=b.dataset.division;render()});
    root.querySelectorAll('[data-venue]').forEach(b=>b.onclick=()=>{venue=b.dataset.venue;render()});
    root.querySelector('[data-team]').onchange=e=>{team=e.target.value;render()};
  }
  fetch('data/matches/danyang-university-2026.json?v=20260723-1',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('schedule');return r.json()}).then(json=>{data=json;document.getElementById('danyangNotice').textContent=json.competition.notice;render()}).catch(()=>{root.innerHTML='<div class="du-error">경기 일정을 불러오지 못했습니다.</div>'});
})();