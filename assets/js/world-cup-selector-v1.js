import {normalGender,worldCupConfig} from './world-cup-model-v1.mjs';
import {loadWorldCup,quickHTML,esc,safeURL} from './world-cup-ui-v1.js';
export function mountWorldCupSelector(root,cycle) {
  const config=worldCupConfig(cycle), old=root.querySelector('[data-quota="world-cup"]');
  if(!config || !old) return;
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className=old.className+' oq-world-cup-trigger';trigger.dataset.quota='world-cup';
  trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-controls','oq-world-cup-panel');
  trigger.setAttribute('aria-label',`${config.year} FIVB 월드컵 · 올림픽 출전권과 대회 현황 보기`);
  trigger.innerHTML=old.innerHTML.replace(/<h3>/g,'<span class="oq-quota-title">').replace(/<\/h3>/g,'</span>');old.replaceWith(trigger);
  const panel=document.createElement('section');panel.id='oq-world-cup-panel';panel.className='wc-panel';panel.hidden=true;
  panel.setAttribute('aria-labelledby','oq-world-cup-title');
  (root.querySelector('#oq-continental-panel') || root.querySelector('.oq-quota-grid')).after(panel);
  const requested=new URLSearchParams(location.search).get('worldcup');
  let gender=normalGender(requested), bundle=null, loading=false;
  function remember(open){const url=new URL(location.href);if(open)url.searchParams.set('worldcup',gender);else url.searchParams.delete('worldcup');history.replaceState(history.state,'',url);}
  function render(){panel.dataset.gender=gender;panel.innerHTML=quickHTML(bundle,gender);panel.querySelectorAll('[data-world-cup-gender]').forEach(button=>button.addEventListener('click',()=>{gender=button.dataset.worldCupGender;render();remember(true);panel.querySelector(`[data-world-cup-gender="${gender}"]`).focus({preventScroll:true});}));}
  async function load(){if(loading)return;loading=true;panel.innerHTML='<h3 id="oq-world-cup-title">FIVB 월드컵 출전권</h3><p role="status">대회 정보를 불러오고 있습니다.</p>';try{bundle=await loadWorldCup(cycle);render();}catch{panel.innerHTML=`<h3 id="oq-world-cup-title">FIVB 월드컵 출전권</h3><p role="status">대회 정보를 불러오지 못했습니다.</p><button class="wc-retry" type="button">다시 불러오기</button> <a href="${esc(safeURL(config.fallbackUrl))}">기존 월드컵 안내 →</a>`;panel.querySelector('button').addEventListener('click',load);}finally{loading=false;}}
  function toggle(open,update=true){panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));trigger.querySelector('.oq-quota-action').innerHTML=`${open?'월드컵 안내 접기':'출전권·대회 보기'} <span aria-hidden="true">${open?'⌃':'⌄'}</span>`;if(update)remember(open);if(open&&!bundle&&!loading)load();}
  trigger.addEventListener('click',()=>toggle(panel.hidden));
  panel.addEventListener('keydown',event=>{if(event.key==='Escape'){toggle(false);trigger.focus();}});
  toggle(['men','women'].includes(requested),false);
}
