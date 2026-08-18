(()=>{
'use strict';
const config={
  'gosung-2026':'2026-06-25(목) ~ 2026-07-03(금) · 경상남도 고성군 · 고성군 국민체육센터 / 고성군 실내체육관',
  'danyang-2026':'2026-08-12(수) ~ 2026-08-20(목) · 충청북도 단양군 · 단양국민체육센터 / 단양문화체육센터'
};
const value=config[document.body?.dataset.competition];
if(!value)return;
const apply=()=>{
  const meta=document.getElementById('cdMeta');
  if(meta&&meta.textContent!==value)meta.textContent=value;
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
const meta=document.getElementById('cdMeta');
if(meta)new MutationObserver(apply).observe(meta,{childList:true,subtree:true,characterData:true});

const applyGosungSources=()=>{
  if(document.body?.dataset.competition!=='gosung-2026')return;
  const section=document.getElementById('sources');
  const old=section?.querySelector('.cd-regulations-summary');
  if(!old)return;
  old.outerHTML=`<div class="cd-regulations-document" aria-label="고성대회 경기방법 및 순위결정방법">
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
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyGosungSources,{once:true});else applyGosungSources();
})();
