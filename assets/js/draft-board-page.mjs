import {EVENT_STATUS,PICK_STATUS,TRADE_STATUS,validate,lottery,playerSnapshot} from './draft-board-core.mjs';
import {DraftStore,fetchJSON} from './draft-board-store.mjs';
import {renderBoard,e,teamName,sourceLink,badge,dateText,tradeSummary} from './draft-board-render.mjs?v=20261030-women-draws-1';
import {joinApplicants} from './draft-applicants-core.mjs';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
let index,state,sources,store,applicants=[],applicantError='',generation=0,busy=false,division=params.get('gender')==='W'?'W':'M';
const editor=$('editor');
const options=(values,selected)=>values.map(([v,label])=>`<option value="${e(v)}" ${String(v)===String(selected)?'selected':''}>${e(label)}</option>`).join('');
const teamOptions=selected=>options(state.teams.map(t=>[t.id,t.name]),selected);
const field=(label,name,value='',type='text',attrs='')=>`<label>${e(label)}<input name="${e(name)}" type="${type}" value="${e(value)}" ${attrs}></label>`;
const select=(label,name,items,value)=>`<label>${e(label)}<select name="${e(name)}">${options(items,value)}</select></label>`;
const teamSelect=(label,name,value)=>select(label,name,state.teams.map(t=>[t.id,t.name]),value);
const textarea=(label,name,value='',attrs='')=>`<label>${e(label)}<textarea name="${e(name)}" rows="3" ${attrs}>${e(value)}</textarea></label>`;
const check=(label,name,checked=false)=>`<label class="db-check"><input type="checkbox" name="${e(name)}" ${checked?'checked':''}>${e(label)}</label>`;
function error(message){$('draftError').hidden=!message;$('draftError').textContent=message||'';}
function status(message){$('saveStatus').textContent=message;}
function paint(){
  document.body.dataset.gender=state.division;document.querySelectorAll('[data-division]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.division===state.division));b.disabled=!index.seasons.find(s=>s.season===state.season)?.divisions[b.dataset.division];});
  $('draftBoard').innerHTML=renderBoard(state,sources,{admin:store.editable,applicantCount:applicantError?null:applicants.length});$('draftBoard').setAttribute('aria-busy','false');
  $('adminLoadBar').hidden=!store.editable;
  $('adminBar').hidden=!store.actor;
  $('adminBar').innerHTML=store.actor?`<div><b>${e(store.actor)} · 관리자 입력</b><span>저장 대상 ${e(store.repository)} / ${e(store.branch)} · 입력할 때마다 영구 저장</span></div><div><button class="da-button" data-action="event">개최 정보·상태</button> <button class="da-button" id="logout">관리자 종료</button></div>`:'';
  $('adminOpen').textContent=store.actor?'관리자 인증됨':'관리자 입력';
  $('applicantsFooter').href=`draft-hub.html?season=${encodeURIComponent(state.season)}&gender=${state.division}&layout=table&sort=source#applicants`;
}
function close(){if(!busy)editor.close();}
$('editorClose').addEventListener('click',close);
editor.addEventListener('click',ev=>{if(ev.target===editor){const box=editor.getBoundingClientRect();if(ev.clientX<box.left||ev.clientX>box.right||ev.clientY<box.top||ev.clientY>box.bottom)close();}});
editor.addEventListener('cancel',ev=>{if(busy)ev.preventDefault();});
function modal(title,html){$('editorTitle').textContent=title;$('editorBody').innerHTML=html;if(!editor.open)editor.showModal();}
function form(title,body,submit,{reason=true,after,saveLabel='저장',extra=''}={}) {
  modal(title,`<form class="db-form" id="draftForm">${body}${reason?textarea('수정 사유','reason','','required maxlength="500" placeholder="변경한 내용과 확인 근거를 적어 주세요."'):''}<p class="db-form-error" id="formError" role="alert" hidden></p><div class="db-actions">${extra}<button class="da-button" type="button" id="formCancel">닫기</button><button class="da-button db-primary" type="submit">${e(saveLabel)}</button></div></form>`);
  $('formCancel').onclick=close;
  $('draftForm').onsubmit=async ev=>{
    ev.preventDefault();if(busy)return;const f=ev.currentTarget,formData=new FormData(f);busy=true;
    f.querySelectorAll('button').forEach(b=>b.disabled=true);$('editorClose').disabled=true;$('refresh').disabled=true;$('season').disabled=true;$('formError').hidden=true;
    try{await submit(formData);busy=false;editor.close();}catch(err){$('formError').hidden=false;$('formError').textContent=err.message;}
    finally{busy=false;f.querySelectorAll('button').forEach(b=>b.disabled=false);$('editorClose').disabled=false;$('refresh').disabled=false;$('season').disabled=false;}
  };
  after?.($('draftForm'));
}
async function save(command){
  status('저장 중입니다…');
  try {
    const result=await store.save(command,state.revision);state=result.state;paint();error('');
    status(`저장 완료 · ${dateText(state.updated_at)} · 버전 ${state.revision} · ${result.commit.slice(0,7)}`);
  }catch(err){status('저장을 확인하지 못했습니다. 입력은 유지되어 있습니다. 최신 자료를 다시 불러온 후 확인하세요.');throw err;}
}
function login(){
  if(store.actor){modal('관리자 인증',`<p>${e(store.actor)} 계정으로 인증되어 있습니다. 저장 대상은 ${e(store.branch)} 브랜치입니다.</p>`);return;}
  form('드래프트 관리자 인증',`<p>기존 GitHub 저장소의 쓰기 권한으로 인증합니다. 이 페이지에 입력한 공식 기록은 공개 드래프트 자료로 저장됩니다.</p><p>권한 범위가 <b>kvolleylab/kvolleylab · Contents 읽기/쓰기</b>인 fine-grained 토큰을 사용하세요. 토큰은 이 탭의 메모리에만 보관하며 새로고침하면 다시 인증합니다.</p>${field('GitHub 저장소 인증 토큰','token','','password','required autocomplete="off" spellcheck="false"')}<p class="db-help">기존 테스트용 관리자 비밀번호만으로는 데이터를 수정할 수 없습니다.</p>`,async f=>{
    const token=f.get('token');$('draftForm').elements.token.value='';state=await store.connect(token);paint();error('');status(`관리자 인증 완료 · 버전 ${state.revision}`);
  },{reason:false,saveLabel:'관리자 연결'});
}
function resultEditor(id,trainee=false,entryID=null,statusOnly=false){
  const p=trainee?null:state.picks.find(p=>p.id===id);
  const old=statusOnly?state.trainees[id]:trainee?state.trainees[id].entries.find(e=>e.id===entryID):p.result;
  let selectedPlayer=old?.player?structuredClone(old.player):null;
  const currentStatus=statusOnly?state.trainees[id].status:old?.status||'selected';
  const currentTeam=old?.actual_team||(trainee?id:p.current_team);
  const title=trainee?`${teamName(state,id)} · 수련선수`:`${p.round}R ${teamName(state,p.original_team)} 원지명권`;
  const statusItems=Object.entries(PICK_STATUS).filter(([key])=>statusOnly?key!=='selected':trainee?key==='selected':key!=='not_recorded');
  const playerForm=statusOnly?'':`<div id="playerFields"><fieldset><legend>신청자 검색 또는 직접 입력</legend>${applicantError?`<p class="db-form-error">${e(applicantError)}</p>`:''}${field('신청자 검색 · 선수명/학교/포지션','search','','search','autocomplete="off" placeholder="예: 윤경, 인하대, OH"')}<div id="applicantMatches" class="db-applicant-results" hidden></div><p id="playerChosen" class="db-picked-player" hidden></p><button class="da-button" id="manualEntry" type="button">직접 입력으로 전환</button></fieldset><div class="db-fields">${field('선수명','playerName',old?.player?.name||'','text','maxlength="80"')}${field('학교·소속','affiliation',old?.player?.affiliation||'','text','maxlength="100"')}${field('포지션','position',old?.player?.position||'','text','maxlength="40" placeholder="OH / OP / MB / S / L"')}</div><p class="db-help">검증된 신청자 연결을 선택한 경우에만 기존 선수 프로필로 연결합니다. 소속·포지션을 확인하지 못하면 비워 둘 수 있습니다.</p></div>`;
  form(title,`<p>${trainee?'수련선수는 팀당 여러 명을 입력할 수 있습니다.':`현재 보유팀: <b>${e(teamName(state,p.current_team))}</b> · 추첨 순위가 바뀌어도 이 원지명권에 저장됩니다.`}</p><div class="db-fields">${select('지명 상태','status',statusItems,currentStatus)}${teamSelect('실제 지명팀','actualTeam',currentTeam)}</div>${playerForm}${field('지명 결과 출처 URL (확인된 경우)','sourceURL',old?.source_url||'','url','placeholder="https://…"')}${old?.actual_team?check('공식 결과 정정: 지명 당시 실제 지명팀 변경 또는 결과 초기화','correctTeam'):''}`,async f=>{
    const resultStatus=f.get('status'),manual={name:f.get('playerName')?.trim()||'',affiliation:f.get('affiliation')?.trim()||'',position:f.get('position')?.trim()||'',applicant_id:null,player_id:null};
    const player=selectedPlayer?{...selectedPlayer,name:manual.name,affiliation:manual.affiliation,position:manual.position}:manual;
    // Editing a selected identity's name/affiliation is treated as a manual identity, never a silent rematch.
    if(selectedPlayer&&(player.name!==selectedPlayer.name||player.affiliation!==selectedPlayer.affiliation)){player.player_id=null;player.applicant_id=null;}
    const value={status:resultStatus,actual_team:resultStatus==='waiting'?null:f.get('actualTeam'),player:resultStatus==='selected'?player:null,source_url:f.get('sourceURL')||''};
    await save({type:trainee?'trainee':'result',target:id,entry_id:entryID||undefined,value,correct_actual_team:f.has('correctTeam'),reason:f.get('reason')});
  },{extra:entryID?'<button class="da-button db-danger" type="button" id="removeTrainee">선수 삭제</button>':'',after:f=>{
    if(trainee)f.elements.actualTeam.disabled=true;
    // Disabled selects are absent from FormData; retain a fixed hidden team field.
    if(trainee){const hidden=document.createElement('input');hidden.type='hidden';hidden.name='actualTeam';hidden.value=id;f.appendChild(hidden);}
    if(!statusOnly){
      const sync=()=>{$('playerFields').hidden=f.elements.status.value!=='selected';f.elements.playerName.required=f.elements.status.value==='selected';};
      f.elements.status.onchange=sync;sync();
      const clear=()=>{selectedPlayer=null;$('playerChosen').hidden=true;f.elements.playerName.readOnly=false;f.elements.affiliation.readOnly=false;};
      const choose=a=>{selectedPlayer=playerSnapshot(a);f.elements.playerName.value=selectedPlayer.name;f.elements.affiliation.value=selectedPlayer.affiliation;f.elements.position.value=selectedPlayer.position;$('playerChosen').textContent=`${selectedPlayer.name} · ${selectedPlayer.affiliation} · ${selectedPlayer.player_id?'기존 프로필 연결':'프로필 미연결'}`;$('playerChosen').hidden=false;$('applicantMatches').hidden=true;f.elements.search.value='';};
      $('manualEntry').onclick=clear;
      f.elements.search.oninput=()=>{const q=f.elements.search.value.trim().toLowerCase();const matches=q?applicants.filter(a=>[a.name,a.affiliation,...a.positions].join(' ').toLowerCase().includes(q)).slice(0,15):[];
        $('applicantMatches').hidden=!q;$('applicantMatches').innerHTML=matches.length?matches.map(a=>`<button type="button" class="db-applicant-option" data-applicant="${e(a.applicant_id)}">${e(a.name)}<small>${e(a.affiliation)} · ${e(a.positions.join('/'))}</small></button>`).join(''):'<p style="padding:12px">일치하는 신청자가 없습니다. 직접 입력할 수 있습니다.</p>';
      };
      $('applicantMatches').onclick=ev=>{const button=ev.target.closest('[data-applicant]');if(button)choose(applicants.find(a=>a.applicant_id===button.dataset.applicant));};
      if(selectedPlayer){$('playerChosen').hidden=false;$('playerChosen').textContent=`${selectedPlayer.name} · ${selectedPlayer.player_id?'기존 프로필 연결':'직접 입력/미연결'}`;}
    }
    if(entryID)$('removeTrainee').onclick=()=>form('수련선수 기록 삭제',`<p>${e(old.player.name)}의 지명 기록을 삭제합니다. 변경 전 기록은 수정 이력에 남습니다.</p>`,async data=>save({type:'trainee',target:id,remove_id:entryID,reason:data.get('reason')}),{saveLabel:'삭제 기록 저장'});
  }});
}
function drawEditor(id){
  const d=state.draws.find(d=>d.id===id);
  form(d?'추첨 기록 정정':'구슬 추첨 기록 추가',`${teamSelect('나온 팀','team',d?.team_id||state.teams[0].id)}${field('메모','note',d?.note||'','text','maxlength="500"')}<p>같은 팀이 다시 나와도 기록을 남깁니다. 추첨 순위는 첫 기록에만 부여합니다.</p>${d?select('나온 순서','order',state.draws.map((r,i)=>[i,`${i+1}번째`]),state.draws.indexOf(d)):''}`,async f=>{
    if(d&&Number(f.get('order'))!==state.draws.indexOf(d)){
      if(f.get('team')!==d.team_id||f.get('note')!==d.note)throw new Error('순서 이동과 팀/메모 정정은 각각 저장하세요.');
      await save({type:'draw_move',target:id,value:Number(f.get('order')),reason:f.get('reason')});
    }else await save({type:d?'draw_edit':'draw_add',target:id,value:{team_id:f.get('team'),note:f.get('note')},reason:f.get('reason')});
  },{extra:d?'<button type="button" class="da-button db-danger" id="removeDraw">기록 삭제</button>':'',after:()=>{if(d)$('removeDraw').onclick=()=>form('추첨 기록 삭제',`<p>${state.draws.indexOf(d)+1}번째 ${e(teamName(state,d.team_id))} 기록을 삭제합니다. 기존 지명권과 선수 입력은 보존됩니다.</p>`,async f=>save({type:'draw_remove',target:id,reason:f.get('reason')}),{saveLabel:'삭제 기록 저장'});}});
}
function tradeEditor(id){
  const t=state.trades.find(t=>t.id===id);let legs=structuredClone(t?.legs||[{pick_id:state.picks[0].id,from:state.picks[0].current_team,to:state.teams[1].id}]);
  const pickOptions=selected=>options(state.picks.map(p=>[p.id,`${p.round}R ${teamName(state,p.original_team)} 원지명권`]),selected);
  const readLegs=()=>[...document.querySelectorAll('.db-trade-leg')].map(el=>({pick_id:el.querySelector('[data-leg-pick]').value,from:el.querySelector('[data-leg-from]').value,to:el.querySelector('[data-leg-to]').value}));
  function renderLegs(){
    $('tradeLegs').innerHTML=legs.map((l,i)=>`<div class="db-trade-leg" data-leg-index="${i}"><label>원지명권<select data-leg-pick>${pickOptions(l.pick_id)}</select></label><label>양도팀<select data-leg-from>${teamOptions(l.from)}</select></label><label>양수팀<select data-leg-to>${teamOptions(l.to)}</select></label><button class="da-button" type="button" data-remove-leg="${i}" ${legs.length===1?'disabled':''}>제거</button></div>`).join('');
    $('tradeLegs').onchange=ev=>{if(ev.target.matches('[data-leg-pick]')){const row=ev.target.closest('.db-trade-leg'),p=state.picks.find(p=>p.id===ev.target.value);row.querySelector('[data-leg-from]').value=p.current_team;}};
    $('tradeLegs').onclick=ev=>{const b=ev.target.closest('[data-remove-leg]');if(b){legs=readLegs();legs.splice(Number(b.dataset.removeLeg),1);renderLegs();}};
  }
  form(t?'지명권 거래 수정':'지명권 양도·맞교환 등록',`<p>거래 단위로 저장합니다. 맞교환은 지명권을 추가해 양방향을 한 번에 등록하세요. 확인 중 거래는 보유팀에 반영되지 않습니다.</p><div class="db-fields">${select('거래 상태','tradeStatus',[['pending','확인 중'],['confirmed','확정']],t?.status||'pending')}${select('날짜 기준','dateKind',[['transaction','거래일'],['announcement','발표일']],t?.date_kind||'transaction')}${field('거래일 또는 발표일','date',t?.date||'','date')}</div><fieldset><legend>거래할 지명권</legend><div id="tradeLegs"></div><button type="button" class="da-button" id="addLeg">지명권 추가 · 맞교환</button></fieldset>${textarea('관련 선수 또는 거래 조건','conditions',t?.conditions||'','maxlength="2000" placeholder="IBK 고의정(OH) + 2R 지명권 ↔ SOOP 정솔민(L)"')}<p class="db-help">각 구단이 내주는 선수(포지션)와 지명권을 ↔ 양쪽에 적습니다. 거래 당시의 소속·포지션을 기록합니다.</p>${field('공식 출처 URL · 확정 거래 필수','sourceURL',t?.source_url||'','url','placeholder="https://…"')}`,async f=>{
    await save({type:t?'trade_edit':'trade_add',target:id,value:{status:f.get('tradeStatus'),date:f.get('date'),date_kind:f.get('dateKind'),conditions:f.get('conditions'),source_url:f.get('sourceURL'),legs:readLegs()},reason:f.get('reason')});
  },{extra:t?'<button type="button" class="da-button db-danger" id="cancelTrade">거래 취소</button>':'',after:()=>{
    renderLegs();$('addLeg').onclick=()=>{legs=readLegs();const available=state.picks.find(p=>!legs.some(l=>l.pick_id===p.id));if(available){legs.push({pick_id:available.id,from:available.current_team,to:state.teams.find(t=>t.id!==available.current_team).id});renderLegs();}};
    if(t)$('cancelTrade').onclick=()=>form('지명권 거래 취소',`<p>취소 이력은 남고, 해당 거래는 현재 보유팀 계산에서 제외됩니다. 이미 지명한 팀과 선수 기록은 보존됩니다.</p>${check('이 지명권을 받은 뒤 재양도한 후속 거래도 함께 취소','cascade')}`,async f=>save({type:'trade_cancel',target:id,cascade:f.has('cascade'),reason:f.get('reason')}),{saveLabel:'거래 취소 저장'});
  }});
}
function tradeDetail(id,right=false){
  const list=right?state.trades.filter(t=>t.legs.some(l=>l.pick_id===id)):state.trades.filter(t=>t.id===id);
  modal('지명권 거래 상세',list.map(t=>`<article>${badge(TRADE_STATUS[t.status],t.status)}${tradeSummary(t)}<dl class="db-facts"><dt>${t.date_kind==='announcement'?'발표일':'거래일'}</dt><dd>${e(t.date||'미확인')}</dd><dt>지명권</dt><dd>${t.legs.map(l=>{const p=state.picks.find(p=>p.id===l.pick_id);return `${p.round}R ${e(teamName(state,p.original_team))} 원지명권<br>${e(teamName(state,l.from))} → ${e(teamName(state,l.to))}`;}).join('<br><br>')}</dd><dt>공식 출처</dt><dd>${sourceLink(t.source_url)}</dd>${t.cancel_reason?`<dt>취소 사유</dt><dd>${e(t.cancel_reason)}</dd>`:''}</dl></article>`).join('<hr>'));
}
function rulesEditor(){
  const rules=[...state.rules.rounds,state.rules.trainees];
  form('시즌별 라운드·수련선수 운영',`<p>확인된 공식 자료에 맞춰 이 시즌의 규칙만 변경합니다. 직접 지정은 팀 코드 7개를 쉼표로 구분합니다.</p><p>${state.teams.map(t=>`${e(t.name)} ${e(t.id)}`).join(' · ')}</p>${rules.map((r,i)=>`<fieldset><legend>${i<4?r.round+'R':'수련선수'}</legend><div class="db-fields">${select('진행 순서','direction'+i,[['forward','정순'],['reverse','역순'],['custom','직접 지정'],...(i===4?[['unordered','순서 없음']]:[])],r.direction)}${select('공식 확인 상태','verification'+i,[['unverified','확인 중 · 양식 기준'],['verified','공식 확인 완료']],r.verification)}</div>${field('직접 지정 순서 (선택 시 7팀 필수)','order'+i,(r.order||[]).join(','))}${field('공식 규칙 출처 URL','source'+i,r.source_url,'url')}${textarea('운영 설명','note'+i,r.note,'maxlength="1000"')}${i===4?field('팀당 최대 인원 (제한 미확인/없음은 빈칸)','limit',r.limit??'','number','min="1" step="1"'):''}</fieldset>`).join('')}`,async f=>{
    const next=rules.map((r,i)=>({...r,direction:f.get('direction'+i),verification:f.get('verification'+i),order:f.get('order'+i).split(',').map(s=>s.trim()).filter(Boolean),source_url:f.get('source'+i),note:f.get('note'+i)}));
    next[4].limit=f.get('limit')===''?null:Number(f.get('limit'));await save({type:'rules',value:{...state.rules,rounds:next.slice(0,4),trainees:next[4]},reason:f.get('reason')});
  });
}
function lotteryEditor(){
  const rule=state.rules.lottery||{reset_after_rank:null,automatic_last:false,verification:'unverified',note:'',source_url:''};
  form('시즌별 구슬 추첨 방식',`<p>단계별 확률은 각 추첨 단계 시작의 구슬 비율로 계산합니다. 중복 추첨이 나와도 같은 단계의 구슬 수는 유지합니다.</p>${field('재추첨에서 제외할 상위 순위 수 · 없으면 빈칸','resetAfter',rule.reset_after_rank??'','number','min="1" max="5" step="1"')}${check('6순위 결정 후 남은 팀을 7순위로 자동 확정','automaticLast',rule.automatic_last)}${select('확인 상태','verification',[['unverified','확인 중'],['user_record','사용자 현장 기록'],['verified','공식 확인 완료']],rule.verification)}${field('공식 출처 URL','sourceURL',rule.source_url,'url')}${textarea('추첨 방식 근거·설명','note',rule.note,'maxlength="1000"')}`,async f=>save({type:'rules',value:{...state.rules,lottery:{reset_after_rank:f.get('resetAfter')===''?null:Number(f.get('resetAfter')),automatic_last:f.has('automaticLast'),verification:f.get('verification'),source_url:f.get('sourceURL'),note:f.get('note')}},reason:f.get('reason')}));
}
function lotteryResultEditor(){
  const r=state.lottery_result;
  form('공식 확정 순위 · 추첨 상세 확인',`<p>최종 순위와 실제 나온 구슬 기록을 구분합니다. 결과표만 확인했다면 중복 횟수를 0회로 입력하지 않습니다.</p><p>${state.teams.map(t=>`${e(t.name)} ${e(t.id)}`).join(' · ')}</p>${field('확정 순위 · 팀 코드 7개를 순서대로 입력','order',r?.order.join(',')||'')}${select('전체 구슬 기록 확인 상태','logStatus',[['unverified','미확인'],['partial','일부 확인'],['complete','전체 확인']],r?.draw_log_status||'unverified')}${select('7순위 결정 방식','lastMethod',[['unknown','미확인'],['drawn','실제 추첨'],['automatic','자동 확정']],r?.last_rank_method||'unknown')}${field('확정 순위 출처 URL','sourceURL',r?.source_url||'','url','required')}${textarea('확인 설명','note',r?.note||'')}`,async f=>save({type:'lottery_result',value:{order:f.get('order').split(',').map(v=>v.trim()),draw_log_status:f.get('logStatus'),last_rank_method:f.get('lastMethod'),source_url:f.get('sourceURL'),verified_at:new Date().toISOString().slice(0,10),note:f.get('note')},reason:f.get('reason')}));
}
function eventEditor(){
  const event=state.event;
  // datetime-local is explicitly Korea time, independent of the visitor's operating system timezone.
  const local=event.starts_at?new Date(new Date(event.starts_at).getTime()+9*3600e3).toISOString().slice(0,16):'';
  form('개최 정보·진행 상태',`<div class="db-fields">${field('개최 일시 · 한국시간','startsAt',local,'datetime-local')}${field('장소','venue',event.venue,'text','maxlength="200"')}${select('진행 상태','eventStatus',Object.entries(EVENT_STATUS),event.status)}</div>${textarea('진행 상태 설명','note',event.note,'maxlength="1000"')}${field('공식 출처 URL','sourceURL',event.source_url,'url')}<p>완료로 바꾸려면 7팀 추첨과 1R~4R·수련선수의 지명·패스 기록이 모두 필요합니다.</p>`,async f=>save({type:'event',value:{starts_at:f.get('startsAt')?f.get('startsAt')+':00+09:00':'',venue:f.get('venue'),status:f.get('eventStatus'),note:f.get('note'),source_url:f.get('sourceURL')},reason:f.get('reason')}));
}
function colorEditor(id){
  const t=state.teams.find(t=>t.id===id);
  form(`${t.name} · 구슬 색상`,`${check('구슬 색상 미확인','unknown',!t.color)}<div class="db-fields">${field('색상 이름','colorName',t.color?.name||'','text','maxlength="40" placeholder="예: 빨강"')}${field('실제 구슬 색상','hex',t.color?.hex||'#ffffff','color')}</div><p>로고나 유니폼 색으로 추정하지 않습니다. 기존 추첨 기록의 색상은 당시 기록을 보존하며, 기록 정정 시 현재 색상으로 갱신합니다.</p>`,async f=>save({type:'color',target:id,value:f.has('unknown')?null:{name:f.get('colorName').trim(),hex:f.get('hex')},reason:f.get('reason')}));
}
function reviewEditor(){
  const r=state.trade_review;
  form('거래 내역 확인 상태',`${select('시즌 거래 확인 상태','reviewStatus',[['pending','확인 중'],['none_confirmed','확인된 거래 없음'],['confirmed','확정 거래 등록됨']],r.status)}${field('공식 확인 근거 URL','sourceURL',r.source_url,'url')}${textarea('확인 메모','note',r.note||'')}`,async f=>save({type:'trade_review',value:{status:f.get('reviewStatus'),source_url:f.get('sourceURL'),note:f.get('note')},reason:f.get('reason')}));
}
document.addEventListener('click',ev=>{
  if(ev.target.closest('#logout')){store.disconnect();paint();status('관리자 인증을 종료했습니다.');return;}
  const button=ev.target.closest('[data-action]');if(!button||!state||busy)return;
  const {action,target,entry}=button.dataset;
  if(action==='trade-detail'||action==='right-detail'){tradeDetail(target,action==='right-detail');return;}
  if(!store.editable){login();return;}
  ({'result':()=>resultEditor(target),'trainee':()=>resultEditor(target,true,entry),'trainee-status':()=>resultEditor(target,true,null,true),
    'draw-add':()=>drawEditor(),'draw-edit':()=>drawEditor(target),'trade-add':()=>tradeEditor(),'trade-edit':()=>tradeEditor(target),
    'rules':rulesEditor,'lottery-rules':lotteryEditor,'lottery-result':lotteryResultEditor,'event':eventEditor,'color':()=>colorEditor(target),'trade-review':reviewEditor}[action])?.();
});
$('adminOpen').onclick=()=>{if(state)login();};
async function loadSeason(season,nextDivision=division){
  const turn=++generation,entry=index.seasons.find(s=>s.season===season),config=entry?.divisions[nextDivision];
  division=nextDivision;document.body.dataset.gender=division;
  error('');$('draftBoard').setAttribute('aria-busy','true');$('draftBoard').innerHTML='<p class="db-empty">시즌 자료를 불러오고 있습니다.</p>';
  store?.disconnect();state=null;$('adminBar').hidden=true;$('adminLoadBar').hidden=true;$('adminOpen').textContent='관리자 입력';
  if(!config){error('등록되지 않은 시즌입니다. 시즌 선택에서 확인된 자료를 선택하세요.');$('draftBoard').innerHTML='';$('draftBoard').setAttribute('aria-busy','false');return;}
  status('드래프트 정보를 불러오고 있습니다.');
  const nextStore=new DraftStore({...index.storage,path:config.state});
  try {
    const [remote,seed,source,apps,links]=await Promise.allSettled([nextStore.load(),fetchJSON(config.state),fetchJSON(config.sources),fetchJSON(config.applicants),fetchJSON(config.links)]);
    if(turn!==generation)return;
    if(source.status!=='fulfilled')throw source.reason;
    const loaded=remote.status==='fulfilled'?remote.value:seed.status==='fulfilled'?validate(seed.value):null;
    if(!loaded)throw new Error('시즌 자료를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
    if(loaded.season!==season||loaded.division!==nextDivision||source.value.season!==season||source.value.division!==nextDivision)throw new Error('요청한 시즌/부문과 자료가 일치하지 않습니다.');
    state=loaded;sources=source.value;store=nextStore;applicants=[];applicantError='';
    try{if(apps.status!=='fulfilled'||links.status!=='fulfilled')throw new Error();applicants=joinApplicants(apps.value,links.value).filter(a=>a.gender===nextDivision&&a.season===season&&a.application_status==='confirmed');}
    catch{applicantError='신청자 검색 자료를 불러오지 못했습니다. 직접 입력은 가능합니다.';}
    paint();$('season').value=season;
    const u=new URL(location.href);u.searchParams.set('season',season);u.searchParams.set('gender',division);history.replaceState(null,'',u);
    status(remote.status==='fulfilled'?`저장소 확인 완료 · ${state.updated_at?dateText(state.updated_at):'사전 안내 자료'} · 버전 ${state.revision}`:'저장소 연결 지연 · 배포된 사전 자료 표시 중 · 최신 현황은 새로고침으로 확인하세요.');
    if(remote.status==='rejected')console.warn('Draft repository read unavailable:',remote.reason?.message||'Network error');
  }catch(err){if(turn===generation){error(err.message);$('draftBoard').innerHTML='';$('draftBoard').setAttribute('aria-busy','false');status('자료 불러오기 실패');}}
}
$('season').onchange=()=>{if(!busy)loadSeason($('season').value)};
document.querySelectorAll('[data-division]').forEach(b=>b.onclick=()=>{if(!busy&&b.dataset.division!==division)loadSeason($('season').value,b.dataset.division)});
$('refresh').onclick=async()=>{
  if(busy)return;
  if(store?.actor){
    $('refresh').disabled=true;
    try{state=await store.load();paint();error('');status(`최신 저장 확인 · 버전 ${state.revision}`);}catch(err){error(err.message);}finally{$('refresh').disabled=false;}
  }else await loadSeason($('season').value||index.default_season);
};
try{
  index=await fetchJSON('data/drafts/index.json');
  $('season').innerHTML=index.seasons.filter(s=>s.divisions.M||s.divisions.W).map(s=>`<option value="${e(s.season)}">${e(s.year??s.season.slice(0,4))}년</option>`).join('');$('season').disabled=false;
  await loadSeason(params.get('season')||index.default_season);
  if(params.get('admin')==='1'&&state)login();
}catch(err){error(err.message);status('드래프트 시즌 목록을 불러오지 못했습니다.');}
