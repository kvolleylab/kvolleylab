(()=>{
const area=document.getElementById('matchArea');
if(!area)return;
const id=new URLSearchParams(location.search).get('id');
if(!id)return;
const flags={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const flag=t=>flags[t.name_en]?`<img src="https://flagcdn.com/w40/${flags[t.name_en]}.png" alt="">`:'';
function buildTable(matches,current){
  const cutoff=new Date(current.datetime_kst).getTime();
  const teams=new Map();
  matches.forEach(m=>[m.home,m.away].forEach(t=>{if(!teams.has(t.name_en))teams.set(t.name_en,{team:t,gp:0,w:0,l:0,pts:0,sf:0,sa:0,pf:0,pa:0})}));
  matches.filter(m=>m.status==='completed'&&m.score&&new Date(m.datetime_kst).getTime()<cutoff).forEach(m=>{
    const h=teams.get(m.home.name_en),a=teams.get(m.away.name_en),hs=Number(m.score.home_sets),as=Number(m.score.away_sets);
    h.gp++;a.gp++;h.sf+=hs;h.sa+=as;a.sf+=as;a.sa+=hs;
    if(hs>as){h.w++;a.l++;h.pts+=as===2?2:3;a.pts+=as===2?1:0}else{a.w++;h.l++;a.pts+=hs===2?2:3;h.pts+=hs===2?1:0}
  });
  return [...teams.values()].sort((a,b)=>b.w-a.w||b.pts-a.pts||(b.sf/(b.sa||1))-(a.sf/(a.sa||1))||a.team.name_ko.localeCompare(b.team.name_ko,'ko')).map((x,i)=>({...x,rank:i+1}));
}
function card(row,label){return `<article class="md-rank-card"><div class="md-rank-head"><span>${label}</span><strong>${row.rank}위</strong></div><div class="md-rank-team">${flag(row.team)}<div><strong>${esc(row.team.name_ko)}</strong><span>${esc(row.team.name_en)}</span></div></div><div class="md-rank-stats"><div><span>경기</span><strong>${row.gp}</strong></div><div><span>승패</span><strong>${row.w}승 ${row.l}패</strong></div><div><span>승점</span><strong>${row.pts}</strong></div><div><span>세트</span><strong>${row.sf}-${row.sa}</strong></div></div></article>`}
function insert(matchData){
  const list=matchData.matches||[],current=list.find(m=>m.match_id===id);if(!current)return;
  const table=buildTable(list,current),home=table.find(x=>x.team.name_en===current.home.name_en),away=table.find(x=>x.team.name_en===current.away.name_en);if(!home||!away)return;
  if(area.querySelector('#standings'))return;
  const section=document.createElement('section');section.id='standings';section.className='md-card md-section md-anchor-section';
  section.innerHTML=`<div class="md-section-title-row"><div><h3>경기 전 순위 비교</h3><p class="md-section-note">이 경기 시작 직전까지의 2026 VNL 성적 기준입니다.</p></div><span class="md-rank-note">승수 → 승점 → 세트득실</span></div><div class="md-rank-grid">${card(home,'HOME')}${card(away,'AWAY')}</div>`;
  const form=area.querySelector('#form'),h2h=area.querySelector('#h2h');
  if(h2h)h2h.after(section);else if(form)form.after(section);else area.appendChild(section);
  const nav=area.querySelector('.md-section-nav');if(nav&&!nav.querySelector('a[href="#standings"]')){const a=document.createElement('a');a.href='#standings';a.textContent='순위 비교';const formLink=nav.querySelector('a[href="#form"]');formLink?formLink.after(a):nav.appendChild(a);a.addEventListener('click',e=>{e.preventDefault();section.scrollIntoView({behavior:'smooth',block:'start'})})}
}
fetch('data/matches/vnl-2026-men.json?v=20260715-19',{cache:'no-store'}).then(r=>r.json()).then(data=>{
  if(area.querySelector('.md-hero-card'))insert(data);else{const ob=new MutationObserver(()=>{if(area.querySelector('.md-hero-card')){insert(data);ob.disconnect()}});ob.observe(area,{childList:true,subtree:true})}
}).catch(()=>{});
})();