(function(root,factory){const api=factory(root.KVLMatrix||(typeof require==='function'?require('./core.js'):null));if(typeof module==='object'&&module.exports)module.exports=api;else root.KVLMatrixApp=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Matrix){
  'use strict';
  const LIVE_ROOT='https://raw.githubusercontent.com/kvolleylab/kvolleylab/main/data/competitions/';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const kst=t=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t));
  function render(model){
    return model.rounds.map(r=>{
      const state=r.issues.length?'자료 확인 필요':!r.started?'미시작':r.complete?(r.cumulativeComplete?'라운드 종료':'이전 라운드 미완료'):'진행 중';
      const title=`${r.round}ROUND`,visible=r.started;
      return `<section class="matrix-round" aria-labelledby="round-${r.round}" data-round="${r.round}"><div class="matrix-round-title"><h2 id="round-${r.round}">${title}</h2><span class="matrix-round-state">${state}${visible?' · '+r.completed+'/21':''}</span></div><div class="matrix-table-wrap"><table class="matrix-table" aria-label="${r.round}라운드 승패 조견표"><colgroup><col class="col-rank"><col class="col-total"><col class="col-round"><col class="col-team">${model.teams.map(t=>'<col class="col-result'+(/^[가-힣]{3,}$/.test(t.short)?' is-wide':'')+'">').join('')}</colgroup><thead><tr><th scope="col">순위</th><th scope="col" aria-label="총승점"><span>총</span><span>승점</span></th><th scope="col" aria-label="라운드 승점"><span>R</span><span>승점</span></th><th scope="col">팀</th>${model.teams.map(t=>`<th scope="col" aria-label="${escape(t.name)}">${escape(t.short)}</th>`).join('')}</tr></thead><tbody>${r.rows.map(t=>`<tr data-team="${escape(t.code)}"><td class="matrix-rank${visible&&t.rank===1?' is-first':''}" aria-label="${visible&&t.rank?`${t.rank}위${t.tied?' 동률':''}`:'순위 미확정'}">${visible?(t.rank??'—'):''}${visible&&t.tied?'<sup>=</sup>':''}</td><td class="matrix-total">${visible?t.points:''}</td><td class="matrix-round-points">${visible?t.rPoints:''}</td><th scope="row" class="matrix-team" aria-label="${escape(t.name)}">${escape(t.short)}</th>${model.teams.map(o=>o.code===t.code?'<td class="matrix-self" aria-label="동일 팀"></td>':`<td data-opponent="${escape(o.code)}" aria-label="${escape(t.name+' 대 '+o.name)}: ${t.sets[o.code]===null?'종료 결과 없음':t.sets[o.code]+'세트 획득'}">${t.sets[o.code]??''}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
    }).join('');
  }
  function createController(options){
    const {snapshots,onData,onStatus,fetcher=fetch,timers={setInterval:(fn,ms)=>setInterval(fn,ms),clearInterval:id=>clearInterval(id)},interval=60000}=options;
    let gender='men',epoch=0,timer=null,abort=null,disposed=false,lastGood=new Map();
    function show(payload,mode){const model=Matrix.build(payload.data,payload.config);lastGood.set(gender,payload);onData(model,gender,mode);return model;}
    function select(next){
      if(!['men','women'].includes(next))throw Error('Invalid gender');
      gender=next;epoch++;abort?.abort();
      const saved=lastGood.get(gender)||snapshots[gender];
      if(saved){show(saved,'snapshot');onStatus({kind:'snapshot',message:'저장본 표시 · 최신 데이터 확인 중',updatedAt:saved.data.updatedAt});}
      return refresh();
    }
    async function refresh(){
      if(disposed)return;
      const token=++epoch,selected=gender;abort?.abort();abort=new AbortController();
      const requestAbort=abort;
      const timeout=setTimeout(()=>requestAbort.abort(),15000);
      try{
        const base=options.base||LIVE_ROOT,slug=`v-league-${selected}-2026-27/`,stamp=Date.now();
        const [data,config]=await Promise.all(['data.json','config.json'].map(async file=>{
          const response=await fetcher(base+slug+file+'?matrix='+stamp,{cache:'no-store',signal:abort.signal});
          if(!response.ok)throw Error('HTTP '+response.status);
          return response.json();
        }));
        if(token!==epoch||disposed)return;
        const expected=selected==='men'?'M':'W';
        if(config.slug!==`v-league-${selected}-2026-27`||data.matches.some(m=>!String(m.id).startsWith(`VL2627-${expected}-`)))throw Error('시즌·성별 데이터 불일치');
        const model=show({data,config},'live');
        onStatus({kind:model.issues.length?'warning':'live',message:model.issues.length?'데이터 확인 필요 · 일부 결과/순위 제외':`최신 데이터 확인 ${kst(Date.now())} KST`,updatedAt:data.updatedAt,issues:model.issues,completed:model.completed});
        return model;
      }catch(e){
        if(token!==epoch||disposed)return;
        onStatus({kind:'error',message:'최신 데이터 확인 실패 · 마지막 저장본 표시',error:e.message,updatedAt:lastGood.get(gender)?.data.updatedAt});
      }finally{clearTimeout(timeout);}
    }
    function start(initial='men'){const promise=select(initial);timer=timers.setInterval(refresh,interval);return promise;}
    function stop(){disposed=true;epoch++;abort?.abort();if(timer!==null)timers.clearInterval(timer);}
    return {start,select,refresh,stop};
  }
  function mount(snapshots){
    const grid=document.getElementById('matrix-grid'),status=document.getElementById('matrix-status'),updated=document.getElementById('matrix-updated'),notice=document.getElementById('matrix-issue');
    const controller=createController({snapshots,
      onData(model,gender){
        grid.innerHTML=render(model);document.body.dataset.gender=gender;
        document.querySelectorAll('[data-gender]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.gender===gender));});
        document.getElementById('matrix-gender-name').textContent=gender==='men'?'남자부':'여자부';
        document.getElementById('matrix-season-link').href=`https://kvolleylab.com/competition-engine.html?competition=v-league-${gender}-2026-27&view=groups`;
        notice.hidden=!model.issues.length;
        notice.textContent=model.issues.length?`자료 확인 필요 ${model.issues.length}건 · 누락·충돌 결과를 제외했으며 관련 순위는 표시하지 않습니다.`:'';
      },
      onStatus(s){status.textContent=s.message;status.dataset.state=s.kind;updated.textContent=s.updatedAt?`결과 반영 ${kst(s.updatedAt)} KST`:'';}
    });
    document.querySelectorAll('button[data-gender]').forEach(b=>b.addEventListener('click',()=>{const p=new URLSearchParams(location.search);p.set('gender',b.dataset.gender);try{history.replaceState(null,'',location.pathname+'?'+p);}catch{}controller.select(b.dataset.gender);}));
    document.getElementById('matrix-refresh').addEventListener('click',()=>controller.refresh());
    const visibility=()=>{if(!document.hidden)controller.refresh();};document.addEventListener('visibilitychange',visibility);
    addEventListener('pagehide',()=>{controller.stop();document.removeEventListener('visibilitychange',visibility);},{once:true});
    controller.start(new URLSearchParams(location.search).get('gender')==='women'?'women':'men');
    return controller;
  }
  return {render,createController,mount,LIVE_ROOT};
});
