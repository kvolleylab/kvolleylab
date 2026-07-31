(()=>{
  const DATA_URL='data/competitions/gosung-2026.json';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ratio=(a,b)=>b? a/b : (a?999:0);

  function installStyles(){
    if(document.getElementById('kvlSignatureQualificationStyle')) return;
    const style=document.createElement('style');
    style.id='kvlSignatureQualificationStyle';
    style.textContent=`
      .kvl-ranking-rule-card{margin:28px 0 0!important;max-width:none!important}
      .kvl-ranking-rule-card .kvl-rule-summary{display:block;margin:12px 0 2px;color:#17365d;font-weight:900}
      .kvl-signature-calc{margin-top:26px;border:1px solid #dbe2ea;border-radius:24px;background:#fff;overflow:hidden}
      .kvl-signature-calc summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 24px;cursor:pointer;list-style:none;background:linear-gradient(135deg,#f8fafc,#fff)}
      .kvl-signature-calc summary::-webkit-details-marker{display:none}
      .kvl-signature-calc summary strong{display:block;color:#17365d;font-size:20px}
      .kvl-signature-calc summary span{display:block;margin-top:5px;color:#64748b;font-size:13px;line-height:1.55}
      .kvl-signature-calc summary:after{content:'계산기 열기';flex:0 0 auto;padding:9px 14px;border-radius:999px;background:#17365d;color:#fff;font-size:12px;font-weight:900}
      .kvl-signature-calc[open] summary:after{content:'계산기 닫기'}
      .kvl-signature-body{padding:0 24px 24px}
      .kvl-signature-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:18px 0}
      .kvl-signature-controls label{display:flex;align-items:center;gap:8px;color:#536477;font-size:13px;font-weight:900}
      .kvl-signature-controls select{padding:9px 34px 9px 12px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#17365d;font:inherit;font-weight:900}
      .kvl-signature-status{padding:18px;border-radius:18px;background:#eef6ff;color:#17365d;font-weight:900;line-height:1.65}
      .kvl-signature-status.is-qualified{background:#eaf8ef;color:#166534}
      .kvl-signature-status.is-out{background:#fff1f1;color:#991b1b}
      .kvl-signature-table-wrap{margin-top:16px;overflow:auto;border:1px solid #e2e8f0;border-radius:16px}
      .kvl-signature-table{width:100%;min-width:690px;border-collapse:collapse;background:#fff}
      .kvl-signature-table th,.kvl-signature-table td{padding:11px 10px;border-bottom:1px solid #eef2f7;text-align:center;font-size:13px}
      .kvl-signature-table th{background:#f8fafc;color:#536477;font-weight:900}
      .kvl-signature-table td:nth-child(2),.kvl-signature-table th:nth-child(2){text-align:left}
      .kvl-signature-table tr.is-qualified{background:#f0fdf4}
      .kvl-signature-table tr.is-selected{outline:2px solid #c9a24a;outline-offset:-2px}
      .kvl-qual-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#166534;color:#fff;font-size:11px;font-weight:900}
      .kvl-signature-note{margin:14px 0 0;color:#64748b;font-size:12px;line-height:1.7}
      #group-standings>.cd-qualifier{display:none!important}
      @media(max-width:620px){.kvl-signature-calc summary{align-items:flex-start;padding:18px}.kvl-signature-calc summary strong{font-size:18px}.kvl-signature-body{padding:0 16px 18px}.kvl-signature-controls{align-items:flex-start;flex-direction:column}.kvl-signature-controls label{width:100%;justify-content:space-between}.kvl-signature-controls select{min-width:150px}}
    `;
    document.head.appendChild(style);
  }

  function buildStats(games,pool){
    const poolGames=games.filter(g=>g.division==='남대부'&&g.stage==='예선'&&g.pool===pool);
    const teams=[...new Set(poolGames.flatMap(g=>[g.teamA,g.teamB]))];
    const stats=Object.fromEntries(teams.map(t=>[t,{team:t,w:0,l:0,pf:0,pa:0,sf:0,sa:0}]));
    for(const g of poolGames){
      const sets=(g.sets||[]).map(s=>String(s).split('-').map(Number)).filter(x=>x.length===2&&x.every(Number.isFinite));
      let aw=0,bw=0;
      for(const [a,b] of sets){
        stats[g.teamA].pf+=a; stats[g.teamA].pa+=b;
        stats[g.teamB].pf+=b; stats[g.teamB].pa+=a;
        if(a>b) aw++; else if(b>a) bw++;
      }
      stats[g.teamA].sf+=aw; stats[g.teamA].sa+=bw;
      stats[g.teamB].sf+=bw; stats[g.teamB].sa+=aw;
      if(aw>bw){stats[g.teamA].w++;stats[g.teamB].l++;}
      else if(bw>aw){stats[g.teamB].w++;stats[g.teamA].l++;}
    }
    return Object.values(stats).map(x=>({...x,pr:ratio(x.pf,x.pa),sr:ratio(x.sf,x.sa)})).sort((a,b)=>b.w-a.w||b.pr-a.pr||b.sr-a.sr||a.team.localeCompare(b.team));
  }

  function interpretation(rows,team){
    const idx=rows.findIndex(r=>r.team===team);
    if(idx<0) return '팀 정보를 확인할 수 없습니다.';
    const rank=idx+1;
    const r=rows[idx];
    if(rank<=2) return `${team}은 공식 결과 기준 ${rank}위로 본선 진출이 확정되었습니다. ${r.w}승 ${r.l}패, 득실점수비율 ${r.pr.toFixed(3)}, 세트비율 ${r.sr===999?'∞':r.sr.toFixed(3)}입니다.`;
    const second=rows[1];
    if(r.w<second.w) return `${team}은 공식 결과 기준 ${rank}위로 예선 탈락했습니다. 2위 팀보다 승리 경기 수가 ${second.w-r.w}경기 적습니다.`;
    if(r.pr<second.pr) return `${team}은 승리 경기 수는 2위 팀과 같았지만 득실점수비율에서 밀려 ${rank}위로 예선 탈락했습니다.`;
    return `${team}은 공식 결과 기준 ${rank}위입니다. 세트비율 또는 승자승 기준까지 적용해 최종 순위가 결정되었습니다.`;
  }

  function renderTable(rows,selected){
    return `<div class="kvl-signature-table-wrap"><table class="kvl-signature-table"><thead><tr><th>순위</th><th>팀</th><th>승</th><th>패</th><th>득실점수비율</th><th>세트비율</th><th>상태</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="${i<2?'is-qualified ':''}${r.team===selected?'is-selected':''}"><td>${i+1}</td><td><strong>${esc(r.team)}</strong></td><td>${r.w}</td><td>${r.l}</td><td>${r.pr.toFixed(3)}</td><td>${r.sr===999?'∞':r.sr.toFixed(3)}</td><td>${i<2?'<span class="kvl-qual-badge">본선 진출</span>':'예선 탈락'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  async function install(){
    if(document.body?.dataset.competition!=='gosung-2026') return;
    installStyles();
    const section=document.getElementById('group-standings');
    if(!section) return;

    let rule=section.querySelector('.kvl-ranking-rule-card');
    if(!rule){
      rule=document.createElement('div');
      rule.className='cd-rule-card kvl-ranking-rule-card';
      section.appendChild(rule);
    }
    rule.innerHTML='<strong>순위 결정 방법</strong>승리 경기 수로 순위를 결정한다. 승리 경기 수가 같으면 득실점수비율(예선 총 득점 ÷ 총 실점)을 기준으로 하며, 득실점수비율이 같으면 세트비율(예선 총 승리세트 ÷ 총 패배세트) 순으로 정한다. 세트비율까지 같으면 동률인 팀 간의 승자승으로 순위를 정한다.<span class="kvl-rule-summary">승리 경기 수 → 득실점수비율 → 세트비율 → 승자승. 각 조 상위 2팀 본선 진출.</span><a href="university-competition.html?view=sources">대회요강 원문 확인 →</a>';

    if(section.querySelector('.kvl-signature-calc')) return;
    const details=document.createElement('details');
    details.className='kvl-signature-calc';
    details.innerHTML='<summary><div><strong>본선 진출 계산기</strong><span>공식 결과를 기준으로 조별 순위와 팀별 진출 상태를 자동 해석합니다.</span></div></summary><div class="kvl-signature-body"><div class="kvl-signature-controls"><label>조 선택 <select id="kvlPoolSelect"><option value="A">A조</option><option value="B">B조</option><option value="C">C조</option></select></label><label>확인 팀 <select id="kvlTeamSelect"></select></label></div><div id="kvlSignatureStatus" class="kvl-signature-status"></div><div id="kvlSignatureTable"></div><p class="kvl-signature-note">※ 공식 경기 결과는 수정할 수 없습니다. 진행 중인 다른 대회에 적용할 때는 미확정 경기만 입력하도록 확장됩니다.</p></div>';
    rule.insertAdjacentElement('beforebegin',details);

    let data;
    try{data=await fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();});}
    catch{details.querySelector('#kvlSignatureStatus').textContent='대회 데이터를 불러오지 못했습니다.';return;}

    const poolSelect=details.querySelector('#kvlPoolSelect');
    const teamSelect=details.querySelector('#kvlTeamSelect');
    const status=details.querySelector('#kvlSignatureStatus');
    const table=details.querySelector('#kvlSignatureTable');

    const refreshTeams=()=>{
      const rows=buildStats(data.games||[],poolSelect.value);
      const old=teamSelect.value;
      teamSelect.innerHTML=rows.map(r=>`<option value="${esc(r.team)}">${esc(r.team)}</option>`).join('');
      if(rows.some(r=>r.team===old)) teamSelect.value=old;
      render();
    };
    const render=()=>{
      const rows=buildStats(data.games||[],poolSelect.value);
      const team=teamSelect.value||rows[0]?.team||'';
      const rank=rows.findIndex(r=>r.team===team)+1;
      status.className=`kvl-signature-status ${rank>0&&rank<=2?'is-qualified':'is-out'}`;
      status.textContent=interpretation(rows,team);
      table.innerHTML=renderTable(rows,team);
    };
    poolSelect.addEventListener('change',refreshTeams);
    teamSelect.addEventListener('change',render);
    refreshTeams();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
