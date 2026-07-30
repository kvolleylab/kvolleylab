(()=>{
const weekdays=['일','월','화','수','목','금','토'];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const shortName=n=>String(n||'').replace('국립목포대학교','목포대').replace('경상국립대학교','경상국립대').replace('국립','').replace('대학교','대');
const initials=n=>shortName(n).replace('대','').slice(0,2);
function formatDate(raw){const m=String(raw||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return raw||'';const d=new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);return `${m[1]}.${m[2]}.${m[3]}(${weekdays[d.getDay()]})`}
function installStyles(){if(document.getElementById('cdBracketHorizontalStyle'))return;const style=document.createElement('style');style.id='cdBracketHorizontalStyle';style.textContent=`
#cdKnockoutBracket .cd-pyramid{min-width:960px!important;max-width:1040px!important;padding:6px 16px 28px!important}
#cdKnockoutBracket .cd-pyramid-row.is-final{grid-template-columns:minmax(360px,480px)!important;margin-top:56px!important}
#cdKnockoutBracket .cd-pyramid-row.is-semis{grid-template-columns:repeat(2,minmax(320px,1fr))!important;gap:110px!important;margin-top:86px!important;padding:0 18px!important}
#cdKnockoutBracket .cd-pyramid-row.is-entries{grid-template-columns:140px 285px 140px 285px!important;justify-content:center!important;column-gap:22px!important;margin-top:98px!important}
#cdKnockoutBracket .cd-pyramid-row.is-entries .cd-direct-card{width:140px!important}
#cdKnockoutBracket .cd-pyramid-row.is-entries .cd-bracket-game{width:285px!important}
#cdKnockoutBracket .cd-bracket-game{border-radius:16px!important}
#cdKnockoutBracket .cd-bracket-title{padding:8px 12px!important;background:#17365d!important;font-size:13px!important}
#cdKnockoutBracket .cd-bracket-meta{display:grid!important;grid-template-columns:1fr!important;gap:2px!important;justify-items:center!important;padding:7px 10px!important;text-align:center!important;line-height:1.35!important}
#cdKnockoutBracket .cd-bracket-meta span+span:before{display:none!important}
#cdKnockoutBracket .cd-horizontal-match{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:center;gap:4px;padding:11px 8px;border-top:1px solid #eef2f7;background:#fff}
#cdKnockoutBracket .cd-horizontal-side{display:flex;align-items:center;gap:4px;min-width:0;color:#64748b;text-decoration:none;font-size:13px}
#cdKnockoutBracket .cd-horizontal-side.is-right{justify-content:flex-end;text-align:right}
#cdKnockoutBracket .cd-horizontal-side strong{display:block;min-width:0;white-space:nowrap}
#cdKnockoutBracket .cd-pyramid-row.is-entries .cd-horizontal-side{font-size:12px}
#cdKnockoutBracket .cd-horizontal-side.is-winner strong{color:#c62828!important;font-weight:900}
#cdKnockoutBracket .cd-horizontal-side .cd-inline-logo{flex:0 0 25px;width:25px!important;height:25px!important}
#cdKnockoutBracket .cd-horizontal-score{display:flex;align-items:center;gap:3px;color:#334155;font-size:17px;white-space:nowrap}
#cdKnockoutBracket .cd-horizontal-score i{font-style:normal;color:#94a3b8}
#cdKnockoutBracket .cd-horizontal-score span.is-winner{color:#c62828!important}
#cdKnockoutBracket .cd-champion{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:0!important;padding:10px 22px!important;border:2px solid #c9a24a!important;border-radius:999px!important;background:#17365d!important;color:#fff!important;box-shadow:0 12px 28px rgba(23,54,93,.18)!important}
#cdKnockoutBracket .cd-champion:before{display:none!important;content:none!important}
#cdKnockoutBracket .cd-champion-trophy{font-size:22px!important;line-height:1!important}
#cdKnockoutBracket .cd-champion .cd-inline-logo{width:38px!important;height:38px!important;background:#fff!important;border-radius:10px!important}
#cdKnockoutBracket .cd-champion strong{display:block!important;color:#fff!important;font-size:20px!important;white-space:nowrap!important}
.cd-knockout-wrap>.cd-rule-card.is-below-bracket{margin:30px auto 0!important}
.cd-division-switch{display:flex;gap:8px;margin:14px 0 20px}
.cd-division-switch button{padding:9px 16px;border:1px solid #dbe2ea;border-radius:999px;background:#fff;color:#536477;font:inherit;font-size:13px;font-weight:900;cursor:pointer}
.cd-division-switch button.is-active{border-color:#17365d;background:#17365d;color:#fff}
.cd-women-final-note{margin:22px 0 0;padding:20px;border:1px solid #dbe2ea;border-radius:18px;background:#f8fafc;color:#64748b;text-align:center;line-height:1.7}
.cd-team-card.is-women{cursor:default}
.cd-team-card.is-women small{color:#8a6a16}
@media(max-width:760px){#cdKnockoutBracket .cd-pyramid{min-width:920px!important}#cdKnockoutBracket .cd-pyramid-row.is-semis{gap:64px!important;padding:0!important}#cdKnockoutBracket .cd-pyramid-row.is-entries{grid-template-columns:135px 275px 135px 275px!important;column-gap:14px!important}#cdKnockoutBracket .cd-pyramid-row.is-entries .cd-direct-card{width:135px!important}#cdKnockoutBracket .cd-pyramid-row.is-entries .cd-bracket-game{width:275px!important}}
`;document.head.appendChild(style)}
function horizontalize(card){if(card.dataset.horizontalReady==='1')return;const meta=card.querySelector('.cd-bracket-meta'),teams=[...card.querySelectorAll('.cd-bracket-team')];if(!meta||teams.length!==2)return;const parts=[...meta.querySelectorAll('span')],dt=(parts[0]?.textContent||'').split('·').map(v=>v.trim()),venue=parts[1]?.textContent.trim()||'';meta.innerHTML=`<span>${formatDate(dt[0])}${dt[1]?` ${dt[1]}`:''}</span><span>${venue}</span>`;const info=teams.map(team=>({href:team.getAttribute('href')||'#',logo:team.querySelector(':scope > .cd-inline-logo')?.outerHTML||'',name:team.querySelector(':scope > span:not(.cd-inline-logo)')?.textContent.trim()||'',score:team.querySelector(':scope > b')?.textContent.trim()||'',winner:team.classList.contains('is-winner')}));teams.forEach(team=>team.remove());const row=document.createElement('div');row.className='cd-horizontal-match';row.innerHTML=`<a href="${info[0].href}" class="cd-horizontal-side ${info[0].winner?'is-winner':''}">${info[0].logo}<strong>${info[0].name}</strong></a><b class="cd-horizontal-score"><span class="${info[0].winner?'is-winner':''}">${info[0].score}</span><i>-</i><span class="${info[1].winner?'is-winner':''}">${info[1].score}</span></b><a href="${info[1].href}" class="cd-horizontal-side is-right ${info[1].winner?'is-winner':''}"><strong>${info[1].name}</strong>${info[1].logo}</a>`;meta.insertAdjacentElement('afterend',row);card.dataset.horizontalReady='1'}
function styleChampion(root){const champion=root.querySelector('.cd-champion');if(!champion||champion.dataset.capsuleReady==='1')return;const logo=champion.querySelector('.cd-inline-logo')?.outerHTML||'',rawName=champion.querySelector('strong')?.textContent.trim().replace(/^우승\s*/,'')||'인하대';champion.innerHTML=`<span class="cd-champion-trophy">🏆</span>${logo}<strong>우승 ${rawName}</strong>`;champion.dataset.capsuleReady='1'}
function applyBracket(root){const cards=[...root.querySelectorAll('.cd-bracket-game')];if(!cards.length)return false;installStyles();cards.forEach(horizontalize);styleChampion(root);requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));return true}
function fallbackLogo(team,cls){return `<span class="${cls}"><b>${esc(initials(team))}</b></span>`}
async function setupDivisionTabs(){const podium=document.getElementById('cdPodium'),teams=document.getElementById('cdTeams'),knockout=document.querySelector('#standings .cd-knockout-wrap');if(!podium||!teams||document.querySelector('.cd-division-switch'))return;let data;try{data=await fetch('data/competitions/gosung-2026.json',{cache:'no-store'}).then(r=>r.json())}catch{return}
const malePodium=podium.innerHTML,maleTeams=teams.innerHTML;
const finalSwitch=document.createElement('div');finalSwitch.className='cd-division-switch';finalSwitch.innerHTML='<button type="button" class="is-active" data-final-division="남대부">남대부</button><button type="button" data-final-division="여대부">여대부</button>';podium.before(finalSwitch);
const teamSwitch=document.createElement('div');teamSwitch.className='cd-division-switch';teamSwitch.innerHTML='<button type="button" class="is-active" data-team-division="남대부">남대부</button><button type="button" data-team-division="여대부">여대부</button>';teams.before(teamSwitch);
const medal={1:'🥇',2:'🥈',3:'🥉'};
function renderWomenPodium(){podium.innerHTML=(data.podium?.['여대부']||[]).map(x=>`<div class="cd-rank rank-${x.rank}"><span class="cd-medal">${medal[x.rank]||'🏅'}</span><strong>${x.rank}위</strong>${fallbackLogo(x.team,'cd-podium-logo')}<h3>${esc(x.team)}</h3></div>`).join('')||'<div class="cd-empty">여대부 최종 순위 데이터가 없습니다.</div>';if(knockout)knockout.style.display='none';let note=document.getElementById('cdWomenFinalNote');if(!note){note=document.createElement('div');note.id='cdWomenFinalNote';note.className='cd-women-final-note';podium.after(note)}note.innerHTML='<strong>여대부 최종 순위</strong><br>공식 경기결과 기준입니다. 여자부 선수 DB는 아직 연결되지 않았습니다.'}
function renderMalePodium(){podium.innerHTML=malePodium;if(knockout)knockout.style.display='';document.getElementById('cdWomenFinalNote')?.remove()}
function renderWomenTeams(){const names=[...new Set((data.games||[]).filter(g=>g.division==='여대부').flatMap(g=>[g.teamA,g.teamB]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));teams.innerHTML=names.map(name=>`<div class="cd-team-card is-women">${fallbackLogo(name,'cd-team-mark')}<span><strong>${esc(name)}</strong><small>선수명단 자료 미연결</small></span></div>`).join('')||'<div class="cd-empty">여대부 참가대학 데이터가 없습니다.</div>'}
finalSwitch.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{finalSwitch.querySelectorAll('button').forEach(x=>x.classList.toggle('is-active',x===btn));btn.dataset.finalDivision==='여대부'?renderWomenPodium():renderMalePodium()}));
teamSwitch.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{teamSwitch.querySelectorAll('button').forEach(x=>x.classList.toggle('is-active',x===btn));if(btn.dataset.teamDivision==='여대부')renderWomenTeams();else teams.innerHTML=maleTeams}));
}
function moveRuleBelow(){const wrap=document.querySelector('.cd-knockout-wrap'),rule=wrap?.querySelector('.cd-rule-card'),bracket=wrap?.querySelector('#cdKnockoutBracket');if(rule&&bracket&&rule.previousElementSibling!==bracket){rule.classList.add('is-below-bracket');bracket.insertAdjacentElement('afterend',rule)}}
function init(){installStyles();moveRuleBelow();const root=document.getElementById('cdKnockoutBracket');if(root){if(!applyBracket(root)){const observer=new MutationObserver(()=>{if(applyBracket(root))observer.disconnect()});observer.observe(root,{childList:true});window.setTimeout(()=>observer.disconnect(),5000)}}window.setTimeout(setupDivisionTabs,400)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();