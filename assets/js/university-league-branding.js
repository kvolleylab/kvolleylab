(()=>{
const BRAND_URL='data/master/university_brand_sources_2026.json';
const PARTICIPANT_URL='data/competition/university-league-2026-men-participants.json';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=name=>String(name||'').replace('국립','').replace('대학교','').slice(0,2);
const actions=document.querySelector('.ul-actions');
if(actions&&!actions.querySelector('[data-women-roster-link]'))actions.insertAdjacentHTML('beforeend','<a data-women-roster-link href="university-women-rosters.html?competition=u-league">여자부 선수명단</a>');
Promise.all([
 fetch(BRAND_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}),
 fetch(PARTICIPANT_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{participants:[]})
]).then(([brandData,participantData])=>{
 const brands=brandData.teams||{};
 const participants=participantData.participants||[];
 const participantByName=new Map(participants.map(p=>[p.school_name,p]));
 function decorate(){
   document.querySelectorAll('#ulTeams .ul-team').forEach(card=>{
     if(card.querySelector('.ul-team-logo'))return;
     const name=card.querySelector('h3')?.textContent?.trim()||'';
     const participant=participantByName.get(name);
     const code=participant?.school_code||'';
     const brand=brands[code]||Object.values(brands).find(x=>x.school_name===name);
     const top=card.querySelector('.ul-team-top');
     if(!top)return;
     const mark=document.createElement('span');
     mark.className='ul-team-logo';
     if(brand?.status==='asset_ready'&&brand.asset_path){
       mark.innerHTML=`<img src="${esc(brand.asset_path)}" alt="${esc(name)} 로고" loading="lazy">`;
       const img=mark.querySelector('img');
       img.addEventListener('error',()=>{mark.innerHTML=`<b>${esc(initials(name))}</b>`},{once:true});
     }else mark.innerHTML=`<b>${esc(initials(name))}</b>`;
     top.prepend(mark);
   });
 }
 const box=document.getElementById('ulTeams');
 if(box){new MutationObserver(decorate).observe(box,{childList:true,subtree:true});decorate();}
}).catch(console.error);
})();