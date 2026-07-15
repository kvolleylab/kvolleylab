(()=>{
const root=document.getElementById('matchArea');
if(!root)return;
function install(){
  if(document.getElementById('media'))return true;
  const continueSection=document.getElementById('continue');
  if(!continueSection)return false;
  const section=document.createElement('section');
  section.id='media';
  section.className='md-card md-section md-anchor-section md-media-reserved';
  section.innerHTML=`
    <div class="md-section-title-row">
      <div>
        <h3>영상·분석 리포트</h3>
        <p class="md-section-note">공식 경기 영상, 하이라이트, 전력분석 리포트를 연결할 영역입니다.</p>
      </div>
      <span class="md-coming-badge">준비 중</span>
    </div>
    <div class="md-media-grid">
      <article class="md-media-card">
        <div class="md-media-icon" aria-hidden="true">▶</div>
        <div><strong>경기 영상</strong><span>공식 중계 또는 다시보기 링크 연결 예정</span></div>
      </article>
      <article class="md-media-card">
        <div class="md-media-icon" aria-hidden="true">▣</div>
        <div><strong>하이라이트</strong><span>주요 장면과 짧은 경기 영상 연결 예정</span></div>
      </article>
      <article class="md-media-card">
        <div class="md-media-icon" aria-hidden="true">📋</div>
        <div><strong>분석 리포트</strong><span>경기 요약, 전술 포인트, 관찰 메모 연결 예정</span></div>
      </article>
    </div>`;
  continueSection.parentNode.insertBefore(section,continueSection);
  const nav=document.querySelector('.md-section-nav');
  if(nav&&!nav.querySelector('a[href="#media"]')){
    const link=document.createElement('a');
    link.href='#media';
    link.textContent='영상·리포트';
    const continueLink=nav.querySelector('a[href="#continue"]');
    nav.insertBefore(link,continueLink||null);
    link.addEventListener('click',e=>{e.preventDefault();section.scrollIntoView({behavior:'smooth',block:'start'})});
  }
  return true;
}
if(!install()){
  const observer=new MutationObserver(()=>{if(install())observer.disconnect()});
  observer.observe(root,{childList:true,subtree:true});
}
})();