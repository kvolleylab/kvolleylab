(()=>{
const area=document.getElementById('matchArea');
if(!area)return;
const FAVORITES_KEY='kvl.favoriteMatches.v1';
const matchId=new URLSearchParams(location.search).get('id')||'';
function getFavorites(){try{return JSON.parse(localStorage.getItem(FAVORITES_KEY)||'[]')}catch{return[]}}
function setFavorites(items){localStorage.setItem(FAVORITES_KEY,JSON.stringify(items))}
function updateFavoriteButton(btn){const saved=getFavorites().includes(matchId);btn.classList.toggle('active',saved);btn.setAttribute('aria-pressed',String(saved));btn.textContent=saved?'★ 관심 경기':'☆ 관심 경기'}
function flash(btn,text){const original=btn.textContent;btn.textContent=text;setTimeout(()=>btn.textContent=original,1400)}
function addActions(){
  const hero=area.querySelector('#summary');
  if(!hero||hero.querySelector('.md-page-actions'))return false;
  const actions=document.createElement('div');
  actions.className='md-page-actions';
  actions.innerHTML=`<button type="button" id="mdFavoriteBtn" aria-pressed="false">☆ 관심 경기</button><a class="md-favorites-link" href="favorites.html">관심 경기 목록</a><button type="button" id="mdShareBtn">경기 공유</button><button type="button" id="mdCopyBtn">링크 복사</button><button type="button" id="mdPrintBtn">인쇄·PDF</button>`;
  hero.prepend(actions);
  const source=document.createElement('section');
  source.id='sources';
  source.className='md-card md-section md-source-card';
  source.innerHTML=`<h3>자료 출처·정정 요청</h3><div class="md-source-grid"><div><span>일정·경기 결과</span><strong>Volleyball World 공식 대회 자료 기준</strong></div><div><span>표시 시간</span><strong>한국시간 및 개최지 현지시간 변환</strong></div><div><span>정정 요청</span><a href="https://forms.gle/MFNYhJX6Bq5zeNmp8" target="_blank" rel="noopener">오류 또는 누락 자료 제보 →</a></div></div><p>공식 발표 변경이나 데이터 반영 시점에 따라 실제 정보와 차이가 날 수 있습니다.</p>`;
  const nav=area.querySelector('.md-match-nav');
  if(nav)area.insertBefore(source,nav);else area.appendChild(source);
  const favoriteBtn=document.getElementById('mdFavoriteBtn');
  if(favoriteBtn){
    updateFavoriteButton(favoriteBtn);
    favoriteBtn.addEventListener('click',()=>{
      const favorites=getFavorites(),exists=favorites.includes(matchId);
      setFavorites(exists?favorites.filter(id=>id!==matchId):[...favorites,matchId]);
      updateFavoriteButton(favoriteBtn);
    });
  }
  document.getElementById('mdCopyBtn')?.addEventListener('click',async e=>{
    try{await navigator.clipboard.writeText(location.href);flash(e.currentTarget,'복사 완료')}catch{prompt('아래 주소를 복사하세요.',location.href)}
  });
  document.getElementById('mdShareBtn')?.addEventListener('click',async()=>{
    const title=document.title;
    if(navigator.share){try{await navigator.share({title,text:title,url:location.href})}catch{}}
    else{document.getElementById('mdCopyBtn')?.click()}
  });
  document.getElementById('mdPrintBtn')?.addEventListener('click',()=>window.print());
  return true;
}
if(!addActions()){
  const observer=new MutationObserver(()=>{if(addActions())observer.disconnect()});
  observer.observe(area,{childList:true,subtree:true});
}
})();