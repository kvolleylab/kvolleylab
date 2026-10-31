/* Opt-in international presentation; reuses the existing shell, renderer, data and controllers. */
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const model=window.KVLInternationalModel,href=(v,p)=>window.KVLCompetitionTemplateV2.viewUrl(v,p);
const enabled=d=>d.structure?.presentation==='international-home-v1';
const trophy=rank=>Number(rank)>3?'':`<svg class="iv-trophy trophy-${Number(rank)}" viewBox="0 0 28 30" aria-hidden="true"><path class="handles" d="M7 5H3v4c0 4 2 6 6 6M21 5h4v4c0 4-2 6-6 6"/><path d="M7 3h14v8c0 5-3.1 8-7 8s-7-3-7-8V3Z"/><path class="shine" d="M10 6v5c0 2 .7 3.6 2 4.5"/><path d="M12 18h4v6h-4zM9 24h10l2 3H7z"/></svg>`;
const icons={overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',schedule:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',groups:'<path d="M4 21V12h4v9M10 21V4h4v17M16 21v-8h4v8M2 21h20"/>',knockout:'<path d="M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a5 5 0 0 0 5 5M17 5h4v3a5 5 0 0 1-5 5M12 15v5M8 21h8"/>',rosters:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 4 5v2"/>',resources:'<path d="M5 3h9l5 5v13H5V3ZM14 3v6h5M8 13h8M8 17h6"/>'};
const sourceLinks=(ids,p)=>(ids||[]).map(id=>{const s=p.sources[id];return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`:'';}).join('');
function meaning(d,p){
 const s=q('[data-kvl-section="qualifications"]'),m=model.explanation(d,p);if(!s)return;
 s.dataset.kvlEmpty='false';s.innerHTML=`<div class="iv-section-heading"><div><p class="iv-eyebrow">대회를 이해하는 길잡이</p><h2>${esc(m.title)}</h2></div><span class="iv-pill">${esc(d.season)} 시즌 기준</span></div>
 <p class="iv-lead">${esc(m.note)}</p>
 <div class="iv-facts">${m.facts.map(f=>`<div><h3>${esc(f.label)}</h3><p>${esc(f.text)}</p></div>`).join('')}</div>
 <ol class="iv-flow" style="--iv-flow-count:${Math.min(4,Math.max(1,m.flow.length))}" aria-label="대회 진행 순서">${m.flow.map((step,i)=>`<li><a href="${esc(href(step.view||'overview'))}"><span class="iv-step">${String(i+1).padStart(2,'0')}</span><div><strong>${esc(step.title)}</strong><small>${esc(step.detail)}</small></div><span class="iv-flow-arrow" aria-hidden="true">›</span></a></li>`).join('')}</ol>
 <div class="iv-explanation-grid">${m.cards.map(c=>`<article class="iv-explanation-card" data-explanation-ref="${esc(c.id)}" data-kind="${esc(c.kind)}"><div class="iv-explanation-top"><span>${esc(c.brand)}</span><b>${esc(c.pill)}</b></div><h3>${esc(c.title)}</h3><p class="iv-original-description">${esc(c.description)}</p>${c.resultTeams?.length?`<div class="iv-confirmed"><small>${c.kind==='result'?'확정된 시즌 결과':'확정된 진출국'}</small><strong>${esc(c.resultTeams.join(' · '))}</strong></div>`:''}<div class="iv-explanation-foot"><span>${esc(c.foot)}</span><div>${sourceLinks(c.sources,p)}</div></div></article>`).join('')}</div>
 <div class="iv-relations">${m.relations.map(r=>`<article data-evidence-state="${esc(r.state)}"><h3>${esc(r.label)} <span>${({verified:'공식 확인',unverified:'미확인',not_applicable:'해당 없음'})[r.state]}</span></h3><p>${esc(r.text)}</p>${sourceLinks(r.sources,p)}</article>`).join('')}</div>`;
}
function summary(d){
 const area=q('.kvl1180-overview-result');
 if(area&&d.status==='completed'&&d.champion&&!q('.iv-trophy',area)){area.insertAdjacentHTML('afterbegin',trophy(1));area.classList.add('iv-winner');}
 const kpis=qa('.kvl1180-kpi');kpis.forEach((k,i)=>{if(i<4&&!q('.iv-kpi-arrow',k))k.insertAdjacentHTML('beforeend','<b class="iv-kpi-arrow" aria-hidden="true">›</b>');});
}
function calendar(d){
 const root=q('[data-kvl-component="calendar"]');if(!root)return;
 const panels=qa('.kvl1180-calendar',root),months=[...new Set((d.matches||[]).map(m=>m.date?.slice(0,7)).filter(Boolean))].sort();if(!panels.length)return;
 const parent=root.parentElement;q('.kvl1180-calendar-head > p',parent).textContent='경기일을 선택하면 해당 날짜의 경기 결과와 세트 점수를 확인할 수 있습니다.';
 let bar=q('.iv-monthbar',parent);if(!bar){bar=document.createElement('div');bar.className='iv-monthbar';root.before(bar);}
 let selected=root.dataset.selectedMonth||model.initialMonth(d,months);if(!months.includes(selected))selected=months[0];
 function show(month){selected=month;root.dataset.selectedMonth=month;panels.forEach((el,i)=>{el.hidden=months[i]!==month;});const i=months.indexOf(month);bar.innerHTML=`<div class="iv-month-title"><span>${esc(month.slice(0,4))}년</span><strong>${Number(month.slice(5))}월</strong></div><div class="iv-month-actions"><button type="button" data-month-prev ${i===0?'disabled':''} aria-label="이전 달">‹</button><select aria-label="대회 달력 월 선택">${months.map(m=>`<option value="${m}" ${m===month?'selected':''}>${m.slice(0,4)}년 ${Number(m.slice(5))}월</option>`).join('')}</select><button type="button" data-month-next ${i===months.length-1?'disabled':''} aria-label="다음 달">›</button></div>`;q('select',bar).onchange=e=>show(e.target.value);q('[data-month-prev]',bar).onclick=()=>show(months[i-1]);q('[data-month-next]',bar).onclick=()=>show(months[i+1]);}
 panels.forEach(panel=>qa('.kvl1180-day.has-match',panel).forEach(cell=>{const link=q('a',cell),games=qa('.kvl1180-cal-game',cell);const date=new URL(link.href).searchParams.get('date');link.setAttribute('aria-label',`${date}, ${games.length}경기 결과 보기`);link.title=games.map(g=>g.textContent.trim()).join('\n');const count=document.createElement('span');count.className='iv-day-count';count.textContent=games.length+'경기';q('.kvl1180-date',cell).after(count);}));
 show(selected);
}
function finals(d){
 const rows=model.visibleRanking(d);qa('[data-final-rank]').forEach(card=>{const rank=Number(card.dataset.finalRank),r=rows.find(x=>Number(x.rank)===rank);if(!r)return;const label=q('.kvl1180-final-rank',card);label.innerHTML=trophy(rank)+`<b>${esc(model.rankLabel(r,rows))}</b>`;});
 const root=q('#knockout');if(!root)return;
 q('.iv-all-ranking',root)?.remove();
 if(d.status==='completed'&&(d.finalRankingFull||[]).length){const all=d.finalRankingFull;const section=document.createElement('section');section.className='iv-all-ranking';section.innerHTML=`<div class="iv-section-heading"><h3>최종 전체 순위</h3><span>${all.length}개국 · 대회 종료 기준</span></div><div class="iv-rank-list">${all.map(r=>{const t=(d.participants||[]).find(t=>t.code===r.code)||r;return `<a href="${esc(href('team',{team:r.code}))}"><b>${esc(model.rankLabel(r,all))}</b><img src="${esc(t.flag||r.flag)}" alt=""><strong>${esc(r.team||t.name)}</strong><small>${esc(r.result||'')}</small></a>`;}).join('')}</div>`;root.append(section);}
 const bracket=q('.kvl1180-bracket',root);if(bracket){bracket.tabIndex=0;bracket.setAttribute('role','region');bracket.setAttribute('aria-label','결선 대진표 · 좁은 화면에서 좌우로 이동');}
}
function resources(d,p){
 const root=q('#resourceList');if(!root)return;
 const existing=new Set((d.resources||[]).map(r=>r.url));let extra=q('.iv-extra-resources',root.parentElement);if(!extra){extra=document.createElement('div');extra.className='iv-extra-resources';root.after(extra);}
 extra.innerHTML=`<h3>대회 방식·설명의 공식 근거</h3><div class="iv-source-grid">${Object.values(p.sources).filter(s=>!existing.has(s.url)).map(s=>`<a class="iv-source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"><span>${esc(s.publisher)}</span><strong>${esc(s.title)}</strong><small>공식페이지 ↗</small></a>`).join('')}</div><p class="iv-source-date">확인일 ${esc(p.verifiedAt)} · 시즌이 바뀌는 공식 링크는 해당 연도를 확인해 주세요.</p>`;
}
function participants(d){
 const root=q('[data-kvl-component="participants"]');if(!root)return;
 qa('.kvl1180-participant-buttons',root).forEach(group=>qa('[data-team-code]',group).sort((a,b)=>q('strong',a).textContent.localeCompare(q('strong',b).textContent,'ko')).forEach(b=>group.append(b)));
 let search=q('.iv-country-search');if(!search){search=document.createElement('div');search.className='iv-country-search';search.innerHTML='<label>참가국 검색 <input type="search" placeholder="국가명 또는 영문명" aria-label="참가국 검색"></label><span aria-live="polite"></span>';root.before(search);}
 let empty=q('.iv-no-country');if(!empty){empty=document.createElement('p');empty.className='iv-no-country';empty.hidden=true;empty.textContent='검색어와 일치하는 참가국이 없습니다.';root.after(empty);}
 const filter=()=>{const term=q('input',search).value.toLocaleLowerCase().trim();let n=0;qa('[data-team-code]',root).forEach(el=>{el.hidden=!el.textContent.toLocaleLowerCase().includes(term);if(!el.hidden)n++;});q('span',search).textContent=`${n}개국 · 가나다순`;empty.hidden=n>0;};q('input',search).oninput=filter;filter();
 root.addEventListener('click',()=>requestAnimationFrame(()=>enhanceRoster(d)),{once:true});
}
function enhanceRoster(d){
 const root=q('[data-kvl-component="roster"]');if(!root)return;
 qa('[data-roster-player]',root).forEach(row=>{const id=row.dataset.playerId;if(!/^KVL-P-\d+$/.test(id))return;const name=q('.kvl1180-roster-korean',row);if(name&&!q('a',name)){const text=name.textContent;name.innerHTML=`<a href="https://kvolleylab.com/player.html?id=${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(text)} 선수 프로필">${esc(text)} ↗</a>`;}});
 const table=q('[role="table"]',root);if(table){table.tabIndex=0;table.setAttribute('aria-label',(table.getAttribute('aria-label')||'선수명단')+' · 상세 열 좌우 이동');}
}
function apply(d){
 if(!enabled(d))return;const p=d.structure.international;
 document.body.classList.add('kvl-international-home-v1');
 const main=q('[data-kvl-shell]');if(!q('.iv-utility',main)){const el=document.createElement('div');el.className='iv-utility';el.innerHTML='<span><a href="https://kvolleylab.com">홈</a><i>›</i><a href="https://kvolleylab.com/competition.html">국제대회</a><i>›</i><b>'+esc(d.displayName)+'</b></span><small>검토용 시안</small>';main.prepend(el);}
 qa('.kvl1180-tabs [data-view]').forEach(a=>{const key=a.dataset.view;a.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[key]||''}</svg><span>${esc(p.labels[key]||a.textContent)}</span>`;});
 const heading=q('#schedule h2');if(heading)heading.textContent=p.labels.schedule;
 const rosterHeading=q('[data-kvl-label="participants-title"]');if(rosterHeading)rosterHeading.textContent=p.labels.rosters;
 const kHeading=q('[data-kvl-label="knockout-title"]');if(kHeading)kHeading.textContent=p.labels.knockout;
 meaning(d,p);summary(d);calendar(d);finals(d);resources(d,p);participants(d);enhanceRoster(d);
 // V2's generic single-league heading says regular season. Use configured international terminology.
 if(d.structure.standings?.mode==='single-league'){const head=q('.kvl1180-combined-head');if(head){q('.label',head).textContent=d.structure.labels?.standingsEyebrow||'STANDINGS';q(':scope > p',head).textContent=d.standingsNote||'';}}
 window.KVLCompetitionTemplateV2.applyView();
}
window.KVLInternationalPresentation={apply,enhanceRoster};
const render=window.KVLCompetitionComponentsV2.render;
window.KVLCompetitionComponentsV2.render=function(d=window.KVL_COMPETITION_V2_DATA){render(d);apply(d);};
// The original participant click and popstate handlers continue to own selection and rendering.
document.addEventListener('click',e=>{if(e.target.closest('[data-team-code],[data-team-roster]'))requestAnimationFrame(()=>enhanceRoster(window.KVL_COMPETITION_V2_DATA));});
addEventListener('popstate',()=>{const d=window.KVL_COMPETITION_V2_DATA;if(enabled(d)){participants(d);enhanceRoster(d);}});
})();
