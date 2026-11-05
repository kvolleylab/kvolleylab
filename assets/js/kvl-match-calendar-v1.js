/* Shared competition calendar: one game = matchup; multiple games = count.
 * Presentation only. Match, team, stage, score and source records stay untouched. */
(()=>{
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const states=new WeakMap(),display=()=>window.KVLCalendarDisplayV1;
const active=m=>m?.notRequired!==true&&m?.status!=='not_required';
const validDate=key=>/^\d{4}-\d{2}-\d{2}$/.test(key||'')&&Number.isFinite(Date.parse(key+'T00:00:00Z'))&&new Date(key+'T00:00:00Z').toISOString().slice(0,10)===key;
const resolve=(d,side)=>(d.participants||[]).find(t=>t.code===side?.code)||side||{};
const name=t=>t.name||t.fullName||t.code||'미정';
function locationMarkup(summary,match){
 const time=display().timeLabel(match.time),suffix=', '+time+')',label=summary.line2;
 // Reuse the display helper's verified venue text; only split its known time suffix.
 if(!label.startsWith('(')||!label.endsWith(suffix))return `<span class="dv2-calendar-location">${esc(label)}</span>`;
 const venue=label.slice(1,-suffix.length),clock=String(match.time||'').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
 const compactTime=clock&&clock[2]!=='00'?Number(clock[1])+':'+clock[2]:time;
 const timeMarkup=compactTime===time?esc(time):`<span class="dv2-calendar-time-wide">${esc(time)}</span><span class="dv2-calendar-time-mobile">${esc(compactTime)}</span>`;
 return `<span class="dv2-calendar-location" title="${esc(label)}"><span class="dv2-calendar-location-open">(</span><span class="dv2-calendar-venue">${esc(venue)}</span><span class="dv2-calendar-time">, ${timeMarkup})</span></span>`;
}
function range(d,matches,team){
 const dates=matches.map(m=>m.date).filter(validDate).sort();
 if(!team)dates.push(...(d.dateLabel?.match(/\d{4}-\d{2}-\d{2}/g)||[]).filter(validDate));
 dates.sort();const months=[];
 if(dates.length){let cursor=dates[0].slice(0,7),last=dates.at(-1).slice(0,7);while(cursor<=last&&months.length<120){months.push(cursor);const [y,m]=cursor.split('-').map(Number);cursor=new Date(Date.UTC(y,m,1)).toISOString().slice(0,7);}}
 return {dates,months};
}
function initialMonth(d,matches,dates,months){
 const today=new Date(Date.now()+9*60*60*1000).toISOString().slice(0,10),last=matches.map(m=>m.date).filter(validDate).sort().at(-1);
 if(!months.length)return '';
 if(d.status==='completed'||today>dates.at(-1))return (last||dates.at(-1)).slice(0,7);
 return months.includes(today.slice(0,7))?today.slice(0,7):months[0];
}
function render(state){
 const {root,data,records,months,month,options}=state,settings=data.structure?.calendarDisplay||{};
 root.classList.add('kvl-match-calendar');root.classList.toggle('dv2-vleague-calendar',settings.mode==='vleague-compact');
 if(!months.length){root.innerHTML='<div class="dv2-empty">공식 일정 발표 후 표시합니다.</div>';return;}
 const [year,mo]=month.split('-').map(Number),offset=new Date(Date.UTC(year,mo-1,1)).getUTCDay(),days=new Date(Date.UTC(year,mo,0)).getUTCDate(),byDate=new Map();
 for(const match of records){if(!byDate.has(match.date))byDate.set(match.date,[]);byDate.get(match.date).push(match);}
 const cells=[];
 for(let i=0;i<Math.ceil((offset+days)/7)*7;i++){
  const date=new Date(Date.UTC(year,mo-1,i-offset+1)),key=date.toISOString().slice(0,10),games=byDate.get(key)||[],outside=date.getUTCMonth()!==mo-1;
  const holiday=display().dateInfo(key,settings.holidayRegion??'KR'),summaries=games.map(m=>display().game(m,data,settings));
  const events=Array.isArray(settings.events)?settings.events.filter(e=>e?.date===key&&typeof e.label==='string'):[];
  const final=games.some(m=>m.round==='FINAL'||m.stage==='결승');
  let details='';
  if(games.length===1){const s=summaries[0];details=`<span class="dv2-calendar-game" title="${esc(s.fullLabel)}"><span class="dv2-calendar-matchup"><span class="dv2-calendar-side">${esc([s.round,s.homeLabel].filter(Boolean).join(' '))}</span> <span class="dv2-calendar-side">${esc(s.resultLabel)} ${esc(s.awayLabel)}</span></span>${locationMarkup(s,games[0])}</span>`;}
  else if(games.length>1)details=`<span class="kvl-calendar-count"><b>${games.length}</b>경기</span>${final?'<span class="kvl-calendar-stage">결승 포함</span>':''}`;
  const content=`<span class="dv2-calendar-date${holiday.red?' is-holiday':''}"${holiday.name?` title="${esc(holiday.name)}"`:''}>${date.getUTCDate()}</span>${details}${events.map(e=>`<span class="dv2-calendar-event">${esc(e.label)}</span>`).join('')}`;
  const accessible=[key,holiday.name,...events.map(e=>e.label),games.length===1?summaries[0].fullLabel:games.length?games.length+'경기 · 전체 대진과 결과 보기':''].filter(Boolean).join(', ');
  cells.push(games.length?`<button type="button" class="dv2-day has-match${outside?' outside':''}${final?' final':''}${holiday.red?' is-holiday-day':''}" data-dv2-date="${key}" aria-haspopup="dialog" aria-label="${esc(accessible)}">${content}</button>`:`<div class="dv2-day${outside?' outside':''}"${holiday.name||events.length?` aria-label="${esc(accessible)}"`:''}>${content}</div>`);
 }
 root.innerHTML=`<div class="dv2-calendar-top"><small>${options.teamCode?'TEAM CALENDAR':'TOURNAMENT CALENDAR'}</small><h3><span class="dv2-calendar-year">${year}<em>년</em></span><span class="dv2-calendar-month">${String(mo).padStart(2,'0')}<em>월</em></span></h3><div class="dv2-calendar-controls"><button type="button" data-dv2-month="-1" aria-label="이전 달" ${month===months[0]?'disabled':''}>‹</button><button type="button" data-dv2-month="1" aria-label="다음 달" ${month===months.at(-1)?'disabled':''}>›</button></div></div><div class="dv2-calendar-fit" role="region" aria-label="${year}년 ${mo}월 경기 달력"><div class="dv2-calendar-board"><div class="dv2-week">${['일','월','화','수','목','금','토'].map(w=>`<span>${w}</span>`).join('')}</div><div class="dv2-calendar-grid">${cells.join('')}</div></div></div><p class="dv2-calendar-hint">한국시간(KST) 기준 · 날짜를 선택하면 전체 대진과 세트별 점수를 볼 수 있습니다.</p>`;
}
function dialog(){
 let el=document.getElementById('dv2-day-dialog');if(el)return el;
 el=document.createElement('dialog');el.id='dv2-day-dialog';el.className='kvl-calendar-dialog';el.setAttribute('aria-labelledby','dv2-day-title');
 el.innerHTML='<div class="dv2-dialog-heading"><h2 id="dv2-day-title"></h2><button type="button" data-dv2-close aria-label="상세 창 닫기">×</button></div><div class="dv2-day-matches"></div><a class="dv2-day-schedule">이 날짜 경기 일정·결과 보기 ›</a>';
 el.addEventListener('click',e=>{if(e.target===el||e.target.closest('[data-dv2-close]'))el.close();});document.body.append(el);return el;
}
function matchCard(m,data,options={}){
 const side=t=>{const url=options.teamUrl?.(t.code),mark=options.mark?.(t)??((t.logo||t.flag)?`<img src="${esc(t.logo||t.flag)}" alt="" loading="lazy">`:'');return url?`<a href="${esc(url)}">${mark}<b>${esc(name(t))}</b></a>`:`<span>${mark}<b>${esc(name(t))}</b></span>`;};
 const summary=display().game(m,data,data.structure?.calendarDisplay||{}),s=m.score;
  return `<article class="dv2-day-match" data-calendar-match="${esc(m.id)}"><div class="dv2-match-meta"><b>${esc(m.stage||'경기')}${m.pool?' · '+esc(m.pool)+'조':''}</b><span>${esc(m.time||'시간 미정')} KST</span></div><div class="dv2-match-teams">${side(resolve(data,m.home))}<strong>${esc(options.resultLabel||(summary.resultLabel==='vs'?'VS':summary.resultLabel.replace('-', ' : ')))}</strong>${side(resolve(data,m.away))}</div><div class="dv2-setline">${(m.reportedSets||s?.sets||[]).map((set,i)=>`<span title="${i+1}세트">${esc(set.home)}-${esc(set.away)}</span>`).join('')||'세트별 득점 확인 중'}</div>${m.scoreNote?`<p class="kvl-score-note">${esc(m.scoreNote)}</p>`:''}<small class="dv2-match-venue">${esc(m.venueLabel||data.venueLabel||'장소 미정')}</small>${m.localTimeLabel?`<small class="dv2-match-venue">${esc(m.localTimeLabel)}</small>`:''}</article>`;
}
function openDay(state,date){
 const {data,options}=state,games=state.records.filter(m=>m.date===date),el=dialog();
 el.querySelector('#dv2-day-title').textContent=date.replaceAll('-','.')+' · '+games.length+'경기';
 el.querySelector('.dv2-day-matches').innerHTML=games.map(m=>matchCard(m,data,options)).join('');
 const link=el.querySelector('.dv2-day-schedule'),url=options.scheduleUrl?.(date);link.hidden=!url;if(url)link.href=url;
 el.showModal();
}
function mount(root,data,options={}){
 if(!root||!display())return false;
 const records=(options.records||data.matches||[]).filter(m=>active(m)&&validDate(m.date)).slice().sort((a,b)=>(a.date+'T'+(a.time||'')).localeCompare(b.date+'T'+(b.time||'')));
 const {dates,months}=range(data,records,options.teamCode),state={root,data,options,records,months,month:initialMonth(data,records,dates,months)};
 const existing=states.has(root);states.set(root,state);if(!existing)root.addEventListener('click',event=>{
  const state=states.get(root),move=event.target.closest('[data-dv2-month]'),day=event.target.closest('[data-dv2-date]');
  if(move&&!move.disabled){state.month=state.months[state.months.indexOf(state.month)+Number(move.dataset.dv2Month)];render(state);}
  if(day)openDay(state,day.dataset.dv2Date);
 });
 render(state);dialog();return true;
}
window.KVLMatchCalendarV1={mount,dialog,matchCard};
})();
