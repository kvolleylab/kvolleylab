(()=>{
const n=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9가-힣]/g,'');
fetch('data/master/player_link_index_v1.json',{cache:'no-store'}).then(r=>r.json()).then(idx=>{const run=()=>document.querySelectorAll('table tbody tr').forEach(tr=>{const cells=tr.querySelectorAll('td');if(cells.length<2)return;const cell=cells[1];if(cell.querySelector('a'))return;const hit=idx[n(cell.textContent)];if(!hit)return;const a=document.createElement('a');a.className='nt-player-link';a.href=`player.html?id=${encodeURIComponent(hit.player_id)}`;a.textContent=cell.textContent.trim();cell.textContent='';cell.appendChild(a)});run();setTimeout(run,400);setTimeout(run,1200)}).catch(()=>{});

const COUNTRY_BY_PAGE={
 'japan.html':'일본','brazil.html':'브라질','poland.html':'폴란드','iran.html':'이란','usa.html':'미국','france.html':'프랑스','argentina.html':'아르헨티나','italy.html':'이탈리아','canada.html':'캐나다','belgium.html':'벨기에','cuba.html':'쿠바','slovenia.html':'슬로베니아','germany.html':'독일','serbia.html':'세르비아','turkiye.html':'튀르키예','bulgaria.html':'불가리아','china.html':'중국','ukraine.html':'우크라이나'
};
const page=location.pathname.split('/').pop()||'';
const country=COUNTRY_BY_PAGE[page];
if(!country)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
Promise.all([
 fetch('data/matches/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.ok?r.json():{matches:[]}),
 fetch('data/standings/vnl-2026-men.json',{cache:'no-store'}).then(r=>r.ok?r.json():{rows:[]})
]).then(([matchData,standingData])=>{
 const matches=(matchData.matches||[]).filter(m=>m.status==='completed'&&(m.home?.name_ko===country||m.away?.name_ko===country)).sort((a,b)=>String(a.datetime_kst||'').localeCompare(String(b.datetime_kst||'')));
 const standing=(standingData.rows||[]).find(r=>r.country_ko===country);
 if(!matches.length&&!standing)return;
 const rows=matches.map(m=>{const isHome=m.home?.name_ko===country,opponent=isHome?m.away?.name_ko:m.home?.name_ko,hs=Number(m.score?.home_sets),as=Number(m.score?.away_sets),teamScore=isHome?hs:as,oppScore=isHome?as:hs,win=teamScore>oppScore;return`<div class="vnl-team-record-row"><time>${esc(m.date_kst||'날짜 미정')}</time><strong>${win?'승':'패'} · vs ${esc(opponent||'-')}</strong><span class="vnl-team-record-score">${teamScore}-${oppScore}</span></div>`}).join('');
 const summary=standing?`${standing.wins}승 ${standing.losses}패 · ${standing.points}점 · 현재 ${standing.rank}위`:`${matches.filter(m=>{const h=m.home?.name_ko===country,hs=Number(m.score?.home_sets),as=Number(m.score?.away_sets);return h?hs>as:as>hs}).length}승 ${matches.length}경기`;
 const box=document.createElement('section');box.className='vnl-team-record';box.innerHTML=`<div class="vnl-team-record-head"><h2>2026 VNL 경기 결과</h2><div class="vnl-team-record-summary">${esc(summary)}</div></div><div class="vnl-team-record-list">${rows||'<div>완료 경기 없음</div>'}</div>`;
 const anchor=document.querySelector('.actions')||document.querySelector('.stats')||document.querySelector('main .hero');
 if(anchor)anchor.insertAdjacentElement('afterend',box);
}).catch(()=>{});
})();