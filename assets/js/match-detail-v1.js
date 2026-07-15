(()=>{
const area=document.getElementById('matchArea');
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pages={Japan:'japan.html',Brazil:'brazil.html',Poland:'poland.html',Iran:'iran.html',USA:'usa.html',France:'france.html',Argentina:'argentina.html',Italy:'italy.html',Canada:'canada.html',Belgium:'belgium.html',Cuba:'cuba.html',Slovenia:'slovenia.html',Germany:'germany.html',Serbia:'serbia.html','Türkiye':'turkiye.html',Bulgaria:'bulgaria.html',China:'china.html',Ukraine:'ukraine.html'};
const flags={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
const venues={China:{cityKo:'린이',tz:'Asia/Shanghai'},Brazil:{cityKo:'브라질리아',tz:'America/Sao_Paulo'},Canada:{cityKo:'오타와',tz:'America/Toronto'},France:{cityKo:'오를레앙',tz:'Europe/Paris'},Poland:{cityKo:'글리비체',tz:'Europe/Warsaw'},Slovenia:{cityKo:'류블랴나',tz:'Europe/Ljubljana'},Serbia:{cityKo:'베오그라드',tz:'Europe/Belgrade'},USA:{cityKo:'시카고',tz:'America/Chicago'},Japan:{cityKo:'오사카',tz:'Asia/Tokyo'}};
const id=new URLSearchParams(location.search).get('id');
if(!id){area.innerHTML='<div class="md-empty">Match ID가 없습니다.</div>';return}
Promise.all([
 fetch('data/matches/vnl-2026-men.json?v=20260715-2',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('match');return r.json()}),
 fetch('data/results/vnl-2026-men-results.json?v=20260715-2',{cache:'no-store'}).then(r=>r.ok?r.json():({results:[]})).catch(()=>({results:[]}))
]).then(([matchData,resultData])=>{
 const list=matchData.matches||[];
 const index=list.findIndex(x=>x.match_id===id);
 const m=list[index];
 if(!m){area.innerHTML='<div class="md-empty">해당 경기를 찾을 수 없습니다.</div>';return}
 const result=(resultData.results||[]).find(x=>x.match_id===id);
 render(m,result,list[index-1],list[index+1]);
}).catch(()=>{area.innerHTML='<div class="md-empty">경기 데이터를 불러오지 못했습니다.</div>'});
function flag(team){const code=flags[team.name_en];return code?`<img class="md-flag" src="https://flagcdn.com/w160/${code}.png" alt="${esc(team.name_ko)} 국기">`:''}
function teamBlock(team,label,winnerSide,side){const page=pages[team.name_en],name=esc(team.name_ko||team.name_en||'-'),win=winnerSide===side?'<span class="md-winner">WIN</span>':'';return `<div class="md-team">${flag(team)}<div class="md-team-label">${label} ${win}</div><h2>${page?`<a href="${page}">${name}</a>`:name}</h2><div class="md-team-en">${esc(team.name_en||'')}</div></div>`}
function localDateTime(m){const venue=venues[m.venue?.country_en];if(!venue)return'-';const dt=new Date(m.datetime_kst);return new Intl.DateTimeFormat('ko-KR',{timeZone:venue.tz,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(dt)}
function navButton(m,dir){if(!m)return`<span class="md-nav-disabled"></span>`;return `<a class="md-nav-btn" href="match.html?id=${m.match_id}"><small>${dir==='prev'?'이전 경기':'다음 경기'}</small><strong>${esc(m.home.name_ko)} ${m.score?`${m.score.home_sets}-${m.score.away_sets}`:'vs'} ${esc(m.away.name_ko)}</strong></a>`}
function render(m,result,prev,next){
 const done=m.status==='completed'&&m.score,score=done?`${m.score.home_sets} - ${m.score.away_sets}`:'VS',status=done?'경기 종료':'경기 예정',winnerSide=result?.winner?.side||(done?(m.score.home_sets>m.score.away_sets?'home':'away'):'');
 const venue=venues[m.venue?.country_en],venueText=`${esc(m.venue?.country_ko||'-')}${venue?` (${venue.cityKo})`:''}`;
 const sets=result&&Array.isArray(result.sets)?result.sets:[];
 const setRows=sets.length?`<div class="md-set-table"><div class="md-set-head"><span>세트</span><span>${esc(m.home.name_ko)}</span><span>${esc(m.away.name_ko)}</span></div>${sets.map((s,i)=>`<div class="md-set-row"><span>${i+1}</span><strong>${esc(s.home_points)}</strong><strong>${esc(s.away_points)}</strong></div>`).join('')}</div>`:'<div class="md-empty">공식 세트별 득점 데이터가 아직 연결되지 않았습니다.</div>';
 document.title=`${m.home.name_ko} vs ${m.away.name_ko} | K-Volley Lab`;
 area.innerHTML=`<section class="md-card md-hero-card"><p class="eyebrow">2026 VNL Men · Week ${esc(m.week||'-')}</p><div class="md-status-line"><span>${status}</span><span>${esc(m.match_id)}</span></div><div class="md-hero">${teamBlock(m.home,'HOME',winnerSide,'home')}<div class="md-score"><strong>${esc(score)}</strong><span>${status}</span></div>${teamBlock(m.away,'AWAY',winnerSide,'away')}</div><div class="md-meta"><div><span>한국시간</span><strong>${esc(m.date_kst)} ${esc(m.time_kst)}</strong></div><div><span>현지시간</span><strong>${esc(localDateTime(m))}</strong></div><div><span>개최지</span><strong>${venueText}</strong></div><div><span>대회 단계</span><strong>${m.stage==='preliminary'?'예선':'본선'}</strong></div></div></section><section class="md-card md-section"><h3>세트별 점수</h3>${setRows}</section><section class="md-card md-section"><h3>팀 바로가기</h3><div class="md-links">${pages[m.home.name_en]?`<a href="${pages[m.home.name_en]}">${esc(m.home.name_ko)} 대표팀</a>`:''}${pages[m.away.name_en]?`<a href="${pages[m.away.name_en]}">${esc(m.away.name_ko)} 대표팀</a>`:''}<a href="vnl.html">VNL 허브</a><a href="schedules.html?tournament=vnl">전체 일정</a></div></section><section class="md-card md-section"><h3>출전 엔트리·경기 기록</h3><div class="md-coming-grid"><div><strong>출전 엔트리</strong><span>국가별 Active 엔트리와 연결 예정</span></div><div><strong>선발 라인업</strong><span>스타팅 로테이션 데이터 연결 예정</span></div><div><strong>개인 기록</strong><span>공격·블로킹·서브 기록 연결 예정</span></div></div></section><nav class="md-match-nav">${navButton(prev,'prev')}${navButton(next,'next')}</nav>`
}
})();