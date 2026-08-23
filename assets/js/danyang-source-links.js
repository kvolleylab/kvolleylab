(()=>{'use strict';
const downloads={
  '국민체육센터 경기일정표':'https://drive.google.com/uc?export=download&id=15WvR6qtYw492c-I15ZchNoSuE2mOcSYx',
  '문화체육센터 경기일정표':'https://drive.google.com/uc?export=download&id=1ku1_D8VjiaisIV--VqekWp5hATZAGnJS'
};
const addWomenRosterLink=()=>{
  const nav=document.querySelector('.cd-jump');
  if(!nav||nav.querySelector('[data-women-roster-link]'))return false;
  const a=document.createElement('a');
  a.dataset.womenRosterLink='';
  a.href='university-women-rosters.html?competition=danyang';
  a.textContent='여대부 선수명단';
  nav.appendChild(a);
  return true;
};
const improve=()=>{
  addWomenRosterLink();
  const root=document.getElementById('cdSources');
  if(!root)return false;
  const links=[...root.querySelectorAll('a')];
  if(!links.length)return false;
  links.forEach((a,i)=>{
    const title=i===0?'2026 단양대회 요강':i===1?'국민체육센터 경기일정표':'문화체육센터 경기일정표';
    a.textContent=`${title}${downloads[title]?' HWP 다운로드':' PDF 열기'} →`;
    if(downloads[title]){a.href=downloads[title];a.removeAttribute('target');a.setAttribute('download','');}
    else{a.target='_blank';a.rel='noopener';}
  });
  if(!root.querySelector('.cd-source-guide'))root.insertAdjacentHTML('afterend','<p class="cd-source-guide" style="margin:12px 0 0;color:#64748b;font-size:12px;line-height:1.6">HWP 경기일정표는 Google Drive 미리보기가 지원되지 않아 파일 다운로드 방식으로 제공합니다. 파일은 한컴오피스 또는 HWP 뷰어에서 열 수 있습니다. 여자부 공식 팸플릿 Snapshot은 상단의 여대부 선수명단에서 확인할 수 있습니다.</p>');
  return true;
};
addWomenRosterLink();
if(!improve()){const o=new MutationObserver(()=>{addWomenRosterLink();if(improve())o.disconnect()});o.observe(document.body,{childList:true,subtree:true});}
if(!window.__danyangRosterEnhancementLoaded){window.__danyangRosterEnhancementLoaded=true;const s=document.createElement('script');s.src='assets/js/danyang-roster-enhancements.js?v=20260819-1';s.defer=true;document.head.appendChild(s);}
})();