(()=>{
const DATA='data/master/player_master_229_v2.json';
const main=document.getElementById('utdMain');
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const avg=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0;
const STAFF={};
const bars=(obj,total)=>Object.entries(obj).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).map(([k,v])=>`<div class="utd-bar"><span>${esc(k)}${/^\d+$/.test(k)?'학년':''}</span><div class="utd-track"><div class="utd-fill" style="width:${Math.max(5,v/total*100)}%"></div></div><strong>${v}</strong></div>`).join('');
const rosterSort=(a,b)=>(b.grade-a.grade)||(Number(a.jersey)-Number(b.jersey))||a.name.localeCompare(b.name);
const params=new URLSearchParams(location.search);const school=params.get('school');
fetch(DATA,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(players=>{
 const teamPlayers=players.map(p=>{const r=p.current_roster||{};return{raw:p,code:r.school_code||'',school:r.school_name||String(r.team_name||'').replace(' 남자배구부',''),id:p.system?.player_id||'',name:p.identity?.name_ko||'',grade:Number(r.grade||p.volleyball?.grade||0),position:r.position||p.volleyball?.position||'',height:Number(p.physical?.height_cm)||0,jersey:r.jersey_number??'',draft:Boolean(r.draft_eligible||p.volleyball?.draft_eligible),previous:r.previous_school||''}}).filter(p=>p.code===school);
 if(!teamPlayers.length){main.innerHTML='<div class="utd-empty">해당 대학 팀을 찾을 수 없습니다.</div>';return}
 const teamName=teamPlayers[0].school;document.title=`${teamName} | K-Volley Lab`;
 const heights=teamPlayers.map(p=>p.height).filter(Boolean);const grades={};const positions={};teamPlayers.forEach(p=>{if(p.grade)grades[p.grade]=(grades[p.grade]||0)+1;if(p.position)positions[p.position]=(positions[p.position]||0)+1});
 const staff=STAFF[school]||{coach:'확인 중',assistant:'확인 중'};
 main.innerHTML=`<a class="utd-back" href="university-teams.html">← 대학 팀 분석으로</a><section class="utd-hero"><div><p class="eyebrow">UNIVERSITY TEAM</p><h1>${esc(teamName)}</h1><div class="utd-staff">감독 ${esc(staff.coach)} · 코치 ${esc(staff.assistant)}</div><div class="utd-actions"><a href="players.html?school=${encodeURIComponent(school)}">이 학교 선수 검색</a><a href="pamphlet-archive.html">팜플렛 보기</a></div></div><div class="utd-stats"><div class="utd-stat"><span>총원</span><strong>${teamPlayers.length}명</strong></div><div class="utd-stat"><span>평균신장</span><strong>${avg(heights).toFixed(1)}cm</strong></div><div class="utd-stat"><span>드래프트 대상</span><strong>${teamPlayers.filter(p=>p.draft).length}명</strong></div></div></section><section class="utd-grid"><article class="utd-card"><h2>학년 분포</h2><div class="utd-bars">${bars(grades,teamPlayers.length)}</div></article><article class="utd-card"><h2>포지션 분포</h2><div class="utd-bars">${bars(positions,teamPlayers.length)}</div></article></section><section class="utd-card" style="margin-top:18px"><h2>선수 명단</h2><div class="utd-roster">${[...teamPlayers].sort(rosterSort).map(p=>`<a class="utd-player" href="player.html?id=${encodeURIComponent(p.id)}"><strong><span>${esc(p.name)}</span>${p.draft?'<span class="utd-draft">Draft</span>':''}</strong><small><span>${esc(p.grade)}학년</span><span>${esc(p.position||'-')}</span><span>${p.height?`${p.height}cm`:'키 확인 불가'}</span><span>#${esc(p.jersey)}</span></small>${p.previous?`<div style="margin-top:6px;color:var(--soft);font-size:12px">출신: ${esc(p.previous)}</div>`:''}</a>`).join('')}</div></section>`;
}).catch(()=>{main.innerHTML='<div class="utd-empty">대학 팀 데이터를 불러오지 못했습니다.</div>'});
})();
