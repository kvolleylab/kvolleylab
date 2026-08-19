(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('competition')!=='danyang-2026')return;
  const apply=()=>{
    const main=document.getElementById('utdMain');
    if(!main)return false;
    const hero=main.querySelector('.utd-hero');
    if(!hero)return false;
    const breadcrumb=main.querySelector('.utd-breadcrumb');
    const firstLink=breadcrumb?.querySelector('a');
    if(firstLink){firstLink.href='university-competition-danyang.html';firstLink.textContent='2026 단양대회';}
    const subtitle=hero.querySelector('.utd-subtitle');
    if(subtitle)subtitle.textContent='2026 대한항공배 전국대학배구 단양대회 참가팀 · 팸플릿 선수명단 반영';
    const actions=hero.querySelectorAll('.utd-actions a');
    if(actions[1]){actions[1].href='university-competition-danyang.html?view=results';actions[1].textContent='단양대회 결과';actions[1].classList.remove('is-active');}
    const rosterHead=main.querySelector('.utd-roster-section .utd-section-head > div');
    if(rosterHead&&!rosterHead.querySelector('.danyang-roster-source')){
      const p=document.createElement('p');
      p.className='danyang-roster-source';
      p.textContent='2026 단양대회 팸플릿 기준 명단';
      p.style.cssText='margin:6px 0 0;color:#748397;font-size:12px;font-weight:800';
      rosterHead.appendChild(p);
    }
    return true;
  };
  if(apply())return;
  const root=document.getElementById('utdMain')||document.body;
  const observer=new MutationObserver(()=>{if(apply())observer.disconnect();});
  observer.observe(root,{childList:true,subtree:true});
})();
