(()=>{
  const root=document.getElementById('goseongSchedule');
  if(!root)return;
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let data=null,division='전체',stage='전체',team='전체';
  const teams=()=>[...new Set(data.matches.flatMap(m=>[m.home,m.away]))].sort((a,b)=>a.localeCompare(b,'ko'));
  const filtered=()=>data.matches.filter(m=>(division==='전체'||m.division===division)&&(stage==='전체'||m.stage===stage)&&(team==='전체'||m.home===team||m.away===team));
  const winner=m=>{const [a,b]=m.score.split('-').map(Number);return a>b?'home':'away'};
  const color=m=>m.division==='여대부'?'#9b59b6':m.stage==='예선'?'#1d7a46':'#c28a12';
  function controls(){
    return `<section class="du-toolbar"><div class="du-filter-block"><strong>부문</strong><div>${['전체','남대부','여대부'].map(x=>`<button data-division="${x}" class="${division===x?'active':''}">${x}</button>`).join('')}</div></div><div class="du-filter-block"><strong>단계</strong><div>${['전체','예선','6강','준결승','결승'].map(x=>`<button data-stage="${x}" class="${stage===x?'active':''}">${x}</button>`).join('')}</div></div><label class="du-team-select"><strong>팀별 결과</strong><select data-team><option>전체</option>${teams().map(x=>`<option${team===x?' selected':''}>${esc(x)}</option>`).join('')}</select></label></section>`;
  }
  function eventCard(m){
    const win=winner(m);
    return `<article class="du-cal-event" style="--event-color:${color(m)}"><span class="du-cal-time">${esc(m.time)}</span><strong><span class="${win==='home'?'winner':''}">${esc(m.home)}</span> <em>${esc(m.score)}</em> <span class="${win==='away'?'winner':''}">${esc(m.away)}</span></strong><small>${esc(m.division)}${m.group?` · ${esc(m.group)}조`:''} · ${esc(m.stage)} · ${esc(m.venue)}</small><span>${m.sets.map((s,i)=>`${i+1}세트 ${esc(s)}`).join(' · ')}</span></article>`;
  }
  function calendar(year,month){
    const list=filtered(),byDate={};list.forEach(m=>(byDate[m.date]||(byDate[m.date]=[])).push(m));
    const first=new Date(year,month-1,1).getDay(),offset=first===0?6:first-1,last=new Date(year,month,0).getDate(),cells=[];
    for(let i=0;i<42;i++){
      const d=i-offset+1;
      if(d<1||d>last){cells.push('<div class="du-cal-cell empty"></div>');continue}
      const date=`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const matches=(byDate[date]||[]).sort((a,b)=>a.time.localeCompare(b.time)||a.venue.localeCompare(b.venue));
      cells.push(`<section class="du-cal-cell ${matches.length?'has-games':''}"><header><b>${d}</b><span>${matches.length?`${matches.length}경기`:''}</span></header><div class="du-cal-events">${matches.map(eventCard).join('')}</div></section>`);
    }
    return `<section class="du-calendar-wrap"><div class="du-calendar-head"><button disabled>‹</button><div><strong>${year}년 ${month}월</strong><span>한국시간(KST) 기준 · 경기 종료</span></div><button disabled>›</button></div><div class="du-weekdays">${['월','화','수','목','금','토','일'].map((x,i)=>`<span class="${i===5?'sat':i===6?'sun':''}">${x}</span>`).join('')}</div><div class="du-calendar-grid">${cells.join('')}</div></section>`;
  }
  function agenda(){
    const list=filtered().sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    return `<aside class="du-agenda"><h2>선택 결과 <span>${list.length}</span></h2><div>${list.map(m=>`<article><time>${m.date.slice(5).replace('-','.')} ${esc(m.time)}</time><strong>${esc(m.home)} <em>${esc(m.score)}</em> ${esc(m.away)}</strong><small>${esc(m.division)} · ${esc(m.stage)} · ${esc(m.venue)}</small><p>${m.sets.join(' · ')}</p></article>`).join('')||'<p class="du-empty">조건에 맞는 결과가 없습니다.</p>'}</div></aside>`;
  }
  function render(){
    const list=filtered();
    root.innerHTML=`${controls()}<div class="du-summary"><strong>공식 결과 ${list.length}경기</strong><span>남대부 ${list.filter(x=>x.division==='남대부').length}경기 · 여대부 ${list.filter(x=>x.division==='여대부').length}경기</span></div><div class="du-schedule-layout"><div>${calendar(2026,6)}${calendar(2026,7)}</div>${agenda()}</div>`;
    root.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{division=b.dataset.division;render()});
    root.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stage=b.dataset.stage;render()});
    root.querySelector('[data-team]').onchange=e=>{team=e.target.value;render()};
  }
  fetch('data/matches/goseong-university-2026.json?v=20260725-2',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('results');return r.json()}).then(json=>{data=json;document.getElementById('goseongNotice').textContent=json.competition.notice;render()}).catch(()=>{root.innerHTML='<div class="du-error">경기 일정과 결과를 불러오지 못했습니다.</div>'});
})();