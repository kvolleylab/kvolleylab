import {rankingConfig,rankingGender} from './world-ranking-model-v1.mjs';
import {loadRanking,rankingHTML,esc} from './world-ranking-ui-v1.js';
export function mountRankingSelector(root,cycle) {
 const config=rankingConfig(cycle),old=root.querySelector('[data-quota="ranking"]');if(!config||!old)return;
 const trigger=document.createElement('button');trigger.type='button';trigger.className=old.className+' oq-ranking-trigger';trigger.dataset.quota='ranking';
 trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','oq-ranking-panel');trigger.setAttribute('aria-label',`${config.year} FIVB 세계랭킹 · 출전권 배정 기준과 현황 보기`);
 trigger.innerHTML=old.innerHTML.replace(/<h3>/g,'<span class="oq-quota-title">').replace(/<\/h3>/g,'</span>');old.replaceWith(trigger);
 const panel=document.createElement('section');panel.id='oq-ranking-panel';panel.className='wr-panel';panel.hidden=true;panel.setAttribute('aria-labelledby','oq-ranking-title');
 (root.querySelector('#oq-world-cup-panel')||root.querySelector('#oq-continental-panel')||root.querySelector('#host-country-info')||root.querySelector('.oq-quota-grid')).after(panel);
 const requested=new URLSearchParams(location.search).get('ranking');let gender=rankingGender(requested),bundle=null,loading=false;
 function remember(open){const url=new URL(location.href);if(open)url.searchParams.set('ranking',gender);else url.searchParams.delete('ranking');history.replaceState(history.state,'',url);}
 function render(){panel.dataset.gender=gender;panel.innerHTML=rankingHTML(bundle,gender);panel.querySelectorAll('[data-ranking-gender]').forEach(b=>b.addEventListener('click',()=>{gender=b.dataset.rankingGender;render();remember(true);panel.querySelector(`[data-ranking-gender="${gender}"]`).focus({preventScroll:true});}));}
 async function load(){if(loading)return;loading=true;panel.innerHTML='<h3 id="oq-ranking-title">세계랭킹 출전권</h3><p role="status">공식 안내를 불러오고 있습니다.</p>';try{bundle=await loadRanking(cycle);render();}catch{panel.innerHTML=`<h3 id="oq-ranking-title">세계랭킹 출전권</h3><p role="status">안내를 불러오지 못했습니다.</p><button type="button" class="wr-retry">다시 불러오기</button> <a href="${esc(config.fallbackUrl)}">출전 경로 안내</a>`;panel.querySelector('button').addEventListener('click',load);}finally{loading=false;}}
 function toggle(open,update=true){panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));trigger.querySelector('.oq-quota-action').innerHTML=`${open?'랭킹 안내 접기':'배정 기준·현황 보기'} <span aria-hidden="true">${open?'⌃':'⌄'}</span>`;if(update)remember(open);if(open&&!bundle&&!loading)load();}
 trigger.addEventListener('click',()=>toggle(panel.hidden));panel.addEventListener('keydown',e=>{if(e.key==='Escape'){toggle(false);trigger.focus();}});toggle(['men','women'].includes(requested),false);
}
