(()=>{
const area=document.getElementById('matchArea');
if(!area)return;
const id=new URLSearchParams(location.search).get('id');
if(!id)return;
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const flags={Japan:'jp',Brazil:'br',Poland:'pl',Iran:'ir',USA:'us',France:'fr',Argentina:'ar',Italy:'it',Canada:'ca',Belgium:'be',Cuba:'cu',Slovenia:'si',Germany:'de',Serbia:'rs','Türkiye':'tr',Bulgaria:'bg',China:'cn',Ukraine:'ua'};
const miniFlag=team=>flags[team?.name_en]?`<img class="md-mini-flag" src="https://flagcdn.com/w40/${flags[team.name_en]}.png" alt="">`:'';
const samePair=(x,a,b)=>[x.home.name_en,x.away.name_en].includes(a)&&[x.home.name_en,x.away.name_en].includes(b);
const teamWon=(x,name)=>{if(!x.score)return false;const home=x.home.name_en===name;return home?Number(x.score.home_sets)>Number(x.score.away_sets):Number(x.score.away_sets)>Number(x.score.home_sets)};
function row(x){return `<a class="md-h2h-row" href="match.html?id=${encodeURIComponent(x.match_id)}"><time>${esc(x.date_kst)}</time><div>${miniFlag(x.home)}<span>${esc(x.home.name_ko)}</span><strong>${x.score?`${x.score.home_sets}-${x.score.away_sets}`:'vs'}</strong><span>${esc(x.away.name_ko)}</span>${miniFlag(x.away)}</div><small>Week ${esc(x.week||'-')}</small></a>`}
function addSection(list){
 const current=list.find(x=>x.match_id===id);if(!current)return;
 const cutoff=new Date(current.datetime_kst).getTime();
 const past=list.filter(x=>x.match_id!==id&&x.status==='completed'&&x.score&&new Date(x.datetime_kst).getTime()<cutoff&&samePair(x,current.home.name_en,current.away.name_en)).sort((a,b)=>new Date(b.datetime_kst)-new Date(a.datetime_kst));
 let homeWins=0,awayWins=0;past.forEach(x=>teamWon(x,current.home.name_en)?homeWins++:awayWins++);
 const section=document.createElement('section');section.id='h2h';section.className='md-card md-section md-anchor-section';
 section.innerHTML=`<h3>양 팀 맞대결</h3><p class="md-section-note">현재 경기 이전의 2026 VNL 맞대결 기록입니다.</p><div class="md-h2h-summary"><div>${miniFlag(current.home)}<span>${esc(current.home.name_ko)}</span><strong>${homeWins}승</strong></div><b>${past.length?`${homeWins} - ${awayWins}`:'첫 맞대결'}</b><div>${miniFlag(current.away)}<span>${esc(current.away.name_ko)}</span><strong>${awayWins}승</strong></div></div>${past.length?`<div class="md-h2h-list">${past.slice(0,5).map(row).join('')}</div>`:'<div class="md-empty md-small-empty">이 경기 이전의 VNL 맞대결이 없습니다.</div>'}`;
 const form=area.querySelector('#form');if(form)form.insertAdjacentElement('afterend',section);else area.appendChild(section);
 const nav=area.querySelector('.md-section-nav');if(nav&&!nav.querySelector('a[href="#h2h"]')){const a=document.createElement('a');a.href='#h2h';a.textContent='맞대결';const formLink=nav.querySelector('a[href="#form"]');formLink?.insertAdjacentElement('afterend',a);a.addEventListener('click',e=>{e.preventDefault();section.scrollIntoView({behavior:'smooth',block:'start'})})}
}
fetch('data/matches/vnl-2026-men.json?v=20260715-18',{cache:'no-store'}).then(r=>r.json()).then(d=>{
 const run=()=>{if(area.querySelector('#summary'))addSection(d.matches||[]);else setTimeout(run,60)};run();
}).catch(()=>{});
})();