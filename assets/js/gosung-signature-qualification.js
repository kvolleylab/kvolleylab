(()=>{
  'use strict';
  const DATA_URL='data/competitions/gosung-2026.json';
  const COMPETITION_ID='gosung-2026';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number.isFinite(v)?v.toFixed(3):'∞';

  function styles(){
    if(document.getElementById('kvlSignatureQualificationStyle'))return;
    const s=document.createElement('style');s.id='kvlSignatureQualificationStyle';s.textContent=`
    .kvl-ranking-rule-card{margin:28px 0 0!important;max-width:none!important}.kvl-rule-summary{display:block;margin:12px 0 3px;color:#17365d;font-weight:900}.kvl-rule-checked{display:block;margin-top:5px;color:#64748b;font-size:12px}
    .kvl-signature-calc{margin-top:26px;border:1px solid #dbe2ea;border-radius:24px;background:#fff;overflow:hidden}.kvl-signature-calc summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 24px;cursor:pointer;list-style:none;background:linear-gradient(135deg,#f8fafc,#fff)}.kvl-signature-calc summary::-webkit-details-marker{display:none}.kvl-signature-calc summary strong{display:block;color:#17365d;font-size:20px}.kvl-signature-calc summary span{display:block;margin-top:5px;color:#64748b;font-size:13px;line-height:1.55}.kvl-signature-calc summary:after{content:'계산기 열기';flex:0 0 auto;padding:9px 14px;border-radius:999px;background:#17365d;color:#fff;font-size:12px;font-weight:900}.kvl-signature-calc[open] summary:after{content:'계산기 닫기'}
    .kvl-signature-body{padding:0 24px 24px}.kvl-signature-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:18px 0}.kvl-signature-controls label{display:flex;align-items:center;gap:8px;color:#536477;font-size:13px;font-weight:900}.kvl-signature-controls select{padding:9px 34px 9px 12px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#17365d;font:inherit;font-weight:900}.kvl-signature-status{padding:18px;border-radius:18px;background:#eef6ff;color:#17365d;font-weight:900;line-height:1.65}.kvl-signature-status.is-qualified{background:#eaf8ef;color:#166534}.kvl-signature-status.is-out{background:#fff1f1;color:#991b1b}
    .kvl-pending{margin-top:18px;padding:16px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc}.kvl-pending h3{margin:0 0 6px;color:#17365d}.kvl-pending-intro{margin:0 0 12px;color:#64748b;font-size:12px}.kvl-game-input{display:grid;grid-template-columns:minmax(90px,1fr) 100px minmax(90px,1fr);gap:10px;align-items:center;padding:11px 0;border-top:1px solid #e2e8f0}.kvl-game-input:first-of-type{border-top:0}.kvl-game-input span:first-child{text-align:right}.kvl-game-input select{width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#17365d;font-weight:900}.kvl-official-note{margin-top:16px;padding:12px 14px;border-radius:14px;background:#f8fafc;color:#64748b;font-size:12px}
    .kvl-probability{margin-top:16px;padding:16px;border:1px solid #e2e8f0;border-radius:16px}.kvl-probability strong{color:#17365d}.kvl-probability-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:10px}.kvl-probability-grid div{padding:10px;border-radius:12px;background:#f8fafc;text-align:center}.kvl-probability-grid b{display:block;color:#17365d;font-size:18px}.kvl-probability small{display:block;margin-top:10px;color:#64748b;line-height:1.6}
    .kvl-table-wrap{margin-top:16px;overflow:auto;border:1px solid #e2e8f0;border-radius:16px}.kvl-table{width:100%;min-width:760px;border-collapse:collapse;background:#fff}.kvl-table th,.kvl-table td{padding:11px 9px;border-bottom:1px solid #eef2f7;text-align:center;font-size:13px}.kvl-table th{background:#f8fafc;color:#536477}.kvl-table td:nth-child(2),.kvl-table th:nth-child(2){text-align:left}.kvl-table tr.is-qualified{background:#f0fdf4}.kvl-table tr.is-selected{outline:2px solid #c9a24a;outline-offset:-2px}.kvl-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#166534;color:#fff;font-size:11px;font-weight:900}.kvl-signature-note{margin:14px 0 0;color:#64748b;font-size:12px;line-height:1.7}#group-standings>.cd-qualifier{display:none!important}
    @media(max-width:620px){.kvl-signature-calc summary{align-items:flex-start;padding:18px}.kvl-signature-body{padding:0 16px 18px}.kvl-signature-controls{align-items:flex-start;flex-direction:column}.kvl-signature-controls label{width:100%;justify-content:space-between}.kvl-game-input{grid-template-columns:minmax(70px,1fr) 82px minmax(70px,1fr);font-size:12px}}
    `;document.head.appendChild(s);
  }

  function table(rows,selected,rules){
    const first=rules.rankingRules[0]==='matchPoints'?'승점':'승';
    return `<div class="kvl-table-wrap"><table class="kvl-table"><thead><tr><th>순위</th><th>팀</th><th>${first}</th><th>승-패</th><th>점수득실률</th><th>세트득실률</th><th>상태</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.qualified?'is-qualified ':''}${r.team===selected?'is-selected':''}"><td>${r.rank}</td><td><strong>${esc(r.team)}</strong></td><td>${first==='승점'?r.matchPoints:r.wins}</td><td>${r.wins}-${r.losses}</td><td>${fmt(r.pointRatio)}</td><td>${fmt(r.setRatio)}</td><td>${r.qualified?'<span class="kvl-badge">본선 진출권</span>':'진출권 밖'}</td></tr>`).join('')}</tbody></table></div>`;
  }

  async function install(){
    if(document.body?.dataset.competition!==COMPETITION_ID)return;
    const engine=window.KVLTournamentEngine,rules=window.KVLTournamentRules?.[COMPETITION_ID];
    if(!engine||!rules){console.error('KVL Tournament Engine 또는 대회 규칙을 불러오지 못했습니다.');return;}
    styles();
    const section=document.getElementById('group-standings');if(!section)return;
    let data;try{data=await fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json();});}catch{return;}
    let working=JSON.parse(JSON.stringify(data.games||[]));
    let rule=section.querySelector('.kvl-ranking-rule-card');if(!rule){rule=document.createElement('div');rule.className='cd-rule-card kvl-ranking-rule-card';section.appendChild(rule);}
    rule.innerHTML=`<strong>순위 결정 방법</strong>${rules.rankingRules.map(x=>rules.labels?.[x]||x).join(' → ')} 순으로 순위를 결정합니다.<span class="kvl-rule-summary">${esc(rules.summary)}</span><span class="kvl-rule-checked">운영요강 적용 확인일: ${esc(rules.sourceCheckedAt||'-')}</span><a href="${esc(rules.sourceView)}">대회요강 원문 확인 →</a>`;
    if(section.querySelector('.kvl-signature-calc'))return;
    const details=document.createElement('details');details.className='kvl-signature-calc';details.innerHTML=`<summary><div><strong>KVL 대회 시뮬레이터</strong><span>종료된 공식 경기는 잠그고, 미종료 경기의 예상 결과를 입력해 순위와 진출 가능성을 확인합니다.</span></div></summary><div class="kvl-signature-body"><div class="kvl-signature-controls"><label>조 선택 <select id="kvlPool"><option value="A">A조</option><option value="B">B조</option><option value="C">C조</option></select></label><label>확인 팀 <select id="kvlTeam"></select></label></div><div id="kvlPending"></div><div id="kvlStatus" class="kvl-signature-status"></div><div id="kvlProbability"></div><div id="kvlTable"></div><p class="kvl-signature-note">※ 진출 확률은 남은 세트 스코어 경우를 동일한 가능성으로 계산한 비율이며 실제 팀 전력을 반영한 예측 확률이 아닙니다.</p></div>`;rule.before(details);
    const pool=details.querySelector('#kvlPool'),team=details.querySelector('#kvlTeam'),pendingBox=details.querySelector('#kvlPending'),status=details.querySelector('#kvlStatus'),prob=details.querySelector('#kvlProbability'),tableBox=details.querySelector('#kvlTable');
    const filter=()=>({division:rules.division,pool:pool.value,stage:rules.stage});
    function renderPending(){
      const pending=engine.pendingGames(working,filter());
      if(!pending.length){pendingBox.innerHTML='<div class="kvl-official-note">이 대회는 모든 조별리그 경기가 종료되어 공식 결과가 잠겨 있습니다. 진행 중인 대회에서는 이 영역에 미종료 경기 입력칸이 표시됩니다.</div>';return;}
      pendingBox.innerHTML=`<section class="kvl-pending"><h3>남은 경기 예상 입력</h3><p class="kvl-pending-intro">세트 스코어를 선택하면 기본 세트 점수가 입력되고 즉시 순위가 다시 계산됩니다.</p>${pending.map(g=>`<label class="kvl-game-input"><span>${esc(g.teamA)}</span><select data-game="${esc(g.id)}"><option value="">예상 선택</option>${['3-0','3-1','3-2','2-3','1-3','0-3'].map(x=>`<option>${x}</option>`).join('')}</select><span>${esc(g.teamB)}</span></label>`).join('')}</section>`;
      pendingBox.querySelectorAll('select[data-game]').forEach(sel=>sel.addEventListener('change',()=>{if(!sel.value)return;working=engine.replaceGame(working,sel.dataset.game,{score:sel.value,sets:engine.defaultOutcomeSets(sel.value),completed:true,status:'예상 결과'});renderAll(false);}));
    }
    function renderTeams(rows){const old=team.value;team.innerHTML=rows.map(r=>`<option value="${esc(r.team)}">${esc(r.team)}</option>`).join('');if(rows.some(r=>r.team===old))team.value=old;}
    function renderProbability(){
      const pending=engine.pendingGames(working,filter());if(!pending.length){prob.innerHTML='';return;}
      const result=engine.enumerate(working,rules,filter(),{maxScenarios:46656});
      if(result.truncated){prob.innerHTML=`<div class="kvl-probability"><strong>진출 가능성 계산</strong><small>${esc(result.message)}</small></div>`;return;}
      prob.innerHTML=`<div class="kvl-probability"><strong>경우의 수 기준 진출 비율</strong><div class="kvl-probability-grid">${Object.entries(result.probabilities).map(([name,p])=>`<div><span>${esc(name)}</span><b>${p.percent.toFixed(1)}%</b></div>`).join('')}</div><small>${esc(result.assumption)}</small></div>`;
    }
    function renderAll(resetTeams=true){
      const rows=engine.calculate(working,rules,filter());if(resetTeams)renderTeams(rows);const selected=team.value||rows[0]?.team||'';const row=rows.find(r=>r.team===selected);status.className=`kvl-signature-status ${row?.qualified?'is-qualified':'is-out'}`;status.textContent=engine.explain(row,rows,rules);tableBox.innerHTML=table(rows,selected,rules);renderPending();renderProbability();
    }
    pool.addEventListener('change',()=>{working=JSON.parse(JSON.stringify(data.games||[]));renderAll(true);});team.addEventListener('change',()=>renderAll(false));renderAll(true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
