(()=>{
'use strict';
if(document.body?.dataset.competition!=='ibk-2026')return;
const D=['18세이하 남자부','18세이하 여자부','15세이하 남자부','15세이하 여자부'];
const state=window.KVL_SCHOOL_DIVISION_STATE;
let current=state?.get?.()||new URLSearchParams(location.search).get('division')||'';
try{if(!current)current=sessionStorage.getItem('kvl:ibk-2026:division')||'';}catch(_){ }
if(!D.includes(current))current=D[0];
let syncing=false,queued=false;
const valueOf=btn=>btn?.dataset.kvlDivision||btn?.dataset.calendarDivision||btn?.textContent?.trim()||'';
const divisionButtons=()=>[...document.querySelectorAll('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button')];
function tagButtons(){
  divisionButtons().forEach(btn=>{
    const value=valueOf(btn);
    if(D.includes(value))btn.dataset.kvlDivision=value;
  });
}
function renderStandingTabs(){
  const root=document.getElementById('scStandingTabs');
  if(!root)return;
  if(!root.children.length){
    root.innerHTML=D.map(value=>`<button type="button" data-kvl-division="${value}">${value}</button>`).join('');
  }
  [...root.children].forEach(btn=>btn.classList.toggle('is-active',valueOf(btn)===current));
}
function filterBrackets(){
  const root=document.getElementById('scBrackets');
  if(!root)return;
  root.querySelectorAll('.sc-bracket').forEach(card=>{
    const title=card.querySelector(':scope>h3')?.textContent.trim()||'';
    card.hidden=title!==current;
  });
}
function renderSources(){
  const section=document.getElementById('sources');
  if(!section||section.dataset.kvlSourcesReady==='1')return;
  section.dataset.kvlSourcesReady='1';
  section.querySelectorAll(':scope > .sc-regulations,:scope > .sc-sources,:scope > .sc-data-note').forEach(el=>el.remove());
  const title=section.querySelector(':scope > .sc-title');
  if(!title)return;
  title.insertAdjacentHTML('afterend',`
    <div class="sc-regulations-summary">
      <div class="sc-regulations-summary-head">
        <div><p class="eyebrow">REGULATIONS SUMMARY</p><h3>대회요강 핵심 요약</h3></div>
        <p>원문을 빠르게 확인할 수 있도록 주요 항목만 정리했습니다.</p>
      </div>
      <div class="sc-regulations-grid">
        <article class="sc-regulation-item"><span>대회 기간</span><strong>2026-07-31(금) ~ 08-06(목)</strong><p>총 7일간 충청북도 제천시에서 진행</p></article>
        <article class="sc-regulation-item"><span>개최지 · 경기장</span><strong>충청북도 제천시</strong><p>대원대학교 민송체육관 · 제천어울림체육관 · 제천실내체육관 · 제천중학교</p></article>
        <article class="sc-regulation-item"><span>참가 부문</span><strong>4개 부문</strong><p>18세이하 남·여 / 15세이하 남·여</p></article>
        <article class="sc-regulation-item"><span>공식자료 반영</span><strong>예선 경기스코어 · 본선 대진표</strong><p>홈페이지 경기결과와 결선 대진은 공식자료 기준</p></article>
        <article class="sc-regulation-item"><span>18세이하 본선</span><strong>남·여 8강 토너먼트</strong><p>공식 8강 대진표를 기준으로 반영</p></article>
        <article class="sc-regulation-item"><span>15세이하 본선</span><strong>남·여 6강 토너먼트</strong><p>공식 6강 대진표를 기준으로 반영</p></article>
      </div>
      <div class="sc-regulations-actions">
        <small>※ 화면 요약은 빠른 확인용입니다. 참가자격·경기운영·시상 등 세부 조항은 공식 원문이 우선합니다.</small>
        <a href="https://drive.google.com/uc?export=download&id=1NGytIv0UqbCMCAPrFWIf0ZFW3qaXTEki">IBK기업은행배 참가요강 원문 ↓</a>
      </div>
    </div>
    <div class="sc-source-grid">
      <a href="https://drive.google.com/uc?export=download&id=1NGytIv0UqbCMCAPrFWIf0ZFW3qaXTEki"><span>IBK기업은행배 참가요강 HWP</span><b>→</b></a>
      <a href="https://drive.google.com/file/d/1hbdact8MYEPAIZ2qHKtpEjOJIOQp3uI0/view" target="_blank" rel="noopener noreferrer"><span>대회 개최공문 PDF</span><b>→</b></a>
      <a href="https://drive.google.com/uc?export=download&id=16O-WpuLf9VmNfF-TStyKQEjfFi6bz8wM"><span>예선 경기스코어 XLSX</span><b>→</b></a>
      <a href="https://drive.google.com/uc?export=download&id=1VP1tzQ7Ff5ucQMpUrekIDxkVZuMCg5nQ"><span>18세이하 남자부 8강 대진표 HWP</span><b>→</b></a>
      <a href="https://drive.google.com/uc?export=download&id=1O7CCGW_0DpXnSg_XNMkQAKo5pVbIRvhb"><span>18세이하 여자부 8강 대진표 HWP</span><b>→</b></a>
      <a href="https://drive.google.com/uc?export=download&id=1sltU60j0KQg1GHercZxnYVcjsG8ZTuhR"><span>15세이하 남자부 6강 대진표 HWP</span><b>→</b></a>
      <a href="https://drive.google.com/uc?export=download&id=1yfGlbvv53Q-zRVN4GHL0zU3FsXXKkq6j"><span>15세이하 여자부 6강 대진표 HWP</span><b>→</b></a>
    </div>`);
}
function clickMatching(selector){
  const btn=[...document.querySelectorAll(selector)].find(x=>valueOf(x)===current);
  if(btn&&!btn.classList.contains('is-active'))btn.click();
}
function finishReady(){
  tagButtons();
  renderStandingTabs();
  filterBrackets();
  document.body.dataset.kvlDivisionReady='1';
}
function sync(value){
  if(!D.includes(value))return;
  current=value;
  state?.set?.(current);
  syncing=true;
  try{
    tagButtons();
    clickMatching('#scCalendar [data-calendar-division]');
    clickMatching('#scDivisionTabs button');
    clickMatching('#scTeamTabs button');
  }finally{syncing=false;}
  requestAnimationFrame(finishReady);
}
function queueSync(value){
  current=D.includes(value)?value:current;
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;sync(current);});
}
document.addEventListener('click',event=>{
  if(syncing)return;
  const btn=event.target.closest('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button');
  if(!btn)return;
  const value=valueOf(btn);
  if(D.includes(value))queueSync(value);
});
const root=document.querySelector('.sc-main');
if(root)new MutationObserver(()=>{tagButtons();filterBrackets();}).observe(root,{childList:true,subtree:true});
renderSources();
tagButtons();
renderStandingTabs();
sync(current);
})();
