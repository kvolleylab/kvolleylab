(()=>{
'use strict';
if(document.body?.dataset.competition!=='danyang-2026')return;

const RULES_URL='https://drive.google.com/file/d/1qkV-B6YAJsG4Rn8GOEmODF3Ro2XlIhDj/view?usp=drivesdk';
const PAMPHLET_URL='https://drive.google.com/file/d/1RjqpTv2tCnwC7IaW91xTWD3p91FCHQO4/view?usp=drivesdk';

const ensureStyle=()=>{
  if(document.getElementById('kvl-danyang-source-links-style'))return;
  const style=document.createElement('style');
  style.id='kvl-danyang-source-links-style';
  style.textContent=`
    #sources .cd-sources{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}
    #sources .cd-sources>a{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:58px;padding:14px 16px;border:1px solid #e3e8ee;border-radius:13px;background:#fff;color:#334a64;font-weight:800;text-decoration:none}
    #sources .cd-sources>a:hover{border-color:#d6b25e;background:#fffaf0;color:#17365d}
    @media(max-width:620px){#sources .cd-sources{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
};

const regulations=`<div class="cd-regulations-document" aria-label="단양대회 경기방법 및 순위결정방법">
  <section class="cd-regulations-block">
    <h3>※ 순위결정방법</h3>
    <p>승리경기 수로 순위를 결정한다. 승리경기 수가 같을 때는 득실점수비율(예선 총 득점÷총 실점) 순으로, 득실점수비율이 같으면 세트비율(예선 총 승리세트÷총 패배세트) 순으로, 세트비율이 같으면 동률인 팀 간의 승자승으로 순위를 정한다.</p>
  </section>
  <section class="cd-regulations-block">
    <h3>※ 남대부 6강 토너먼트 대진 추첨 방식</h3>
    <p>6강 대진은 각 조 예선 1위 팀(총 3팀)을 대상으로 추첨을 통해 배정하며, 추첨 결과에 따라 (가), (나), (다)로 구분한다. 각 배정에 따른 경기 방식은 다음과 같다.</p>
    <ul>
      <li>(가), (나)에 해당하는 팀은 준결승에 자동 진출한다.</li>
      <li>(다)에 해당하는 팀은 6강전에 진출한 팀 중 한 팀을 선택하여 6강 대진을 구성한다.</li>
      <li>선택되지 않은 나머지 두 팀은 자동으로 잔여 6강 대진에 편성된다.</li>
    </ul>
  </section>
</div>`;

const links=`<a href="${RULES_URL}" target="_blank" rel="noopener noreferrer">2026 단양대회 요강 PDF 열기 <span>→</span></a><a href="${PAMPHLET_URL}" target="_blank" rel="noopener noreferrer">2026 단양대회 팸플릿 PDF 열기 <span>→</span></a>`;

const apply=()=>{
  const section=document.getElementById('sources');
  const root=document.getElementById('cdSources');
  if(!section||!root)return false;
  ensureStyle();
  document.querySelectorAll('[data-women-roster-link]').forEach(el=>el.remove());
  section.querySelectorAll('.cd-source-guide').forEach(el=>el.remove());
  section.querySelectorAll(':scope > .cd-rule-card').forEach(el=>el.remove());
  let doc=section.querySelector('.cd-regulations-document');
  if(!doc){
    const title=section.querySelector('.cd-section-title');
    if(title)title.insertAdjacentHTML('afterend',regulations);
  }
  if(root.innerHTML!==links)root.innerHTML=links;
  return true;
};

const start=()=>{
  apply();
  const section=document.getElementById('sources');
  if(!section)return;
  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  }).observe(section,{childList:true,subtree:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
