(()=>{
const weekdays=['일','월','화','수','목','금','토'];
function formatDate(raw){
  const m=String(raw||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return raw||'';
  const d=new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return `${m[1]}.${m[2]}.${m[3]}(${weekdays[d.getDay()]})`;
}
function enhanceCard(card){
  if(card.dataset.horizontalReady==='1')return;
  const meta=card.querySelector('.cd-bracket-meta');
  const teams=[...card.querySelectorAll('.cd-bracket-team')];
  if(!meta||teams.length!==2)return;
  const metaParts=[...meta.querySelectorAll('span')];
  const first=metaParts[0]?.textContent.trim()||'';
  const venue=metaParts[1]?.textContent.trim()||'';
  const split=first.split('·').map(v=>v.trim());
  const date=formatDate(split[0]);
  const time=split[1]||'';
  meta.innerHTML=`<span>${date}${time?` ${time}`:''}</span><span>${venue}</span>`;
  const info=teams.map(team=>({
    href:team.getAttribute('href')||'#',
    logo:team.querySelector('.cd-inline-logo')?.outerHTML||'',
    name:team.querySelector('span:not(.cd-inline-logo)')?.textContent.trim()||'',
    score:team.querySelector('b')?.textContent.trim()||'',
    winner:team.classList.contains('is-winner')
  }));
  teams.forEach(team=>team.remove());
  const row=document.createElement('div');
  row.className='cd-horizontal-match';
  row.innerHTML=`<a href="${info[0].href}" class="cd-horizontal-side ${info[0].winner?'is-winner':''}">${info[0].logo}<strong>${info[0].name}</strong></a><b class="cd-horizontal-score"><span class="${info[0].winner?'is-winner':''}">${info[0].score}</span><i>-</i><span class="${info[1].winner?'is-winner':''}">${info[1].score}</span></b><a href="${info[1].href}" class="cd-horizontal-side is-right ${info[1].winner?'is-winner':''}"><strong>${info[1].name}</strong>${info[1].logo}</a>`;
  meta.insertAdjacentElement('afterend',row);
  card.dataset.horizontalReady='1';
}
function enhanceChampion(){
  const champion=document.querySelector('#cdKnockoutBracket .cd-champion');
  if(!champion||champion.dataset.capsuleReady==='1')return;
  const logo=champion.querySelector('.cd-inline-logo')?.outerHTML||'';
  const rawName=champion.querySelector('strong')?.textContent.trim().replace(/^우승\s*/,'')||'인하대';
  champion.innerHTML=`<span class="cd-champion-trophy">🏆</span>${logo}<strong>우승 ${rawName}</strong>`;
  champion.dataset.capsuleReady='1';
}
function ensureStyle(){
  const styleId='cdBracketHorizontalStyle';
  if(document.getElementById(styleId))return;
  const style=document.createElement('style');
  style.id=styleId;
  style.textContent=`
    .cd-pyramid{min-width:1040px!important;max-width:1160px!important;padding:6px 24px 28px!important}
    .cd-pyramid-row.is-final{grid-template-columns:minmax(340px,500px)!important;margin-top:56px!important}
    .cd-pyramid-row.is-semis{grid-template-columns:repeat(2,minmax(310px,1fr))!important;gap:150px!important;margin-top:86px!important;padding:0!important}
    .cd-pyramid-row.is-entries{grid-template-columns:150px 300px 150px 300px!important;justify-content:center!important;gap:22px!important;margin-top:98px!important}
    .cd-pyramid-row.is-entries .cd-direct-card{width:150px!important}
    .cd-pyramid-row.is-entries .cd-bracket-game{width:300px!important}
    .cd-champion{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:0!important;padding:10px 22px!important;border:2px solid #c9a24a!important;border-radius:999px!important;background:#17365d!important;color:#fff!important;box-shadow:0 12px 28px rgba(23,54,93,.18)!important}
    .cd-champion:before{display:none!important;content:none!important}
    .cd-champion .cd-champion-trophy{font-size:22px!important;line-height:1!important}
    .cd-champion .cd-inline-logo{width:38px!important;height:38px!important;background:#fff!important;border-radius:10px!important}
    .cd-champion strong{display:block!important;color:#fff!important;font-size:20px!important;white-space:nowrap!important}
    .cd-bracket-game{border-radius:16px!important}
    .cd-bracket-title{padding:8px 12px!important;background:#17365d!important;font-size:13px!important}
    .cd-bracket-meta{display:grid!important;grid-template-columns:1fr!important;gap:2px!important;justify-items:center!important;padding:8px 12px!important;text-align:center!important;line-height:1.35!important}
    .cd-bracket-meta span+span:before{display:none!important}
    .cd-horizontal-match{display:grid;grid-template-columns:minmax(100px,1fr) auto minmax(100px,1fr);align-items:center;gap:8px;padding:13px 12px;border-top:1px solid #eef2f7;background:#fff}
    .cd-horizontal-side{display:flex;align-items:center;gap:7px;min-width:0;color:#64748b;text-decoration:none;font-size:14px}
    .cd-horizontal-side.is-right{justify-content:flex-end;text-align:right}
    .cd-horizontal-side strong{display:block;overflow:visible;text-overflow:clip;white-space:nowrap}
    .cd-pyramid-row.is-entries .cd-horizontal-side strong{font-size:12px}
    .cd-horizontal-side.is-winner strong{color:#c62828;font-weight:900}
    .cd-horizontal-side .cd-inline-logo{flex:0 0 30px;width:30px!important;height:30px!important}
    .cd-horizontal-score{display:flex;align-items:center;gap:5px;color:#334155;font-size:18px;white-space:nowrap}
    .cd-horizontal-score i{font-style:normal;color:#94a3b8}
    .cd-horizontal-score span.is-winner{color:#c62828}
    @media(max-width:760px){.cd-pyramid{min-width:1040px!important}.cd-pyramid-row.is-semis{gap:72px!important}.cd-pyramid-row.is-entries{grid-template-columns:145px 290px 145px 290px!important;gap:14px!important}.cd-pyramid-row.is-entries .cd-direct-card{width:145px!important}.cd-pyramid-row.is-entries .cd-bracket-game{width:290px!important}}
  `;
  document.head.appendChild(style);
}
function apply(){
  const cards=[...document.querySelectorAll('#cdKnockoutBracket .cd-bracket-game')];
  if(!cards.length)return false;
  cards.forEach(enhanceCard);
  enhanceChampion();
  ensureStyle();
  requestAnimationFrame(()=>{
    if(typeof window.drawBracketLines==='function')window.drawBracketLines();
    else window.dispatchEvent(new Event('resize'));
  });
  return true;
}
let tries=0;
const timer=setInterval(()=>{
  tries+=1;
  if(apply()||tries>=30)clearInterval(timer);
},100);
window.addEventListener('load',apply,{once:true});
})();