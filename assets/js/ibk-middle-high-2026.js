(()=>{
  const scheduleRoot=document.getElementById('ibkSchedule');
  const filterRoot=document.getElementById('ibkDivisionFilters');
  const dateRoot=document.getElementById('ibkDateTabs');
  if(!scheduleRoot||!filterRoot||!dateRoot)return;

  const divisions={all:'전체',m18:'18세이하 남자부',m15:'15세이하 남자부',w18:'18세이하 여자부',w15:'15세이하 여자부'};
  const venues={m18:'대원대학교 민송체육관',m15:'제천어울림체육관',w18:'제천실내체육관',w15:'제천중학교'};
  const data=[];
  const add=(date,division,pairs,stage=false,venue=venues[division],start='09:30')=>pairs.forEach((pair,i)=>data.push({date,division,venue,start,order:i+1,home:pair[0],away:pair[1],stage}));

  add('2026-07-31','m18',[["울산스포츠과학고","수성고"],["광주전자공고","경북체육고"],["속초고","성지고"],["천안고","인하사대부고"],["남성고","제천산업고"],["대전중앙고","진주동명고"]]);
  add('2026-08-01','m18',[["화성시G-스포츠클럽","옥천고"],["울산스포츠과학고","경북체육고"],["속초고","천안고"],["남성고","진주동명고"],["제천산업고","대전중앙고"]]);
  add('2026-08-02','m18',[["부산동성고","화성시G-스포츠클럽"],["울산스포츠과학고","광주전자공고"],["경북체육고","수성고"],["인하사대부고","성지고"],["진주동명고","제천산업고"]]);
  add('2026-08-03','m18',[["부산동성고","옥천고"],["수성고","광주전자공고"],["속초고","인하사대부고"],["성지고","천안고"],["남성고","대전중앙고"]]);
  add('2026-08-04','m18',Array.from({length:4},()=>['18세이하 남자부','8강전']),true,venues.m18,'10:00');
  add('2026-08-05','m18',Array.from({length:2},()=>['18세이하 남자부','4강전']),true,venues.w18,'10:00');
  add('2026-08-06','m18',[['18세이하 남자부','결승전']],true,venues.w18,'10:00');

  add('2026-07-31','m15',[["인창중","대연중"],["소사중","문흥중"],["동해광희중","각리중"],["하동중","제천중"],["금호중","율곡중"]]);
  add('2026-08-01','m15',[["인창중","금정중"],["대연중","연현중"],["소사중","각리중"],["하동중","율곡중"],["율곡중","제천중"]]);
  add('2026-08-02','m15',[["금정중","대연중"],["인창중","연현중"],["문흥중","동해광희중"],["하동중","금호중"]]);
  add('2026-08-03','m15',[["연현중","금정중"],["소사중","동해광희중"],["각리중","문흥중"],["제천중","금호중"]]);
  add('2026-08-04','m15',Array.from({length:2},()=>['15세이하 남자부','6강전']),true,venues.m15,'10:00');
  add('2026-08-05','m15',Array.from({length:2},()=>['15세이하 남자부','4강전']),true,venues.m15,'10:00');
  add('2026-08-06','m15',[['15세이하 남자부','결승전']],true,venues.m15,'10:00');

  add('2026-07-31','w18',[["대전용산고","선명여고"],["전주근영여고","경남여고"],["한봄고","중앙여고"],["강릉여고","천안청수고"]]);
  add('2026-08-01','w18',[["광주체육고","제천여고"],["목포여상","선명여고"],["일신여상","경남여고"],["중앙여고","강릉여고"]]);
  add('2026-08-02','w18',[["대구여고","제천여고"],["일신여상","전주근영여고"],["한봄고","강릉여고"],["천안청수고","중앙여고"]]);
  add('2026-08-03','w18',[["대구여고","광주체육고"],["목포여상","대전용산고"],["한봄고","천안청수고"]]);
  add('2026-08-04','w18',Array.from({length:4},()=>['18세이하 여자부','8강전']),true,venues.w18,'10:00');
  add('2026-08-05','w18',Array.from({length:2},()=>['18세이하 여자부','4강전']),true,venues.w18,'10:00');
  add('2026-08-06','w18',[['18세이하 여자부','결승전']],true,venues.w18,'10:00');

  add('2026-07-31','w15',[["세화여중","천안봉서중"],["대구일중","잠실여중"],["모종중","홍천군체육회U-15"],["경남여중","제천여중"],["부평여중","강릉해람중"]]);
  add('2026-08-01','w15',[["잠실여중","천안봉서중"],["광주체육중","홍천군체육회U-15"],["중앙여중","모종중"],["제천여중","부평여중"],["강릉해람중","제천여중"]]);
  add('2026-08-02','w15',[["천안봉서중","대구일중"],["잠실여중","세화여중"],["광주체육중","중앙여중"],["경남여중","부평여중"]]);
  add('2026-08-03','w15',[["세화여중","대구일중"],["광주체육중","모종중"],["홍천군체육회U-15","중앙여중"],["경남여중","강릉해람중"]]);
  add('2026-08-04','w15',Array.from({length:2},()=>['15세이하 여자부','6강전']),true,venues.w15,'10:00');
  add('2026-08-04','w15',Array.from({length:2},()=>['15세이하 여자부','4강전']),true,venues.m15,'10:00');
  add('2026-08-06','w15',[['15세이하 여자부','결승전']],true,venues.m15,'10:00');

  const dates=[...new Set(data.map(x=>x.date))].sort();
  const fmtDate=date=>{const d=new Date(`${date}T00:00:00`);return `${d.getMonth()+1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`};
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  let activeDivision='all';
  let activeDate=dates[0];

  function renderControls(){
    filterRoot.innerHTML=Object.entries(divisions).map(([id,label])=>`<button type="button" data-division="${id}" class="${id===activeDivision?'active':''}">${label}</button>`).join('');
    dateRoot.innerHTML=dates.map(date=>`<button type="button" data-date="${date}" class="${date===activeDate?'active':''}">${fmtDate(date)}</button>`).join('');
    filterRoot.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{activeDivision=btn.dataset.division;render()});
    dateRoot.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{activeDate=btn.dataset.date;render()});
  }

  function render(){
    renderControls();
    const rows=data.filter(x=>x.date===activeDate&&(activeDivision==='all'||x.division===activeDivision));
    if(!rows.length){scheduleRoot.innerHTML='<div class="ibk-empty">선택한 조건의 경기가 없습니다.</div>';return}
    const groups=new Map();
    rows.forEach(row=>{const key=`${row.venue}|${row.start}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)});
    scheduleRoot.innerHTML=`<div class="ibk-day-head"><h2>${fmtDate(activeDate)}</h2><span>${rows.length}경기 · 첫 경기 ${rows[0].start}</span></div>${[...groups.entries()].map(([key,matches])=>{const [venue,start]=key.split('|');return `<section class="ibk-venue"><h3>${esc(venue)} · ${start} 시작</h3><div class="ibk-match-list">${matches.map(m=>`<article class="ibk-match ${m.stage?'ibk-stage':''}"><span class="order">${m.order}경기<br>${esc(divisions[m.division])}</span><strong class="team">${esc(m.home)}</strong><span class="vs">${m.stage?'→':'vs'}</span><strong class="team">${esc(m.away)}</strong></article>`).join('')}</div></section>`}).join('')}`;
  }

  render();
})();
