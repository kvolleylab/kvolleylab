(()=>{
'use strict';
if(document.body?.dataset.competition!=='presidents-2026')return;

const RULES_URL='https://drive.google.com/file/d/1oMmohcnIDQf4E8fRv1APPK1nnfZq8UEr/view?usp=drivesdk';
const PAMPHLET_URL='https://drive.google.com/file/d/1p4pDIsHiC95oDdKY46ySG3_Q6bWh2kel/view?usp=drivesdk';
const DIVISIONS=['15세이하 여자부','15세이하 남자부','18세이하 여자부','18세이하 남자부'];
const GROUPS={
  '15세이하 여자부':{
    A:['세화여중','대구일중','부평여중'],
    B:['신탄중앙중','광주체중','강릉해람중'],
    C:['포항여중','제천여중','월평중']
  },
  '15세이하 남자부':{
    A:['언양중','남성중','대연중'],
    B:['문흥중','진주동명중','소사중'],
    C:['인하사대부중','태릉중','연현중','하동중'],
    D:['각리중','송산중','대전남선중','함안중']
  },
  '18세이하 여자부':{
    A:['광주체고','목포여상','대구여고','강릉여고'],
    B:['대전용산고','세화여고','포항여고','경남여고']
  },
  '18세이하 남자부':{
    A:['영생고','천안고','진주동명고','남성고'],
    B:['수성고','대전중앙고','현일고','인창고'],
    C:['옥천고','경북사대부고','동해광희고','경북체고'],
    D:['순천제일고','송림고','광주전자공고','성지고','인하사대부고']
  }
};
let groupDivision=DIVISIONS[0];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ratio=(a,b)=>b===0?(a>0?Infinity:0):a/b;
const ratioText=v=>v===Infinity?'MAX':Number(v||0).toFixed(3);

const polishResults=()=>{
  const root=document.getElementById('scResults');
  if(!root)return;
  root.querySelectorAll('.sc-match').forEach(match=>{
    if(match.dataset.kvlGoseongTemplate==='1')return;
    match.dataset.kvlGoseongTemplate='1';

    const meta=match.querySelector('.sc-meta');
    if(meta&&!meta.querySelector('.sc-meta-top')){
      const parts=meta.textContent.split('·').map(v=>v.trim()).filter(Boolean);
      const start=parts.shift()||'';
      const stage=parts.pop()||'';
      const venue=parts.join(' · ');
      meta.innerHTML=`<div class="sc-meta-top">${start}</div><div class="sc-meta-detail"><span class="sc-stage">${stage}</span>${venue?`<span class="sc-venue" title="${venue}">${venue}</span>`:''}</div>`;
    }

    const sides=[...match.querySelectorAll('.sc-board .sc-team')];
    if(sides.length===2){
      sides.forEach((side,index)=>{
        const logo=side.querySelector('.sc-team-logo');
        const logoHtml=logo?logo.outerHTML:'';
        if(logo)logo.remove();
        const name=side.textContent.trim();
        const winner=side.classList.contains('sc-winner');
        side.className=`sc-team ${index===0?'is-left':'is-right'}${winner?' sc-winner':''}`;
        side.innerHTML=index===0
          ?`${logoHtml}<strong>${name}</strong>`
          :`<strong>${name}</strong>${logoHtml}`;
      });
    }
  });
};

const simplifySources=()=>{
  const section=document.getElementById('sources');
  if(!section)return;
  section.querySelectorAll('.sc-regulations,.sc-data-note').forEach(el=>el.remove());
  const root=section.querySelector('.sc-sources');
  if(!root)return;
  const html=`<a href="${RULES_URL}" target="_blank" rel="noopener noreferrer"><span>제59회 대통령배 참가요강 원문 열기</span><span>→</span></a><a href="${PAMPHLET_URL}" target="_blank" rel="noopener noreferrer"><span>제59회 대통령배 팸플릿 PDF 열기</span><span>→</span></a>`;
  if(root.innerHTML!==html)root.innerHTML=html;
};

const tuneCopy=()=>{
  const overview=document.getElementById('overview');
  const note=overview?.querySelector('.sc-title>p');
  if(note)note.textContent='사전경기 포함 · 공식 경기스코어 기준';
};

const groupGames=(division,teams)=>{
  const set=new Set(teams);
  return (window.KVL_PRESIDENTS_2026_GAMES||[]).filter(g=>
    g.division===division&&set.has(g.teamA)&&set.has(g.teamB)&&['예선','사전경기'].includes(g.stage)
  );
};

const calculateGroup=(division,teams)=>{
  const stats=Object.fromEntries(teams.map(team=>[team,{team,gp:0,w:0,l:0,sf:0,sa:0,pf:0,pa:0}]));
  const games=groupGames(division,teams);
  games.forEach(g=>{
    const a=stats[g.teamA],b=stats[g.teamB];
    if(!a||!b)return;
    const [sa,sb]=String(g.score||'0-0').split('-').map(Number);
    a.gp++;b.gp++;
    a.sf+=sa||0;a.sa+=sb||0;b.sf+=sb||0;b.sa+=sa||0;
    if(sa>sb){a.w++;b.l++;}else if(sb>sa){b.w++;a.l++;}
    (g.sets||[]).forEach(setScore=>{
      const [pa,pb]=String(setScore).split('-').map(Number);
      if(Number.isFinite(pa)&&Number.isFinite(pb)){
        a.pf+=pa;a.pa+=pb;b.pf+=pb;b.pa+=pa;
      }
    });
  });
  const directWinner=(ta,tb)=>{
    const g=games.find(x=>(x.teamA===ta&&x.teamB===tb)||(x.teamA===tb&&x.teamB===ta));
    if(!g)return null;
    const [a,b]=String(g.score||'0-0').split('-').map(Number);
    if(a===b)return null;
    return a>b?g.teamA:g.teamB;
  };
  return Object.values(stats).map(s=>({...s,pointRatio:ratio(s.pf,s.pa),setRatio:ratio(s.sf,s.sa)})).sort((a,b)=>{
    if(b.w!==a.w)return b.w-a.w;
    if(b.pointRatio!==a.pointRatio)return b.pointRatio-a.pointRatio;
    if(b.setRatio!==a.setRatio)return b.setRatio-a.setRatio;
    const winner=directWinner(a.team,b.team);
    if(winner===a.team)return -1;
    if(winner===b.team)return 1;
    return a.team.localeCompare(b.team,'ko');
  });
};

const renderGroupStandings=()=>{
  const tabs=document.getElementById('scGroupDivisionTabs');
  const root=document.getElementById('scGroupStandings');
  if(!tabs||!root)return;
  tabs.innerHTML=DIVISIONS.map(d=>`<button type="button" class="${d===groupDivision?'is-active':''}" data-group-division="${esc(d)}">${esc(d)}</button>`).join('');
  tabs.querySelectorAll('[data-group-division]').forEach(btn=>btn.addEventListener('click',()=>{groupDivision=btn.dataset.groupDivision;renderGroupStandings();}));
  const groups=GROUPS[groupDivision]||{};
  root.innerHTML=Object.entries(groups).map(([name,teams])=>{
    const rows=calculateGroup(groupDivision,teams);
    return `<article class="sc-group-card"><h3>${name}조</h3><div class="sc-group-table"><div class="sc-group-row sc-group-head"><span>순위</span><span>팀</span><span>경기</span><span>승</span><span>패</span><span>점수비율</span><span>세트비율</span></div>${rows.map((s,i)=>`<div class="sc-group-row ${i<2?'is-qualified':''}"><span class="sc-group-rank">${i+1}</span><strong>${esc(s.team)}</strong><span>${s.gp}</span><span>${s.w}</span><span>${s.l}</span><span>${ratioText(s.pointRatio)}</span><span>${ratioText(s.setRatio)}</span></div>`).join('')}</div></article>`;
  }).join('');
};

const decoratePodiums=()=>{
  document.querySelectorAll('#scPodiums .sc-rank').forEach(row=>{
    const label=row.querySelector('b');
    if(!label)return;
    const text=label.textContent.trim();
    if((text==='우승'||text==='준우승')&&!label.querySelector('.sc-rank-trophy')){
      label.insertAdjacentHTML('afterbegin','<span class="sc-rank-trophy" aria-hidden="true">🏆</span>');
    }
  });
};

const apply=()=>{polishResults();simplifySources();tuneCopy();renderGroupStandings();decoratePodiums();};
const start=()=>{
  apply();
  const results=document.getElementById('scResults');
  if(results){
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;polishResults();});
    }).observe(results,{childList:true,subtree:true});
  }
  const sources=document.getElementById('sources');
  if(sources){
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;simplifySources();});
    }).observe(sources,{childList:true,subtree:true});
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
