(()=>{
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parseSets=g=>(g.sets||[]).map(s=>String(s).split('-').map(Number)).filter(x=>x.length===2&&x.every(Number.isFinite));
  const blank=teams=>Object.fromEntries(teams.map(t=>[t,{team:t,w:0,l:0,pf:0,pa:0,sf:0,sa:0}]));
  function rankPool(games){
    const teams=[...new Set(games.flatMap(g=>[g.teamA,g.teamB]))];
    const st=blank(teams);
    games.forEach(g=>{
      const sets=parseSets(g); if(!sets.length)return;
      let aw=0,bw=0,ap=0,bp=0;
      sets.forEach(([a,b])=>{ap+=a;bp+=b;a>b?aw++:bw++});
      const A=st[g.teamA],B=st[g.teamB];
      A.pf+=ap;A.pa+=bp;A.sf+=aw;A.sa+=bw;
      B.pf+=bp;B.pa+=ap;B.sf+=bw;B.sa+=aw;
      if(aw>bw){A.w++;B.l++}else{B.w++;A.l++}
    });
    return Object.values(st).map(r=>({...r,pr:r.pa?r.pf/r.pa:0,sr:r.sa?r.sf/r.sa:(r.sf?999:0)}))
      .sort((a,b)=>b.w-a.w||b.pr-a.pr||b.sr-a.sr||a.team.localeCompare(b.team,'ko'));
  }
  function renderTable(rows,target){
    return `<div class="kvl-calc-table-wrap"><table class="kvl-calc-table"><thead><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>득실점수비율</th><th>세트비율</th><th>상태</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${i<2?'is-qualified ':''}${r.team===target?'is-target':''}"><td>${i+1}</td><td>${esc(r.team)}</td><td>${r.w}</td><td>${r.l}</td><td>${r.pr.toFixed(3)}</td><td>${r.sr===999?'∞':r.sr.toFixed(3)}</td><td>${i<2?'본선 진출':'예선 탈락'}</td></tr>`).join('')}</tbody></table></div>`;
  }
  async function install(){
    if(document.body?.dataset.competition!=='gosung-2026')return;
    const section=document.getElementById('group-standings');
    if(!section||section.querySelector('.kvl-ranking-rule-card'))return;
    const oldCalc=document.getElementById('cdQualificationCalculator');
    if(oldCalc)oldCalc.hidden=true;

    const calculator=document.createElement('details');
    calculator.className='kvl-qualification-compact';
    calculator.innerHTML=`<summary><span><b>본선 진출 계산기</b><small>공식 결과를 기준으로 조별 순위와 진출팀을 확인합니다.</small></span><em>계산기 열기</em></summary><div class="kvl-calc-body"><div class="kvl-calc-loading">공식 경기 데이터를 불러오는 중입니다.</div></div>`;
    section.appendChild(calculator);

    const card=document.createElement('div');
    card.className='cd-rule-card kvl-ranking-rule-card';
    card.innerHTML='<strong>순위 결정 방법</strong>승리 경기 수로 순위를 결정한다. 승리 경기 수가 같으면 득실점수비율(예선 총 득점 ÷ 총 실점)을 기준으로 하며, 득실점수비율이 같으면 세트비율(예선 총 승리세트 ÷ 총 패배세트) 순으로 정한다. 세트비율까지 같으면 동률인 팀 간의 승자승으로 순위를 정한다.<br><b class="kvl-rule-flow">승리 경기 수 → 득실점수비율 → 세트비율 → 승자승. 각 조 상위 2팀 본선 진출.</b><br><a href="university-competition.html?view=sources">대회요강 원문 확인 →</a>';
    section.appendChild(card);

    let data;
    try{data=await fetch('data/competitions/gosung-2026.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json()})}
    catch{calculator.querySelector('.kvl-calc-body').innerHTML='<div class="kvl-calc-error">경기 데이터를 불러오지 못했습니다.</div>';return}
    const prelim=(data.games||[]).filter(g=>g.division==='남대부'&&g.stage==='예선'&&g.pool);
    const pools=[...new Set(prelim.map(g=>g.pool))].sort();
    const rankings=Object.fromEntries(pools.map(p=>[p,rankPool(prelim.filter(g=>g.pool===p))]));
    const body=calculator.querySelector('.kvl-calc-body');
    body.innerHTML=`<div class="kvl-calc-notice"><b>공식 결과 고정</b><span>고성대회 예선이 종료되어 모든 경기 결과는 수정할 수 없습니다.</span></div><div class="kvl-calc-controls"><label>조 선택<select id="kvlCalcPool">${pools.map(p=>`<option value="${esc(p)}">${esc(p)}조</option>`).join('')}</select></label><label>확인 팀<select id="kvlCalcTeam"></select></label></div><div id="kvlCalcHeadline" class="kvl-calc-headline"></div><div id="kvlCalcResult"></div><p class="kvl-calc-footnote">※ 순위는 승리 경기 수 → 득실점수비율 → 세트비율 순으로 자동 계산합니다. 동률이 계속되면 승자승을 적용합니다.</p>`;
    const poolSel=body.querySelector('#kvlCalcPool'),teamSel=body.querySelector('#kvlCalcTeam'),headline=body.querySelector('#kvlCalcHeadline'),result=body.querySelector('#kvlCalcResult');
    function draw(){
      const rows=rankings[poolSel.value]||[];
      const prev=teamSel.value;
      teamSel.innerHTML=rows.map(r=>`<option value="${esc(r.team)}">${esc(r.team)}</option>`).join('');
      if(rows.some(r=>r.team===prev))teamSel.value=prev;
      const target=teamSel.value||rows[0]?.team||'';
      const rank=rows.findIndex(r=>r.team===target)+1;
      headline.className=`kvl-calc-headline ${rank>0&&rank<=2?'is-in':'is-out'}`;
      headline.textContent=target?`${target} 공식 순위: ${rank}위 · ${rank<=2?'본선 진출':'예선 탈락'}`:'팀을 선택하세요.';
      result.innerHTML=renderTable(rows,target);
    }
    poolSel.addEventListener('change',draw); teamSel.addEventListener('change',()=>{const rows=rankings[poolSel.value]||[],target=teamSel.value,rank=rows.findIndex(r=>r.team===target)+1;headline.className=`kvl-calc-headline ${rank<=2?'is-in':'is-out'}`;headline.textContent=`${target} 공식 순위: ${rank}위 · ${rank<=2?'본선 진출':'예선 탈락'}`;result.innerHTML=renderTable(rows,target)});
    draw();
    calculator.addEventListener('toggle',()=>{calculator.querySelector('summary em').textContent=calculator.open?'계산기 닫기':'계산기 열기'});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
