(()=>{
'use strict';
if(document.body?.dataset.competition!=='ibk-2026')return;
const D=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
const FINAL={
'18세이하 남자부':[
{date:'2026-08-04',stage:'8강',order:1,start:'10:00',venue:'대원대학교 민송체육관',teamA:'인하사대부고',teamB:'부산동성고',score:'3-0',sets:['25-19','25-19','25-23']},
{date:'2026-08-04',stage:'8강',order:2,start:'2경기',venue:'대원대학교 민송체육관',teamA:'옥천고',teamB:'속초고',score:'0-3',sets:['15-25','20-25','19-25']},
{date:'2026-08-04',stage:'8강',order:3,start:'3경기',venue:'대원대학교 민송체육관',teamA:'남성고',teamB:'경북체고',score:'3-0',sets:['25-19','25-14','25-21']},
{date:'2026-08-04',stage:'8강',order:4,start:'4경기',venue:'대원대학교 민송체육관',teamA:'수성고',teamB:'진주동명고',score:'3-1',sets:['25-19','25-22','21-25','25-23']},
{date:'2026-08-05',stage:'준결승',order:1,start:'10:00',venue:'제천실내체육관',teamA:'인하사대부고',teamB:'남성고',score:'3-1',sets:['25-17','17-25','25-21','25-17']},
{date:'2026-08-05',stage:'준결승',order:2,start:'2경기',venue:'제천실내체육관',teamA:'속초고',teamB:'수성고',score:'1-3',sets:['23-25','16-25','25-22','19-25']},
{date:'2026-08-06',stage:'결승',order:1,start:'10:00',venue:'제천실내체육관',teamA:'인하사대부고',teamB:'수성고',score:'3-1',sets:['25-20','18-25','25-17','25-23']}
],
'18세이하 여자부':[
{date:'2026-08-04',stage:'8강',order:1,start:'10:00',venue:'제천실내체육관',teamA:'중앙여고',teamB:'제천여고',score:'3-0',sets:['25-13','25-13','25-12']},
{date:'2026-08-04',stage:'8강',order:2,start:'2경기',venue:'제천실내체육관',teamA:'광주체고',teamB:'천안청수고',score:'3-1',sets:['25-21','25-21','21-25','36-34']},
{date:'2026-08-04',stage:'8강',order:3,start:'3경기',venue:'제천실내체육관',teamA:'일신여상',teamB:'목포여상',score:'3-0',sets:['25-11','25-14','25-20']},
{date:'2026-08-04',stage:'8강',order:4,start:'4경기',venue:'제천실내체육관',teamA:'선명여고',teamB:'전주근영여고',score:'3-1',sets:['25-27','25-18','25-20','25-19']},
{date:'2026-08-05',stage:'준결승',order:3,start:'3경기',venue:'제천실내체육관',teamA:'중앙여고',teamB:'일신여상',score:'3-0',sets:['25-16','25-14','25-14']},
{date:'2026-08-05',stage:'준결승',order:4,start:'4경기',venue:'제천실내체육관',teamA:'광주체고',teamB:'선명여고',score:'0-3',sets:['11-25','18-25','19-25']},
{date:'2026-08-06',stage:'결승',order:2,start:'2경기',venue:'제천실내체육관',teamA:'중앙여고',teamB:'선명여고',score:'3-1',sets:['13-25','25-14','25-17','25-10']}
],
'15세이하 남자부':[
{date:'2026-08-04',stage:'6강',order:1,start:'10:00',venue:'제천어울림체육관',teamA:'인창중',teamB:'각리중',score:'0-2',sets:['25-27','23-25']},
{date:'2026-08-04',stage:'6강',order:2,start:'2경기',venue:'제천어울림체육관',teamA:'문흥중',teamB:'금호중',score:'2-1',sets:['26-24','21-25','15-6']},
{date:'2026-08-05',stage:'준결승',order:1,start:'10:00',venue:'제천어울림체육관',teamA:'제천중',teamB:'각리중',score:'2-0',sets:['26-24','25-22']},
{date:'2026-08-05',stage:'준결승',order:2,start:'2경기',venue:'제천어울림체육관',teamA:'연현중',teamB:'문흥중',score:'1-2',sets:['28-30','25-16','12-15']},
{date:'2026-08-06',stage:'결승',order:1,start:'10:00',venue:'제천어울림체육관',teamA:'제천중',teamB:'문흥중',score:'2-0',sets:['25-16','25-23']}
],
'15세이하 여자부':[
{date:'2026-08-04',stage:'6강',order:1,start:'10:00',venue:'제천중학교',teamA:'경남여중',teamB:'천안봉서중',score:'2-0',sets:['25-15','25-22']},
{date:'2026-08-04',stage:'6강',order:2,start:'2경기',venue:'제천중학교',teamA:'세화여중',teamB:'홍천군체육회U-15',score:'2-1',sets:['24-26','25-20','15-8']},
{date:'2026-08-05',stage:'준결승',order:3,start:'3경기',venue:'제천어울림체육관',teamA:'모종중',teamB:'경남여중',score:'0-2',sets:['25-27','22-25']},
{date:'2026-08-05',stage:'준결승',order:4,start:'4경기',venue:'제천어울림체육관',teamA:'강릉해람중',teamB:'세화여중',score:'2-0',sets:['25-15','25-14']},
{date:'2026-08-06',stage:'결승',order:2,start:'2경기',venue:'제천어울림체육관',teamA:'경남여중',teamB:'강릉해람중',score:'2-1',sets:['25-17','21-25','15-7']}
]};
const PODIUM={
'18세이하 남자부':['인하사대부고','수성고','남성고 · 속초고'],
'18세이하 여자부':['중앙여고','선명여고','일신여상 · 광주체고'],
'15세이하 남자부':['제천중','문흥중','각리중 · 연현중'],
'15세이하 여자부':['경남여중','강릉해람중','모종중 · 세화여중']};
const state=window.KVL_SCHOOL_DIVISION_STATE;
let current=state?.get?.()||new URLSearchParams(location.search).get('division')||'';
try{if(!current)current=sessionStorage.getItem('kvl:ibk-2026:division')||'';}catch(_){ }
if(!D.includes(current))current=D[0];
let syncing=false,queued=false,resultPatchQueued=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=n=>String(n).replace(/고등학교|중학교|여자|체육회|스포츠과학|대학교|기업은행/g,'').slice(0,2)||'팀';
const logo=n=>`<span class="sc-team-logo" aria-label="${esc(n)} 로고 자리">${esc(initials(n))}</span>`;
const valueOf=btn=>btn?.dataset.kvlDivision||btn?.dataset.calendarDivision||btn?.textContent?.trim()||'';
const divisionButtons=()=>[...document.querySelectorAll('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button')];
const winner=g=>{const[a,b]=g.score.split('-').map(Number);return a>b?g.teamA:b>a?g.teamB:null};
function tagButtons(){divisionButtons().forEach(btn=>{const value=valueOf(btn);if(D.includes(value))btn.dataset.kvlDivision=value;});}
function renderStandingTabs(){const root=document.getElementById('scStandingTabs');if(!root)return;if(!root.children.length)root.innerHTML=D.map(value=>`<button type="button" data-kvl-division="${value}">${value}</button>`).join('');[...root.children].forEach(btn=>btn.classList.toggle('is-active',valueOf(btn)===current));}
function gameCard(g){const w=winner(g),[a,b]=g.score.split('-');return `<div class="sc-bracket-game"><div class="sc-bracket-title">${esc(g.stage)} ${g.order}경기</div><div class="sc-bracket-meta"><span>${esc(g.date)} · ${esc(g.start)}</span><span>${esc(g.venue)}</span></div><div class="sc-horizontal-match"><div class="sc-horizontal-side ${w===g.teamA?'is-winner':''}">${logo(g.teamA)}<strong>${esc(g.teamA)}</strong></div><b class="sc-horizontal-score"><span class="${w===g.teamA?'is-winner':''}">${a}</span><i>-</i><span class="${w===g.teamB?'is-winner':''}">${b}</span></b><div class="sc-horizontal-side is-right ${w===g.teamB?'is-winner':''}"><strong>${esc(g.teamB)}</strong>${logo(g.teamB)}</div></div><div class="sc-sets">${g.sets.map(s=>`<span>${esc(s)}</span>`).join('')}</div></div>`;}
function renderFinalStandings(){
  const p=PODIUM[current],games=FINAL[current]||[],podium=document.getElementById('scPodiums'),brackets=document.getElementById('scBrackets');if(!p||!podium||!brackets)return;
  podium.innerHTML=`<article class="sc-podium"><h3>${esc(current)}</h3><div class="sc-rank"><b><span class="sc-rank-trophy" aria-hidden="true">🏆</span>우승</b><span>${esc(p[0])}</span></div><div class="sc-rank"><b><span class="sc-rank-trophy" aria-hidden="true">🥈</span>준우승</b><span>${esc(p[1])}</span></div><div class="sc-rank"><b>공동 3위</b><span>${esc(p[2])}</span></div></article>`;
  const stages=[...new Set(games.map(g=>g.stage))],champ=p[0];
  brackets.innerHTML=`<article class="sc-bracket"><h3>${esc(current)}</h3><div class="sc-bracket-champion"><div class="sc-champion"><span class="sc-champion-trophy">🏆</span>${logo(champ)}<strong>우승 ${esc(champ)}</strong></div></div><div class="sc-bracket-grid">${stages.map(stage=>`<div class="sc-bracket-round"><strong>${esc(stage)}</strong>${games.filter(g=>g.stage===stage).map(gameCard).join('')}</div>`).join('')}</div><div class="sc-bracket-legend"><span><i></i>승리 팀과 승리 점수</span></div></article>`;
}
function patchResults(){
  const root=document.getElementById('scResults');if(!root)return;
  root.querySelectorAll('.sc-date').forEach(section=>{
    const date=section.querySelector('.sc-date-head span')?.textContent.trim()||'';const counters={};
    section.querySelectorAll('.sc-match').forEach(card=>{
      const meta=card.querySelector('.sc-meta')?.textContent||'';const stage=['8강','6강','준결승','결승'].find(s=>meta.includes(s));if(!stage)return;
      const key=`${date}|${stage}`,idx=counters[key]||0;counters[key]=idx+1;const g=(FINAL[current]||[]).filter(x=>x.date===date&&x.stage===stage)[idx];if(!g)return;
      const sig=`${g.date}|${g.stage}|${g.order}|${g.score}`;if(card.dataset.kvlFinalSig===sig)return;card.dataset.kvlFinalSig=sig;const w=winner(g);
      card.innerHTML=`<div class="sc-meta">${esc(g.start)} · ${esc(g.venue)} · ${esc(g.stage)}</div><div class="sc-board"><span class="sc-team ${w===g.teamA?'sc-winner':''}">${esc(g.teamA)}${logo(g.teamA)}</span><b class="sc-score">${esc(g.score)}</b><span class="sc-team ${w===g.teamB?'sc-winner':''}">${logo(g.teamB)}${esc(g.teamB)}</span></div><div class="sc-sets">${g.sets.map(s=>`<span>${esc(s)}</span>`).join('')}</div>`;
    });
  });
}
function queuePatchResults(){if(resultPatchQueued)return;resultPatchQueued=true;requestAnimationFrame(()=>{resultPatchQueued=false;patchResults();});}
function patchCalendar(){
  const root=document.getElementById('scCalendar');if(!root)return;const month=[...root.querySelectorAll('.sc-calendar-month')].find(m=>m.querySelector('.sc-calendar-title')?.textContent.includes('2026년 8월'));if(!month)return;
  month.querySelectorAll('.sc-calendar-cell').forEach(cell=>{const day=Number(cell.querySelector('.sc-calendar-day')?.textContent);if(![4,5,6].includes(day))return;const date=`2026-08-${String(day).padStart(2,'0')}`,list=(FINAL[current]||[]).filter(g=>g.date===date);cell.querySelectorAll('.sc-calendar-game').forEach((game,i)=>{const g=list[i];if(!g)return;const w=winner(g),spans=game.querySelectorAll('span');const time=game.querySelector('time'),score=game.querySelector('b');if(time)time.textContent=g.start;if(spans[0]){spans[0].textContent=g.teamA;spans[0].classList.toggle('is-winner',w===g.teamA)}if(score)score.textContent=g.score;if(spans[1]){spans[1].textContent=g.teamB;spans[1].classList.toggle('is-winner',w===g.teamB)}game.title=`${g.venue} · ${g.stage}`;});});
}
function simplifySources(){
  const section=document.getElementById('sources');if(!section)return;const note=section.querySelector(':scope > .sc-title > p');if(note)note.textContent='공식 원본 자료';
  section.querySelectorAll(':scope > .sc-regulations,:scope > .sc-regulations-summary,:scope > .sc-source-grid,:scope > .sc-data-note').forEach(el=>el.remove());
  let root=section.querySelector(':scope > .sc-sources');if(!root){root=document.createElement('div');root.className='sc-sources';section.appendChild(root);}
  const html=`<a href="https://drive.google.com/uc?export=download&id=1NGytIv0UqbCMCAPrFWIf0ZFW3qaXTEki" target="_blank" rel="noopener noreferrer"><span>IBK기업은행배 참가요강 원문 열기</span><span>→</span></a><a href="https://drive.google.com/file/d/1hbdact8MYEPAIZ2qHKtpEjOJIOQp3uI0/view" target="_blank" rel="noopener noreferrer"><span>IBK기업은행배 개최공문 PDF 열기</span><span>→</span></a><a href="https://drive.google.com/uc?export=download&id=16O-WpuLf9VmNfF-TStyKQEjfFi6bz8wM" target="_blank" rel="noopener noreferrer"><span>IBK기업은행배 경기스코어 XLSX 열기</span><span>→</span></a>`;if(root.innerHTML!==html)root.innerHTML=html;
}
function tuneCompletedCopy(){
  const status=document.querySelector('.sc-status');if(status){const s=status.querySelector('span'),b=status.querySelector('strong');if(s)s.textContent='대회 종료';if(b)b.textContent='공식 결과 반영';}
  const overview=document.querySelector('#overview .sc-title>p');if(overview)overview.textContent='2026-08-06 공식 경기스코어 기준';
  const results=document.querySelector('#results .sc-title>p');if(results)results.textContent='7월 31일~8월 6일 예선부터 결승까지 96경기 전체 반영';
  const standing=document.querySelector('#standings>.sc-title>p');if(standing)standing.textContent='공동 3위 포함 · 공식 최종 결과 기준';
  const bracket=document.querySelector('#standings .sc-bracket-wrap .sc-title>p');if(bracket)bracket.textContent='8월 4일 본선부터 8월 6일 결승까지 공식 경기스코어 기준';
  const kpis=[...document.querySelectorAll('#overview .sc-kpis article')];if(kpis.length>=2){const a=kpis[0].querySelector('span'),as=kpis[0].querySelector('strong'),b=kpis[1].querySelector('span'),bs=kpis[1].querySelector('strong');if(a)a.textContent='전체 경기';if(as)as.textContent='96';if(b)b.textContent='예선 경기';if(bs)bs.textContent='72';}
}
function clickMatching(selector){const btn=[...document.querySelectorAll(selector)].find(x=>valueOf(x)===current);if(btn&&!btn.classList.contains('is-active'))btn.click();}
function finishReady(){tagButtons();renderStandingTabs();renderFinalStandings();patchCalendar();patchResults();document.body.dataset.kvlDivisionReady='1';}
function sync(value){if(!D.includes(value))return;current=value;state?.set?.(current);syncing=true;try{tagButtons();clickMatching('#scCalendar [data-calendar-division]');clickMatching('#scDivisionTabs button');clickMatching('#scTeamTabs button');}finally{syncing=false;}requestAnimationFrame(finishReady);}
function queueSync(value){current=D.includes(value)?value:current;if(queued)return;queued=true;queueMicrotask(()=>{queued=false;sync(current);});}
document.addEventListener('click',event=>{if(syncing)return;const btn=event.target.closest('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button');if(!btn)return;const value=valueOf(btn);if(D.includes(value))queueSync(value);});
const resultsRoot=document.getElementById('scResults');if(resultsRoot)new MutationObserver(queuePatchResults).observe(resultsRoot,{childList:true,subtree:true});
simplifySources();tuneCompletedCopy();tagButtons();renderStandingTabs();sync(current);
})();
