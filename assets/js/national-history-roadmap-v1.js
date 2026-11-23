import {failed, selectEvents, ordered, dateLabel, participationLabel, validateData} from './national-history-model-v1.mjs';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chevron='<span class="chevron" aria-hidden="true"></span>';
const filters=['all','key','olympic','failure'];
const params=new URLSearchParams(location.search);
let filter=filters.includes(params.get('filter'))?params.get('filter'):'all', db;
const yearLabels={2000:'올림픽 본선 참가',2001:'아시아 정상',2002:'부산에서 금메달',2003:'아시아 2연패',2004:'아테네를 향한 도전',2006:'아시안게임 2연패',2008:'베이징 출전권 경쟁',2012:'런던 출전권 경쟁',2014:'세계선수권 · 아시아컵',2016:'리우 출전권 미획득',2018:'첫 VNL · 아시안게임 은메달',2020:'도쿄 올림픽 도전',2024:'파리 올림픽',2025:'세계무대 복귀',2026:'LA28 첫 진출 관문',2027:'LA28 핵심 경쟁',2028:'마지막 출전 경로'};
function safeUrl(raw){try{const u=new URL(raw);return u.protocol==='https:'?u.href:'#';}catch{return '#';}}
function resultRows(e){
  let mainClass=(e.actualParticipation===false||(e.category==='qualification-allocation'&&failed(e)))?'failure':e.eventStatus==='scheduled_confirmed'?(e.participationConfirmed?'good':'pending'):e.displayStyle==='gate'?'good':'';
  const seen=new Set([e.result]);
  const outcomes=e.qualificationOutcomes.filter(o=>o.label&&!seen.has(o.label)).filter(o=>{
    if(e.category==='olympics')return false;
    if(e.category==='olympic-qualifier')return false;
    if(e.id==='kor-m-2028-world-ranking')return false;
    return true;
  }).map(o=>{seen.add(o.label);const c=o.status.startsWith('not_qualified')?'failure':o.status==='qualified'?'good':'pending';return `<span class="result ${c}">${c==='failure'?'<i class="failure-dot" aria-hidden="true"></i>':''}${esc(o.label)}</span>`}).join('');
  return `<span class="result ${mainClass}">${mainClass==='failure'?'<i class="failure-dot" aria-hidden="true"></i>':''}${esc(e.result)}</span>${outcomes}`;
}
function matchText(m){const names={AUS:'호주',IRI:'이란',JPN:'일본',PAK:'파키스탄',KAZ:'카자흐스탄',INA:'인도네시아',CHN:'중국',TPE:'차이니스 타이베이',PHI:'필리핀',IND:'인도',QAT:'카타르',THA:'태국',OMA:'오만',BRN:'바레인',VIE:'베트남'};const stage={bronze:'3위 결정전',semifinal:'준결승'}[m.stage]||m.stage||'';const score=m.setScore??(m.setsWon!==undefined?`${m.setsWon}-${m.setsLost}`:'');const sets=m.setScores||m.sets||[];return `<div class="match-note">${esc(m.date||'')} ${esc(stage)} · 대한민국 ${esc(score)} ${esc(names[m.opponent]||m.opponent||'')} ${sets.length?`<span>${sets.map(s=>s.join('-')).join(' · ')}</span>`:''}</div>`;}
function eventDetail(e){
  const qual=e.qualificationOutcomes.map(o=>`<p><strong class="${o.status.startsWith('not_qualified')?'result failure':''}">${esc(o.label||o.target)}</strong>${o.reason||o.rule?`<small>${esc(o.reason||o.rule)}</small>`:''}${o.inference?'<small>판정 근거: 공식 진출 규정과 경기 결과를 대조했습니다.</small>':''}</p>`).join('');
  const evidence=e.verificationStatus==='partial'?'부분 확인':'참가·표시 결과 확인';
  const dateState=e.fieldVerification.dates==='confirmed'?'': ' · 일부 날짜 확인 중';
  const extra=e.qualifierParticipation===false?'<li>올림픽 예선 경기 미참가. 경기 패배에 따른 예선 탈락 기록이 아닙니다.</li>':'';
  const kvl=e.existingLinks.kvlHref?`<a href="https://kvolleylab.com/${esc(e.existingLinks.kvlHref)}" target="_blank" rel="noopener noreferrer">KVL 대회 기록 ↗</a>`:'';
  return `<div class="event-detail"><p class="official-name">${esc(e.officialName)}</p><dl class="detail-grid"><div><dt>대회 일정</dt><dd>${esc(dateLabel(e))}</dd></div><div><dt>대한민국 참가</dt><dd>${esc(participationLabel(e))}</dd></div><div><dt>검증 상태</dt><dd>${evidence}${dateState}</dd></div></dl>${e.qualificationPath?`<p>${esc(e.qualificationPath)}</p>`:''}${qual?`<div class="detail-outcomes">${qual}</div>`:''}${e.matches.map(matchText).join('')}<ul class="detail-notes">${extra}${e.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><div class="detail-sources">${e.sourceIds.map(id=>{const s=db.sources.find(s=>s.id===id);return `<a href="${esc(safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`}).join('')}${kvl}</div><div class="detail-tail"><span>기록 확인 ${e.verifiedAt.replaceAll('-','.')} · 수정 ${e.updatedAt.replaceAll('-','.')}</span><button type="button" data-close="${esc(e.id)}">상세 닫기 ↑</button></div></div>`;
}
function eventRow(e){
  const future=e.eventStatus==='scheduled_confirmed', classes=[e.displayStyle,failed(e)?'failed':'',future?'future':'',e.importance!=='normal'?'major':''].join(' ');
  const sub=future?`${dateLabel(e)}${e.location?' · '+e.location:''}`:e.id==='olympics-2020-men'?'공식 명칭 Tokyo 2020 · 2021년 개최':'';
  return `<details class="event ${classes}" id="${esc(e.id)}" data-event="${esc(e.id)}"><summary aria-label="${esc(e.year+' '+e.nameKo+' · '+e.result)}"><div><span class="event-title">${esc(e.nameKo)}${e.displayStyle==='gate'&&e.category!=='olympics'?'<span class="key-badge">핵심</span>':''}</span>${sub?`<span class="event-subtitle">${esc(sub)}</span>`:''}</div><div class="event-results">${resultRows(e)}</div>${chevron}</summary>${eventDetail(e)}</details>`;
}
function yearBlock(year,events,open){
  const current=year===db.displayPolicy.currentYear,future=year>db.displayPolicy.currentYear;
  return `<details class="year ${current?'current':''} ${future?'future':''}" id="year-${year}" ${open?'open':''}><summary class="year-heading"><span class="year-marker" aria-hidden="true"></span><span class="year-number">${year}</span><span class="year-label">${esc(yearLabels[year]||'대표팀 국제대회')}</span>${current?'<span class="current-badge">현재 연도</span>':''}<span class="year-count">${events.length}개 기록</span>${chevron}</summary><div class="year-events">${events.map(eventRow).join('')}</div></details>`;
}
function render(){
  const events=ordered(selectEvents(db.events,filter)), years=[...new Set(events.map(e=>e.year))];
  const archiveYears=years.filter(y=>y<=db.displayPolicy.archiveThrough),recentYears=years.filter(y=>y>db.displayPolicy.archiveThrough);
  const browsingPast=['olympic','failure'].includes(filter);
  const archive=archiveYears.length?`<details class="archive" id="past-records" ${browsingPast?'open':''}><summary><span class="year-marker" aria-hidden="true"></span><span class="archive-title">2000 — ${db.displayPolicy.archiveThrough}</span><span class="archive-note">과거 기록 · ${events.filter(e=>e.year<=db.displayPolicy.archiveThrough).length}개 기록</span>${chevron}</summary><div class="archive-content">${archiveYears.map(y=>yearBlock(y,events.filter(e=>e.year===y),browsingPast)).join('')}</div></details>`:'';
  $('timeline').innerHTML=archive+recentYears.map(y=>yearBlock(y,events.filter(e=>e.year===y),true)).join('');
  $('empty-state').hidden=events.length>0;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));
  $('jump-current').disabled=!years.includes(db.displayPolicy.currentYear);
  $('load-message').className='sr-only';$('load-message').textContent=`${events.length}개 기록을 표시합니다.`;
  $('coverage-note').textContent=db.coverageNote;
  $('verified-date').textContent=`${db.verifiedAt.replaceAll('-','.')} 확인`;
  const url=new URL(location.href);url.searchParams.set('filter',filter);history.replaceState(null,'',url);
}
function openRecord(id){const el=$(id);if(!el)return;for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;el.open=true;el.scrollIntoView({block:'center'});}
document.querySelector('.filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b||!db)return;filter=b.dataset.filter;const url=new URL(location.href);url.searchParams.delete('event');history.replaceState(null,'',url);render();});
$('timeline').addEventListener('click',e=>{const b=e.target.closest('[data-close]');if(b){const row=$(b.dataset.close);row.open=false;row.querySelector('summary').focus();}});
$('jump-current').addEventListener('click',()=>{const y=$('year-'+db.displayPolicy.currentYear);if(y){y.open=true;y.scrollIntoView({block:'start'});y.querySelector('summary').focus({preventScroll:true});}});
$('top').addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
async function load(){try{const r=await fetch('data/national/men-senior-history-v1.json');if(!r.ok)throw Error('자료 응답 오류');db=await r.json();if(validateData(db).length)throw Error('자료 검증 실패');render();const requested=params.get('event');if(requested&&db.events.some(e=>e.id===requested)){if(!selectEvents(db.events,filter).some(e=>e.id===requested)){filter='all';render();}openRecord(requested);}}catch(error){$('load-message').className='load-message';$('load-message').innerHTML='기록을 불러오지 못했습니다. <button type="button" id="retry">다시 불러오기</button> · <a href="national-team-history-verification.html">검증 목록 보기</a>';$('retry').addEventListener('click',load);}}
load();
