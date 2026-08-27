(()=>{
'use strict';
if(document.body?.dataset.competition!=='danyang-2026')return;

const DATA_URL='data/competitions/danyang-2026.json?v=20260823-1';

const ensureStyle=()=>{
  if(document.getElementById('kvl-danyang-template-style'))return;
  const style=document.createElement('style');
  style.id='kvl-danyang-template-style';
  style.textContent=`
    #overview .cd-kpis article strong{display:inline-block!important;margin-right:2px!important}
    #overview .cd-kpis article small{display:inline-block!important}
    #overview .cd-cal-title{font-size:28px!important}
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
      #overview .cd-cal-title{font-size:24px!important}
    }
  `;
  document.head.appendChild(style);
};

const venueMap=new Map();
const key=(date,time,a,b)=>[date,time,a,b].map(v=>String(v||'').trim()).join('|');
const shortVenue=value=>String(value||'').replace(/^단양(?:군)?\s*/,'').trim();

const polishResults=()=>{
  const root=document.getElementById('cdResults');
  if(!root)return;
  root.querySelectorAll('.cd-match').forEach(match=>{
    if(match.dataset.kvlDanyangPolished==='1')return;
    match.dataset.kvlDanyangPolished='1';

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

const start=()=>{
  ensureStyle();
  fetch(DATA_URL,{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('danyang data')))
    .then(data=>{
      (data.games||[]).forEach(g=>venueMap.set(key(g.date,g.time,g.teamA,g.teamB),g.venue||''));
      polishResults();
      const root=document.getElementById('cdResults');
      if(root)new MutationObserver(polishResults).observe(root,{childList:true,subtree:true});
    })
    .catch(()=>{
      polishResults();
      const root=document.getElementById('cdResults');
      if(root)new MutationObserver(polishResults).observe(root,{childList:true,subtree:true});
    });
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
