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
function tagButtons(){divisionButtons().forEach(btn=>{const value=valueOf(btn);if(D.includes(value))btn.dataset.kvlDivision=value;});}
function renderStandingTabs(){const root=document.getElementById('scStandingTabs');if(!root)return;if(!root.children.length)root.innerHTML=D.map(value=>`<button type="button" data-kvl-division="${value}">${value}</button>`).join('');[...root.children].forEach(btn=>btn.classList.toggle('is-active',valueOf(btn)===current));}
function filterBrackets(){const root=document.getElementById('scBrackets');if(!root)return;root.querySelectorAll('.sc-bracket').forEach(card=>{const title=card.querySelector(':scope>h3')?.textContent.trim()||'';card.hidden=title!==current;});}
function normalizePodiumIcons(){document.querySelectorAll('#scPodiums .sc-rank').forEach(row=>{const label=row.querySelector('b');if(!label)return;const text=label.textContent.replace(/[🏆🥈]/gu,'').trim();const icon=text==='우승'?'🏆':text==='준우승'?'🥈':'';if(!icon)return;let trophy=label.querySelector('.sc-rank-trophy');if(!trophy){trophy=document.createElement('span');trophy.className='sc-rank-trophy';trophy.setAttribute('aria-hidden','true');label.insertBefore(trophy,label.firstChild);}if(trophy.textContent!==icon)trophy.textContent=icon;});}
function simplifySources(){
  const section=document.getElementById('sources');if(!section)return;
  const note=section.querySelector(':scope > .sc-title > p');if(note)note.textContent='공식 원본 자료';
  section.querySelectorAll(':scope > .sc-regulations,:scope > .sc-regulations-summary,:scope > .sc-source-grid,:scope > .sc-data-note').forEach(el=>el.remove());
  let root=section.querySelector(':scope > .sc-sources');if(!root){root=document.createElement('div');root.className='sc-sources';section.appendChild(root);}
  const html=`<a href="https://drive.google.com/uc?export=download&id=1NGytIv0UqbCMCAPrFWIf0ZFW3qaXTEki" target="_blank" rel="noopener noreferrer"><span>IBK기업은행배 참가요강 원문 열기</span><span>→</span></a><a href="https://drive.google.com/file/d/1hbdact8MYEPAIZ2qHKtpEjOJIOQp3uI0/view" target="_blank" rel="noopener noreferrer"><span>IBK기업은행배 개최공문 PDF 열기</span><span>→</span></a><a href="https://drive.google.com/uc?export=download&id=16O-WpuLf9VmNfF-TStyKQEjfFi6bz8wM" target="_blank" rel="noopener noreferrer"><span>예선 경기스코어 XLSX 열기</span><span>→</span></a><a href="https://drive.google.com/uc?export=download&id=1VP1tzQ7Ff5ucQMpUrekIDxkVZuMCg5nQ" target="_blank" rel="noopener noreferrer"><span>18세이하 남자부 8강 대진표 열기</span><span>→</span></a><a href="https://drive.google.com/uc?export=download&id=1O7CCGW_0DpXnSg_XNMkQAKo5pVbIRvhb" target="_blank" rel="noopener noreferrer"><span>18세이하 여자부 8강 대진표 열기</span><span>→</span></a><a href="https://drive.google.com/uc?export=download&id=1sltU60j0KQg1GHercZxnYVcjsG8ZTuhR" target="_blank" rel="noopener noreferrer"><span>15세이하 남자부 6강 대진표 열기</span><span>→</span></a><a href="https://drive.google.com/uc?export=download&id=1yfGlbvv53Q-zRVN4GHL0zU3FsXXKkq6j" target="_blank" rel="noopener noreferrer"><span>15세이하 여자부 6강 대진표 열기</span><span>→</span></a>`;
  if(root.innerHTML!==html)root.innerHTML=html;
}
function clickMatching(selector){const btn=[...document.querySelectorAll(selector)].find(x=>valueOf(x)===current);if(btn&&!btn.classList.contains('is-active'))btn.click();}
function finishReady(){tagButtons();renderStandingTabs();filterBrackets();normalizePodiumIcons();document.body.dataset.kvlDivisionReady='1';}
function sync(value){if(!D.includes(value))return;current=value;state?.set?.(current);syncing=true;try{tagButtons();clickMatching('#scCalendar [data-calendar-division]');clickMatching('#scDivisionTabs button');clickMatching('#scTeamTabs button');}finally{syncing=false;}requestAnimationFrame(finishReady);}
function queueSync(value){current=D.includes(value)?value:current;if(queued)return;queued=true;queueMicrotask(()=>{queued=false;sync(current);});}
document.addEventListener('click',event=>{if(syncing)return;const btn=event.target.closest('#scCalendar [data-calendar-division],#scDivisionTabs button,#scTeamTabs button,#scStandingTabs button');if(!btn)return;const value=valueOf(btn);if(D.includes(value))queueSync(value);});
const root=document.querySelector('.sc-main');if(root)new MutationObserver(()=>{tagButtons();filterBrackets();normalizePodiumIcons();}).observe(root,{childList:true,subtree:true});
simplifySources();tagButtons();renderStandingTabs();normalizePodiumIcons();sync(current);
})();
