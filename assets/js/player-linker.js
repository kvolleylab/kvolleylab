(()=>{
const n=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9가-힣]/g,'');
fetch('data/master/player_link_index_v1.json',{cache:'no-store'}).then(r=>r.json()).then(idx=>{const run=()=>document.querySelectorAll('table tbody tr').forEach(tr=>{const cells=tr.querySelectorAll('td');if(cells.length<2)return;const cell=cells[1];if(cell.querySelector('a'))return;const hit=idx[n(cell.textContent)];if(!hit)return;const a=document.createElement('a');a.className='nt-player-link';a.href=`player.html?id=${encodeURIComponent(hit.player_id)}`;a.textContent=cell.textContent.trim();cell.textContent='';cell.appendChild(a)});run();setTimeout(run,400);setTimeout(run,1200)}).catch(()=>{});
const COUNTRY_BY_PAGE={'japan.html':'Japan','brazil.html':'Brazil','poland.html':'Poland','iran.html':'Iran','usa.html':'USA','france.html':'France','argentina.html':'Argentina','italy.html':'Italy','canada.html':'Canada','belgium.html':'Belgium','cuba.html':'Cuba','slovenia.html':'Slovenia','germany.html':'Germany','serbia.html':'Serbia','turkiye.html':'Turkey','bulgaria.html':'Bulgaria','china.html':'China','ukraine.html':'Ukraine'};
const KO={Japan:'일본',Brazil:'브라질',Poland:'폴란드',Iran:'이란',USA:'미국',France:'프랑스',Argentina:'아르헨티나',Italy:'이탈리아',Canada:'캐나다',Belgium:'벨기에',Cuba:'쿠바',Slovenia:'슬로베니아',Germany:'독일',Serbia:'세르비아',Turkey:'튀르키예',Bulgaria:'불가리아',China:'중국',Ukraine:'우크라이나'};
const page=location.pathname.split('/').pop()||'',team=COUNTRY_BY_PAGE[page];if(!team)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
Promise.all([fetch('data/results/vnl-2026-men-team-results-v2.json',{cache:'no-store'}).then(r=>r.json()),fetch('data/standings/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.json())]).then(([resultData,standingData])=>{
 if(document.querySelector('.vnl-team-record'))return;
 const matches=(resultData.matches||[]).filter(m=>m[1]===team||m[2]===team).map(m=>{const home=m[1]===team,ts=home?m[3]:m[4],os=home?m[4]:m[3];return{date:m[0],opp:home?m[2]:m[1],teamScore:ts,oppScore:os,win:ts>os}}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const standing=(standingData.rows||[]).find(r=>r.country===team||(team==='Turkey'&&r.country==='Türkiye'));
 const teamKo=KO[team]||team;
 const rows=matches.map(m=>`<div class="vnl-team-record-row"><time>${esc(m.date)}</time><strong>${esc(teamKo)} ${m.teamScore}-${m.oppScore} ${esc(KO[m.opp]||m.opp)}</strong><span class="vnl-team-record-score">${m.win?'승':'패'}</span></div>`).join('');
 const summary=standing?`${standing.wins}승 ${standing.losses}패 · ${standing.points}점 · 현재 ${standing.rank}위`:`${matches.filter(m=>m.win).length}승 ${matches.filter(m=>!m.win).length}패`;
 const box=document.createElement('section');box.className='vnl-team-record';box.innerHTML=`<div class="vnl-team-record-head"><h2>2026 VNL 경기 결과</h2><div class="vnl-team-record-summary">${esc(summary)} · 2주차 종료 기준</div></div><div class="vnl-team-record-list">${rows||'<div>완료 경기 없음</div>'}</div>`;
 const anchor=document.querySelector('.nt-actions')||document.querySelector('.actions')||document.querySelector('.nt-stats')||document.querySelector('.stats')||document.querySelector('main .nt-hero')||document.querySelector('main .hero');
 if(anchor)anchor.insertAdjacentElement('afterend',box);
}).catch(()=>{});
})();