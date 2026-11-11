/* Prototype-only presentation options on the unchanged Competition Engine V2.
   Data adapters never create HTML. No production module is patched. */
(()=>{'use strict';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=new URLSearchParams(location.search).get('competition');
const entries=[['avc-men-cup-2026','AVC 남자컵'],['asian-games-men-2026','아시안게임 남자'],['asian-games-women-2026','아시안게임 여자'],['avc-men-continental-2026','AVC 남자 대륙선수권']];
const protectedSource=slug==='avc-men-continental-2026'?fetch('/prototype-assets/continental-stakes.json').then(r=>{if(!r.ok)throw Error('Original stakes fragment unavailable');return r.json();}):null;
const q=s=>document.querySelector(s);
function rewriteLinks(root=document){
 root.querySelectorAll('a[href]').forEach(a=>{
  const raw=a.getAttribute('href');if(!raw||raw.startsWith('#'))return;
  const u=new URL(raw,location.href);if(u.origin!==location.origin)return;
  if(u.pathname==='/index.html'&&!u.searchParams.has('competition')||u.pathname==='/'&&!u.searchParams.has('competition')){a.href='https://kvolleylab.com/';return;}
  if(['/review.html','/','/index.html'].includes(u.pathname)&&u.searchParams.has('competition'))return;
  if(u.pathname==='/review.html'||u.pathname.startsWith('/reference/'))return;
  if(u.pathname==='/competition-engine.html'&&entries.some(x=>x[0]===u.searchParams.get('competition'))){u.pathname='/';a.href=u.href;return;}
  if(u.pathname.endsWith('.html')&&u.pathname!=='/index.html')a.href='https://kvolleylab.com'+u.pathname+u.search+u.hash;
 });
}
function renderFullRanking(d){
 if(d.structure.finalRankingPresentation!=='full-table')return;
 const root=q('[data-kvl-component="knockout"]');if(!root)return;
 let section=q('#prototype-full-ranking');if(!section){section=document.createElement('section');section.id='prototype-full-ranking';section.className='kvl-full-ranking';root.after(section);}
 section.innerHTML=`<div class="kvl1180-knockout-subhead"><div><p class="label">FINAL STANDINGS</p><h3>전체 최종순위</h3></div><p>대회 종료 · ${d.finalRanking.length}개국</p></div><ol>${d.finalRanking.map(r=>`<li class="${r.code==='KOR'?'is-korea':''}"><span>${r.rank}위</span><a href="/?competition=${encodeURIComponent(slug)}&view=rosters&team=${encodeURIComponent(r.code)}#team-roster">${esc(r.team)}</a><small>${esc(r.result)}</small></li>`).join('')}</ol>`;
}
function renderCompact(d){
 const section=q('[data-kvl-section="qualifications"]');if(!section)return;
 section.hidden=false;section.dataset.kvlEmpty='false';section.classList.add('kvl-meaning-compact');
 section.innerHTML=`<div class="kvl1180-section-head"><div><p class="label">${esc(d.meaning.eyebrow)}</p><h2>${esc(d.meaning.title)}</h2></div></div><div class="kvl-meaning-items">${d.meaning.items.map(x=>`<article><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p></article>`).join('')}</div>`;
}
async function renderPreserved(d){
 const original=q('[data-kvl-section="qualifications"]');if(!original)return;
 const source=await protectedSource;
 const host=document.createElement('section');host.className='kvl1180-view kvl-preserved-meaning';host.dataset.view='overview';host.dataset.kvlSection='qualifications';host.dataset.kvlEmpty='false';host.dataset.fragmentSha256=source.sourceSha256;host.setAttribute('aria-label','대회 의미 · 국제 진출권');
 const shadow=host.attachShadow({mode:'open'});
 // The root is isolated so new VNL rules cannot restyle the protected card.
 shadow.innerHTML=`<style>:host{all:initial;display:block} ${source.css}\n.legacy-html{font-size:16px}.legacy-body{background:transparent!important}.kvl1180-main{width:100%;padding-bottom:0;margin:0}.kvl1180-stakes-card{display:block!important}</style><div class="legacy-html"><div class="legacy-body kvl1180-prototype" data-avc-gender="men" data-kvl-gender="men" data-kvl-family="avc">${source.sprite}<main class="kvl1180-main">${source.html}</main></div></div>`;
 window.KVLLegacyKorea(shadow,source.rawMatches);
 shadow.addEventListener('click',event=>{const a=event.target.closest('a');if(a?.getAttribute('href')==='?view=schedule'){event.preventDefault();location.href='/?competition='+encodeURIComponent(slug)+'&view=schedule';}});
 original.replaceWith(host);window.KVLCompetitionTemplateV2.applyView();
 document.body.dataset.protectedStakes='ready';
}
function rosterCoach(d){
 const code=new URLSearchParams(location.search).get('team')||'KOR',coach=d.rosters?.[code]?.coach;
 const root=q('#team-roster');if(!root)return;
 let el=q('#prototype-roster-coach');
 if(!coach){el?.remove();return;}
 if(!el){el=document.createElement('p');el.id='prototype-roster-coach';el.className='kvl-coach';root.prepend(el);}
 const text='감독 · '+coach;if(el.textContent!==text)el.textContent=text;
}
const apply=window.KVLDomesticHomeV2.apply;
window.KVLDomesticHomeV2.apply=function(d){
 const value=apply(d);
 if(d.structure.meaningPresentation?.mode==='compact')renderCompact(d);
 if(d.structure.meaningPresentation?.mode==='preserved-fragment')renderPreserved(d).catch(error=>{console.error(error);document.body.dataset.protectedStakes='error';const s=q('[data-kvl-section="qualifications"]');s.hidden=false;s.textContent='원본 국제진출권 카드를 불러오지 못했습니다. 새로고침해 주세요.';});
 if(d.structure.heroAssetPresentation==='official-logo')document.body.classList.add('kvl-official-logo-hero');
 renderFullRanking(d);rosterCoach(d);
 window.KVLCompetitionTemplateV2.applyView();rewriteLinks();
 return value;
};
addEventListener('DOMContentLoaded',()=>{
 const bar=document.createElement('nav');bar.className='prototype-review-nav';bar.setAttribute('aria-label','프로토타입 검수');
 bar.innerHTML=`<span>PROTOTYPE v1</span>${entries.map(([id,label])=>`<a href="/?competition=${id}" ${slug===id?'aria-current="page"':''}>${label}</a>`).join('')}<a href="/review.html">운영 화면 비교 · 검수 내역 ↗</a>`;
 q('main[data-kvl-shell]')?.before(bar);
 let queued=false;
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;rewriteLinks();const d=window.KVL_COMPETITION_V2_DATA;if(d)rosterCoach(d);});}).observe(document.body,{childList:true,subtree:true});
 rewriteLinks();
});
})();
