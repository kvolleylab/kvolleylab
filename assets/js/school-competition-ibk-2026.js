(()=>{'use strict';
const D=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
const keys={'18세이하 남자부':'m18','18세이하 여자부':'w18','15세이하 남자부':'m15','15세이하 여자부':'w15'};
const venues={m18:'대원대학교 민송체육관',m15:'제천어울림체육관',w18:'제천실내체육관',w15:'제천중학교'};
const G=[];
const add=(date,division,pairs,stage='예선',venue=venues[keys[division]],start='09:30')=>pairs.forEach((pair,i)=>G.push({id:`ibk-${date}-${keys[division]}-${i+1}`,date,division,venue,start:i===0?start:`${i+1}경기`,order:i+1,stage,teamA:pair[0],teamB:pair[1],score:null,sets:[]}));
add('2026-07-31',D[0],[['울산스포츠과학고','수성고'],['광주전자공고','경북체육고'],['속초고','성지고'],['천안고','인하사대부고'],['남성고','제천산업고'],['대전중앙고','진주동명고']]);
add('2026-08-01',D[0],[['화성시G-스포츠클럽','옥천고'],['울산스포츠과학고','경북체육고'],['속초고','천안고'],['남성고','진주동명고'],['제천산업고','대전중앙고']]);
add('2026-08-02',D[0],[['부산동성고','화성시G-스포츠클럽'],['울산스포츠과학고','광주전자공고'],['경북체육고','수성고'],['인하사대부고','성지고'],['진주동명고','제천산업고']]);
add('2026-08-03',D[0],[['부산동성고','옥천고'],['수성고','광주전자공고'],['속초고','인하사대부고'],['성지고','천안고'],['남성고','대전중앙고']]);
add('2026-08-04',D[0],Array.from({length:4},()=>['진출팀 미정','8강전']),'8강',venues.m18,'10:00');
add('2026-08-05',D[0],Array.from({length:2},()=>['진출팀 미정','준결승']),'준결승',venues.w18,'10:00');
add('2026-08-06',D[0],[['진출팀 미정','결승전']],'결승',venues.w18,'10:00');
add('2026-07-31',D[2],[['인창중','대연중'],['소사중','문흥중'],['동해광희중','각리중'],['하동중','제천중'],['금호중','율곡중']]);
add('2026-08-01',D[2],[['인창중','금정중'],['대연중','연현중'],['소사중','각리중'],['하동중','율곡중'],['율곡중','제천중']]);
add('2026-08-02',D[2],[['금정중','대연중'],['인창중','연현중'],['문흥중','동해광희중'],['하동중','금호중']]);
add('2026-08-03',D[2],[['연현중','금정중'],['소사중','동해광희중'],['각리중','문흥중'],['제천중','금호중']]);
add('2026-08-04',D[2],Array.from({length:2},()=>['진출팀 미정','6강전']),'6강',venues.m15,'10:00');
add('2026-08-05',D[2],Array.from({length:2},()=>['진출팀 미정','준결승']),'준결승',venues.m15,'10:00');
add('2026-08-06',D[2],[['진출팀 미정','결승전']],'결승',venues.m15,'10:00');
add('2026-07-31',D[1],[['대전용산고','선명여고'],['전주근영여고','경남여고'],['한봄고','중앙여고'],['강릉여고','천안청수고']]);
add('2026-08-01',D[1],[['광주체육고','제천여고'],['목포여상','선명여고'],['일신여상','경남여고'],['중앙여고','강릉여고']]);
add('2026-08-02',D[1],[['대구여고','제천여고'],['일신여상','전주근영여고'],['한봄고','강릉여고'],['천안청수고','중앙여고']]);
add('2026-08-03',D[1],[['대구여고','광주체육고'],['목포여상','대전용산고'],['한봄고','천안청수고']]);
add('2026-08-04',D[1],Array.from({length:4},()=>['진출팀 미정','8강전']),'8강',venues.w18,'10:00');
add('2026-08-05',D[1],Array.from({length:2},()=>['진출팀 미정','준결승']),'준결승',venues.w18,'10:00');
add('2026-08-06',D[1],[['진출팀 미정','결승전']],'결승',venues.w18,'10:00');
add('2026-07-31',D[3],[['세화여중','천안봉서중'],['대구일중','잠실여중'],['모종중','홍천군체육회U-15'],['경남여중','제천여중'],['부평여중','강릉해람중']]);
add('2026-08-01',D[3],[['잠실여중','천안봉서중'],['광주체육중','홍천군체육회U-15'],['중앙여중','모종중'],['제천여중','부평여중'],['강릉해람중','제천여중']]);
add('2026-08-02',D[3],[['천안봉서중','대구일중'],['잠실여중','세화여중'],['광주체육중','중앙여중'],['경남여중','부평여중']]);
add('2026-08-03',D[3],[['세화여중','대구일중'],['광주체육중','모종중'],['홍천군체육회U-15','중앙여중'],['경남여중','강릉해람중']]);
add('2026-08-04',D[3],Array.from({length:2},()=>['진출팀 미정','6강전']),'6강',venues.w15,'10:00');
add('2026-08-05',D[3],Array.from({length:2},()=>['진출팀 미정','준결승']),'준결승',venues.m15,'10:00');
add('2026-08-06',D[3],[['진출팀 미정','결승전']],'결승',venues.m15,'10:00');
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),view=params.get('view')||'overview';$$('.sc-view').forEach(x=>x.classList.toggle('is-active',x.id===view));$$('.sc-nav a').forEach(x=>x.classList.toggle('is-active',x.dataset.view===view));
let div=D[0],teamDiv=D[0],calendarDiv=D[0],stage='전체';
const initials=n=>String(n).replace(/고등학교|중학교|여자|체육회|스포츠과학|대학교|기업은행/g,'').slice(0,2)||'팀';
const logo=n=>`<span class="sc-team-logo" aria-label="${esc(n)} 로고 자리">${esc(initials(n))}</span>`;
const tabs=(id,items,active,cb)=>{const el=$(id);if(!el)return;el.innerHTML=items.map(x=>`<button class="${x===active?'is-active':''}" type="button">${esc(x)}</button>`).join('');[...el.children].forEach((b,i)=>b.onclick=()=>cb(items[i]))};
function styles(){if($('#scIbkStyles'))return;const s=document.createElement('style');s.id='scIbkStyles';s.textContent='.sc-calendar-division-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.sc-calendar-division-tabs button{padding:8px 13px;border:1px solid #dbe2ea;border-radius:999px;background:#fff;color:#536477;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.sc-calendar-division-tabs button.is-active{border-color:#17365d;background:#17365d;color:#fff}.sc-calendar-title{padding:19px 20px!important;background:#17365d!important;color:#fff!important;font-size:27px!important;font-weight:900!important;line-height:1.2!important;text-align:center!important}.sc-calendar-month+.sc-calendar-month{margin-top:24px}.sc-calendar-cell{min-height:132px!important}.sc-calendar-games{display:grid;gap:4px;margin-top:7px}.sc-calendar-game{display:grid;grid-template-columns:34px minmax(0,1fr) 22px minmax(0,1fr);gap:3px;align-items:center;padding:4px 5px;border:1px solid #dfe7ef;border-radius:7px;background:#fff;color:#526274;font-size:9px;line-height:1.2}.sc-calendar-game span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc-calendar-game span:first-of-type{text-align:right}.sc-calendar-game b{color:#b07a00;text-align:center}.sc-pending-panel{padding:34px 20px;border:1px solid #dfe7ef;border-radius:14px;background:#f8fafc;text-align:center}.sc-pending-panel strong{display:block;color:#17365d;font-size:20px}.sc-pending-panel p{margin:8px 0 0;color:#6b7785}@media(max-width:620px){.sc-calendar-title{padding:16px!important;font-size:23px!important}.sc-calendar-cell{min-height:126px!important}}';document.head.appendChild(s)}
function monthCalendar(year,month){const filtered=G.filter(g=>g.division===calendarDiv&&Number(g.date.slice(0,4))===year&&Number(g.date.slice(5,7))===month),byDay=filtered.reduce((m,g)=>{const d=Number(g.date.slice(-2));(m[d]??=[]).push(g);return m},{}),first=new Date(year,month-1,1).getDay(),days=new Date(year,month,0).getDate(),cells=[];for(let i=0;i<first;i++)cells.push('<div class="sc-calendar-cell is-empty"></div>');for(let d=1;d<=days;d++){const list=byDay[d]||[],games=list.map(g=>`<div class="sc-calendar-game" title="${esc(g.venue)} · ${esc(g.stage)}"><time>${esc(g.start)}</time><span>${esc(g.teamA)}</span><b>vs</b><span>${esc(g.teamB)}</span></div>`).join('');cells.push(`<div class="sc-calendar-cell ${list.length?'has-game':''}"><span class="sc-calendar-day">${d}</span>${list.length?`<span class="sc-calendar-stage">${esc([...new Set(list.map(g=>g.stage))].join(' · '))}</span><span class="sc-calendar-count">${list.length}경기</span><div class="sc-calendar-games">${games}</div>`:''}</div>`)}while(cells.length%7)cells.push('<div class="sc-calendar-cell is-empty"></div>');return `<div class="sc-calendar-month"><div class="sc-calendar-title">${year}년 ${month}월</div><div class="sc-calendar-week"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div><div class="sc-calendar-grid">${cells.join('')}</div></div>`}
function calendar(){styles();const root=$('#scCalendar');if(!root)return;root.innerHTML=`<div class="sc-calendar-division-tabs">${D.map(x=>`<button class="${x===calendarDiv?'is-active':''}" type="button" data-calendar-division="${esc(x)}">${esc(x)}</button>`).join('')}</div>${monthCalendar(2026,7)}${monthCalendar(2026,8)}`;root.querySelectorAll('[data-calendar-division]').forEach(btn=>btn.onclick=()=>{calendarDiv=btn.dataset.calendarDivision;calendar()})}
function results(){tabs('#scDivisionTabs',D,div,x=>{div=x;stage='전체';results()});const stages=['전체',...new Set(G.filter(g=>g.division===div).map(g=>g.stage))];tabs('#scStageTabs',stages,stage,x=>{stage=x;results()});const list=G.filter(g=>g.division===div&&(stage==='전체'||g.stage===stage)),groups=list.reduce((m,g)=>((m[g.date]??=[]).push(g),m),{});$('#scResults').innerHTML=Object.entries(groups).map(([d,gs])=>`<section class="sc-date"><div class="sc-date-head"><span>${d}</span><span>${gs.length}경기</span></div>${gs.map(g=>`<article class="sc-match"><div class="sc-meta">${esc(g.start)} · ${esc(g.venue)} · ${esc(g.stage)}</div><div class="sc-board"><span class="sc-team">${esc(g.teamA)}${logo(g.teamA)}</span><b class="sc-score">vs</b><span class="sc-team">${logo(g.teamB)}${esc(g.teamB)}</span></div><div class="sc-sets"><span>경기결과 등록 예정</span></div></article>`).join('')}</section>`).join('')}
function teamView(){tabs('#scTeamTabs',D,teamDiv,x=>{teamDiv=x;teamView()});const list=[...new Set(G.filter(g=>g.division===teamDiv&&g.stage==='예선').flatMap(g=>[g.teamA,g.teamB]))].filter(n=>!n.includes('진출팀')&&!/전$/.test(n)).sort((a,b)=>a.localeCompare(b,'ko'));$('#scTeams').innerHTML=list.map(t=>`<div class="sc-team-card">${logo(t)}<strong>${esc(t)}</strong></div>`).join('')}
function pending(){const html='<div class="sc-pending-panel"><strong>대회 진행 중</strong><p>공식 경기결과가 확정되면 최종 순위와 결선 토너먼트를 반영합니다.</p></div>';$('#scPodiums').innerHTML=html;$('#scBrackets').innerHTML=html}
calendar();results();teamView();pending();
})();