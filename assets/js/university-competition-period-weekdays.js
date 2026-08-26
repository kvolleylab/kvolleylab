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

const applyGosungResultsPolish=()=>{
  if(document.body?.dataset.competition!=='gosung-2026')return;
  const root=document.getElementById('cdResults');
  if(!root)return;

  if(!document.getElementById('kvl-gosung-results-polish-style')){
    const style=document.createElement('style');
    style.id='kvl-gosung-results-polish-style';
    style.textContent=`
      #results .cd-match-meta{gap:3px}
      #results .cd-match-meta-top{display:block;min-width:0}
      #results .cd-match-meta-top time{color:#34485f;font-size:13px;font-weight:900;white-space:nowrap}
      #results .cd-match-meta-detail{display:flex;align-items:center;gap:5px;min-width:0;color:#7d8998;font-size:12px;font-weight:800;line-height:1.35;white-space:nowrap}
      #results .cd-match-meta-detail .cd-match-stage{color:#7d8998;font-size:12px;font-weight:800}
      #results .cd-match-meta-detail .cd-match-venue{min-width:0;overflow:hidden;text-overflow:ellipsis;color:#7d8998;font-size:12px;font-weight:800}
      #results .cd-match-meta-detail .cd-match-venue::before{content:'·';margin-right:5px;color:#a0a9b5}
      #results .cd-match-board .cd-side{display:grid!important;align-items:center!important;width:auto!important;gap:6px!important}
      #results .cd-match-board .cd-side.is-left{grid-template-columns:46px 104px!important;justify-content:end!important;text-align:left!important}
      #results .cd-match-board .cd-side.is-right{grid-template-columns:104px 46px!important;justify-content:start!important;text-align:right!important}
      #results .cd-match-board .cd-side strong{display:block;min-width:0;white-space:nowrap}
      #results .cd-match-board .cd-side.is-left .cd-inline-logo{grid-column:1}
      #results .cd-match-board .cd-side.is-left strong{grid-column:2;text-align:left!important}
      #results .cd-match-board .cd-side.is-right strong{grid-column:1;text-align:right!important}
      #results .cd-match-board .cd-side.is-right .cd-inline-logo{grid-column:2}
      @media(min-width:1101px){#results .cd-match{grid-template-columns:210px 500px minmax(0,1fr)!important}}
      @media(min-width:621px) and (max-width:1100px){#results .cd-match{grid-template-columns:200px minmax(420px,1fr)!important}#results .cd-set-scores{grid-column:1/-1!important}}
      @media(max-width:620px){
        #results .cd-match-meta{align-items:center;text-align:center}
        #results .cd-match-meta-detail{justify-content:center;flex-wrap:wrap;white-space:normal}
        #results .cd-match-board .cd-side.is-left{grid-template-columns:42px 82px!important}
        #results .cd-match-board .cd-side.is-right{grid-template-columns:82px 42px!important}
      }
    `;
    document.head.appendChild(style);
  }

  const venueMap=new Map();
  const key=(date,time,a,b)=>[date,time,a,b].map(v=>String(v||'').trim()).join('|');
  const shortVenue=value=>String(value||'').replace(/^고성군\s+/,'').trim();

  const polish=()=>{
    root.querySelectorAll('.cd-match').forEach(match=>{
      if(match.dataset.kvlResultsPolished==='1')return;
      match.dataset.kvlResultsPolished='1';

      const group=match.closest('.cd-date-group');
      const date=group?.querySelector('.cd-date-head span')?.textContent?.trim()||'';
      const metaBox=match.querySelector('.cd-match-meta');
      const time=metaBox?.querySelector('time');
      const stage=metaBox?.querySelector(':scope > span');
      const left=match.querySelector('.cd-side.is-left');
      const right=match.querySelector('.cd-side.is-right');
      const teamA=left?.querySelector('strong')?.textContent?.trim()||'';
      const teamB=right?.querySelector('strong')?.textContent?.trim()||'';

      if(metaBox&&time&&!metaBox.querySelector('.cd-match-meta-top')){
        const originalTime=time.textContent?.trim()||'';
        const top=document.createElement('div');
        top.className='cd-match-meta-top';
        metaBox.insertBefore(top,time);
        top.appendChild(time);

        const detail=document.createElement('div');
        detail.className='cd-match-meta-detail';
        metaBox.appendChild(detail);
        if(stage){
          stage.classList.add('cd-match-stage');
          detail.appendChild(stage);
        }
        const fullVenue=venueMap.get(key(date,originalTime,teamA,teamB));
        if(fullVenue){
          const place=document.createElement('span');
          place.className='cd-match-venue';
          place.textContent=shortVenue(fullVenue);
          place.title=fullVenue;
          detail.appendChild(place);
        }
      }

      if(left){
        const logo=left.querySelector('.cd-inline-logo');
        const name=left.querySelector('strong');
        if(logo&&name)left.insertBefore(logo,name);
      }
      if(right){
        const logo=right.querySelector('.cd-inline-logo');
        const name=right.querySelector('strong');
        if(logo&&name)right.insertBefore(name,logo);
      }
    });
  };

  fetch('data/competitions/gosung-2026.json',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('gosung data')))
    .then(data=>{
      (data.games||[]).forEach(g=>venueMap.set(key(g.date,g.time,g.teamA,g.teamB),g.venue||''));
      polish();
      new MutationObserver(polish).observe(root,{childList:true,subtree:true});
    })
    .catch(()=>{
      polish();
      new MutationObserver(polish).observe(root,{childList:true,subtree:true});
    });
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyGosungResultsPolish,{once:true});else applyGosungResultsPolish();
})();
