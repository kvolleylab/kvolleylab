// Draft rights are identified BEFORE the lottery. No result is keyed by column.
export const EVENT_STATUS = {scheduled:'예정', drawing:'추첨 중', selecting:'지명 중', completed:'완료'};
export const PICK_STATUS = {waiting:'지명 대기', selected:'지명 완료', passed:'패스', not_recorded:'공식표 미기재'};
export const TRADE_STATUS = {pending:'확인 중', confirmed:'확정', cancelled:'취소'};
const clone = value => structuredClone(value);
const ensure = (test, message) => { if (!test) throw new Error(message); };
const text = (value, max=500) => typeof value === 'string' && value.length <= max;
export const isHTTPS = value => {try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export const rightID = (season, division, round, original) => `${season}:${division}:${round}:${original}`;
export function lottery(state) {
  const ranks = {}, records = state.draws.map((draw,index) => {
    const duplicate = Object.hasOwn(ranks,draw.team_id);
    if (!duplicate) ranks[draw.team_id] = Object.keys(ranks).length+1;
    return {...draw, sequence:index+1, duplicate, rank:duplicate?null:ranks[draw.team_id]};
  });
  const confirmed=state.lottery_result;
  if(confirmed) {
    const officialRanks=Object.fromEntries(confirmed.order.map((id,i)=>[id,i+1]));
    const automatic=confirmed.last_rank_method==='automatic'?{team_id:confirmed.order[6],rank:7,color:state.teams.find(t=>t.id===confirmed.order[6]).color}:null;
    return {ranks:officialRanks,records,automatic,complete:confirmed.order.length===7,logStatus:confirmed.draw_log_status,rankSource:confirmed.source_url};
  }
  let automatic=null;
  if(state.rules.lottery?.automatic_last && Object.keys(ranks).length===state.teams.length-1) {
    const remaining=state.teams.find(t=>!Object.hasOwn(ranks,t.id));
    ranks[remaining.id]=state.teams.length;
    automatic={team_id:remaining.id,rank:state.teams.length,color:remaining.color};
  }
  return {ranks,records,automatic,complete:Object.keys(ranks).length===state.teams.length,logStatus:'recorded'};
}
// These are ball shares at the START of each pool, not final rank probabilities.
// Duplicate redraws do not remove another team's allocation from that pool.
export function lotteryStages(state) {
  const draw=lottery(state),reset=state.rules.lottery?.reset_after_rank;
  const ranges=reset?[[1,reset],[reset+1,state.teams.length]]:[[1,state.teams.length]];
  return ranges.map(([from,to])=>{
    const excluded=state.teams.filter(t=>(draw.ranks[t.id]||Infinity)<from);
    const ready=excluded.length===from-1;
    const pool=state.teams.filter(t=>!excluded.some(x=>x.id===t.id));
    const total=ready&&pool.every(t=>t.balls!==null)?pool.reduce((n,t)=>n+t.balls,0):null;
    return {from,to,total,excluded,entries:Array.from({length:to-from+1},(_,i)=>{
      const rank=from+i,team=state.teams.find(t=>draw.ranks[t.id]===rank)||null;
      return {rank,team,automatic:Boolean(draw.automatic&&team&&draw.automatic.team_id===team.id),probability:team&&total>0?team.balls/total*100:null};
    })};
  });
}
export function owners(state) {
  const result = Object.fromEntries(state.picks.map(p=>[p.id,p.original_team]));
  for (const trade of [...state.trades].sort((a,b)=>a.sequence-b.sequence)) {
    if (trade.status!=='confirmed') continue;
    for (const leg of trade.legs) ensure(result[leg.pick_id]===leg.from,`거래 ${trade.id}: 현재 보유팀과 양도팀이 다릅니다. 후속 거래를 함께 정정하거나 취소하세요.`);
    // Validate every leg before applying any leg: swaps are atomic.
    for (const leg of trade.legs) result[leg.pick_id]=leg.to;
  }
  return result;
}
export function columns(state) {
  const {ranks}=lottery(state);
  return [...state.teams].sort((a,b)=>(ranks[a.id]||99)-(ranks[b.id]||99));
}
export function pickRank(state,pick) {
  const rule=state.rules.rounds.find(r=>r.round===pick.round), rank=lottery(state).ranks[pick.original_team];
  if (rule.direction==='custom') return rule.order.indexOf(pick.original_team)+1;
  if (!rank) return null;
  return rule.direction==='reverse'?state.teams.length+1-rank:rank;
}
export function traineeRank(state,team) {
  const rule=state.rules.trainees,rank=lottery(state).ranks[team];
  if (rule.direction==='unordered') return null;
  if (rule.direction==='custom') return rule.order.indexOf(team)+1;
  if (!rank) return null;
  return rule.direction==='reverse'?state.teams.length+1-rank:rank;
}
export function playerSnapshot(applicant) {
  return {name:applicant.name,affiliation:applicant.affiliation||'',position:(applicant.positions||[]).join('/'),
    applicant_id:applicant.applicant_id,player_id:applicant.match_status==='matched'&&applicant.match?.profile_verified===true?applicant.player_id:null};
}
export function profileURL(player) {
  return /^KVL-P-\d{6}$/.test(player?.player_id||'')?`player.html?id=${encodeURIComponent(player.player_id)}`:null;
}
export function validate(state) {
  ensure(state.schema_version===1 && /^\d{4}-\d{2}$/.test(state.season) && ['M','W'].includes(state.division),'시즌 또는 부문 형식 오류');
  ensure(Number.isInteger(state.revision)&&state.revision>=0,'저장 버전 오류');
  const teamIDs=state.teams.map(t=>t.id),teams=new Set(teamIDs);
  ensure(teams.size===7 && teamIDs.length===7,'서로 다른 7개 팀이 필요합니다.');
  const team = id => ensure(teams.has(id),'등록되지 않은 팀입니다.');
  const validSource = url => ensure(!url||isHTTPS(url),'출처는 HTTPS URL이어야 합니다.');
  const validColor = color => {if(color!==null)ensure(color&&text(color.name,40)&&color.name.trim()&&/^#[0-9a-f]{6}$/i.test(color.hex),'구슬 색상 이름과 색상값을 함께 입력하세요.');};
  for (const t of state.teams) {
    ensure(/^[A-Z0-9_-]+$/.test(t.id)&&text(t.name,60)&&t.name,'팀 정보 오류');
    ensure(/^assets\/[\w./-]+\.(svg|png|webp)$/.test(t.logo)&&!t.logo.includes('..'),'기존 팀 로고 경로가 필요합니다.');
    ensure(t.balls===null||(Number.isInteger(t.balls)&&t.balls>=0),'구슬 수 오류');
    ensure(t.probability===null||(Number.isFinite(t.probability)&&t.probability>=0&&t.probability<=100),'확률 오류');
    validColor(t.color);
  }
  const probabilities=state.teams.map(t=>t.probability);
  ensure(probabilities.some(p=>p===null)||Math.abs(probabilities.reduce((a,b)=>a+b,0)-100)<0.0001,'최초 추첨 확률 합계는 100%여야 합니다.');
  ensure(Object.hasOwn(EVENT_STATUS,state.event.status),'진행 상태 오류');
  ensure(text(state.event.venue,200)&&text(state.event.starts_at,80)&&text(state.event.note,1000),'개최 정보 오류');
  ensure(!state.event.starts_at||(/(?:Z|[+-]\d{2}:\d{2})$/.test(state.event.starts_at)&&!Number.isNaN(Date.parse(state.event.starts_at))),'개최 일시와 시간대를 확인하세요.');
  validSource(state.event.source_url);
  const unique = (list,label) => ensure(new Set(list).size===list.length,`${label} 중복`);
  unique(state.draws.map(d=>d.id),'추첨 기록 ID');
  for(const d of state.draws){team(d.team_id);validColor(d.color);ensure(text(d.note),'추첨 메모 오류');}
  if(state.lottery_result){
    const r=state.lottery_result;
    ensure(Array.isArray(r.order)&&r.order.length===7&&new Set(r.order).size===7&&r.order.every(id=>teams.has(id)),'확정 추첨 순위는 서로 다른 7팀이어야 합니다.');
    ensure(isHTTPS(r.source_url)&&text(r.verified_at,40)&&r.verified_at,'확정 순위의 출처와 확인일이 필요합니다.');
    ensure(['unverified','partial','complete'].includes(r.draw_log_status)&&['unknown','drawn','automatic'].includes(r.last_rank_method),'추첨 상세 확인 상태 오류');
    ensure(text(r.note,1000),'확정 순위 설명 오류');
    const observed=[...new Set(state.draws.map(d=>d.team_id))];
    ensure(observed.every((id,i)=>id===r.order[i]),'실제 추첨 기록과 확정 순위가 다릅니다. 순위와 기록을 함께 대조하세요.');
    if(r.draw_log_status==='complete')ensure(observed.length===(r.last_rank_method==='automatic'?6:7),'전체 추첨 확인 상태에는 실제 구슬 기록이 필요합니다.');
  }
  ensure(state.rules.rounds.length===4,'1R~4R 규칙이 필요합니다.');
  if(state.rules.lottery){
    const rule=state.rules.lottery;
    ensure(rule.reset_after_rank===null||(Number.isInteger(rule.reset_after_rank)&&rule.reset_after_rank>0&&rule.reset_after_rank<teams.size-1),'재추첨 구슬 제외 순위 오류');
    ensure(typeof rule.automatic_last==='boolean','마지막 순위 자동 확정 설정 오류');
    ensure(['user_record','verified','unverified'].includes(rule.verification)&&text(rule.note,1000),'추첨 방식 확인 정보 오류');
    validSource(rule.source_url);
    if(rule.verification==='verified')ensure(isHTTPS(rule.source_url),'확정 추첨 방식의 공식 출처가 필요합니다.');
  }
  unique(state.rules.rounds.map(r=>r.round),'라운드');
  for(const rule of [...state.rules.rounds,state.rules.trainees]) {
    const trainee=rule===state.rules.trainees;
    if(!trainee)ensure([1,2,3,4].includes(rule.round),'라운드 오류');
    ensure((trainee?['forward','reverse','custom','unordered']:['forward','reverse','custom']).includes(rule.direction),'진행 순서 오류');
    if(rule.direction==='custom')ensure(rule.order?.length===7&&new Set(rule.order).size===7&&rule.order.every(t=>teams.has(t)),'사용자 지정 순서에 7팀을 한 번씩 입력하세요.');
    ensure(['verified','unverified'].includes(rule.verification),'규칙 확인 상태 오류');
    validSource(rule.source_url);
    if(rule.verification==='verified')ensure(isHTTPS(rule.source_url),'확정 규칙의 공식 출처가 필요합니다.');
    ensure(text(rule.note,1000),'규칙 설명 오류');
  }
  ensure(state.rules.trainees.limit===null||(Number.isInteger(state.rules.trainees.limit)&&state.rules.trainees.limit>0),'수련선수 수 제한 오류');
  ensure(state.picks.length===28,'전체 지명권 28개를 유지해야 합니다.');
  unique(state.picks.map(p=>p.id),'지명권 ID');
  for(const p of state.picks) {
    team(p.original_team);team(p.current_team);
    ensure([1,2,3,4].includes(p.round)&&p.id===rightID(state.season,state.division,p.round,p.original_team),'지명권 고정 ID 오류');
  }
  unique(state.trades.map(t=>t.id),'거래 ID');unique(state.trades.map(t=>t.sequence),'거래 순서');
  const pickIDs=new Set(state.picks.map(p=>p.id));
  for(const t of state.trades) {
    ensure(Object.hasOwn(TRADE_STATUS,t.status)&&Number.isInteger(t.sequence)&&t.sequence>0,'거래 상태/순서 오류');
    ensure(Array.isArray(t.legs)&&t.legs.length>0,'거래할 지명권이 필요합니다.');
    unique(t.legs.map(l=>l.pick_id),'동일 거래의 지명권');
    for(const leg of t.legs){ensure(pickIDs.has(leg.pick_id),'존재하지 않는 지명권');team(leg.from);team(leg.to);ensure(leg.from!==leg.to,'양도팀과 양수팀이 같습니다.');}
    ensure(text(t.conditions,2000)&&text(t.date,30),'거래 정보 오류');ensure(!t.date_kind||['transaction','announcement'].includes(t.date_kind),'거래 날짜 구분 오류');validSource(t.source_url);
    if(t.status==='confirmed')ensure(/^\d{4}-\d{2}-\d{2}$/.test(t.date)&&isHTTPS(t.source_url),'확정 거래에는 거래일과 공식 출처가 필요합니다.');
    if(t.status==='cancelled')ensure(t.cancel_reason?.trim(),'취소 사유가 필요합니다.');
  }
  const ownership=owners(state);
  for(const p of state.picks)ensure(p.current_team===ownership[p.id],'보유팀이 확정된 거래 이력과 일치하지 않습니다.');
  const people=new Set(),personIDs=new Set();
  function checkResult(r) {
    ensure(['waiting','selected','passed'].includes(r.status),'지명 상태 오류');
    if(r.status==='waiting'){ensure(!r.actual_team&&!r.player&&!r.completed_at,'대기 칸에 확정 기록을 넣을 수 없습니다.');return;}
    team(r.actual_team);ensure(r.completed_at&&!Number.isNaN(Date.parse(r.completed_at)),'지명 시각 오류');validSource(r.source_url);
    if(r.status==='passed'){ensure(!r.player,'패스에 선수를 지정할 수 없습니다.');return;}
    const p=r.player;
    ensure(p&&text(p.name,80)&&p.name.trim()&&text(p.affiliation,100)&&text(p.position,40),'선수명·소속·포지션 형식을 확인하세요.');
    ensure(!p.player_id||/^KVL-P-\d{6}$/.test(p.player_id),'선수 ID 오류');
    ensure(!p.applicant_id||text(p.applicant_id,100),'신청자 ID 오류');
    const identity=(p.name+'|'+p.affiliation).replace(/\s/g,'').normalize('NFC');
    ensure(!people.has(identity),'이미 지명된 선수입니다. 동명이인은 소속을 구분하세요.');people.add(identity);
    for(const id of [p.player_id,p.applicant_id].filter(Boolean)){ensure(!personIDs.has(id),'동일 선수를 여러 번 지명할 수 없습니다.');personIDs.add(id);}
  }
  for(const p of state.picks)checkResult(p.result);
  ensure(Object.keys(state.trainees).length===7,'수련선수 팀 영역 오류');
  const traineeIDs=[];
  for(const [id,group] of Object.entries(state.trainees)) {
    team(id);ensure(Object.hasOwn(PICK_STATUS,group.status),'수련선수 상태 오류');
    if(group.status==='not_recorded')ensure(isHTTPS(group.source_url),'수련선수 미기재 상태는 확인한 결과표 출처가 필요합니다.');
    ensure(group.status==='selected'?group.entries.length>0:group.entries.length===0,'수련선수 목록과 상태가 일치하지 않습니다.');
    ensure(state.rules.trainees.limit===null||group.entries.length<=state.rules.trainees.limit,'수련선수 최대 인원 초과');
    for(const entry of group.entries){traineeIDs.push(entry.id);checkResult(entry);ensure(entry.actual_team===id,'수련선수는 실제 지명팀에 기록하세요.');}
  }
  unique(traineeIDs,'수련선수 ID');
  ensure(['pending','none_confirmed','confirmed'].includes(state.trade_review.status),'거래 확인 상태 오류');
  validSource(state.trade_review.source_url);
  if(state.trade_review.status==='none_confirmed') {
    ensure(isHTTPS(state.trade_review.source_url),'확인된 거래 없음의 근거 출처가 필요합니다.');
    ensure(!state.trades.some(t=>t.status!=='cancelled'),'확인 중/확정 거래가 있어 거래 없음으로 표시할 수 없습니다.');
  }
  if(state.trade_review.status==='confirmed')ensure(state.trades.some(t=>t.status==='confirmed'),'확정된 거래가 없습니다.');
  if(state.event.status==='completed')ensure(lottery(state).complete&&state.picks.every(p=>p.result.status!=='waiting')&&Object.values(state.trainees).every(g=>g.status!=='waiting'),'완료 상태에는 추첨 7팀과 1R~4R·수련선수 전체 지명/패스 기록이 필요합니다.');
  ensure(Array.isArray(state.audit)&&state.audit.length===state.revision,'수정 이력과 저장 버전이 일치하지 않습니다.');
  unique(state.audit.map(a=>a.id),'수정 이력 ID');
  return state;
}
const waiting = () => ({status:'waiting',actual_team:null,player:null,completed_at:null,source_url:''});
export function createSeason({season,division='M',teams,event,rules,source_id}) {
  const state={schema_version:1,season,division,revision:0,source_id,updated_at:null,
    event:event||{starts_at:'',venue:'',status:'scheduled',note:'',source_url:''},teams:clone(teams),rules:clone(rules),draws:[],trades:[],
    trade_review:{status:'pending',source_url:'',note:'거래 내역 확인 중'},
    picks:[1,2,3,4].flatMap(round=>teams.map(t=>({id:rightID(season,division,round,t.id),round,original_team:t.id,current_team:t.id,result:waiting()}))),
    trainees:Object.fromEntries(teams.map(t=>[t.id,{status:'waiting',entries:[]}])),audit:[]};
  return validate(state);
}
function resultValue(old,value,ctx,command) {
  const result=clone(value);
  if(old?.status!=='waiting'&&old?.actual_team&&result.actual_team!==old.actual_team) {
    ensure(command.correct_actual_team===true,'완료 당시 실제 지명팀은 자동 변경할 수 없습니다. 명시적인 결과 정정이 필요합니다.');
  }
  if(result.status==='waiting')return waiting();
  return {status:result.status,actual_team:result.actual_team,player:result.status==='selected'?clone(result.player):null,
    completed_at:old?.completed_at||ctx.now,source_url:result.source_url||''};
}
// A transaction either yields one fully valid state + audit row, or changes nothing.
export function applyCommand(input,command,{actor,now=new Date().toISOString(),id=crypto.randomUUID()}={}) {
  validate(input);ensure(text(actor,100)&&actor.trim(),'인증된 수정자가 필요합니다.');
  ensure(text(command.reason,500)&&command.reason.trim(),'수정 사유를 입력하세요.');
  const state=clone(input),ctx={now};let before,after,target=command.target||state.season;
  const pick = () => {const p=state.picks.find(p=>p.id===command.target);ensure(p,'지명권을 찾지 못했습니다.');return p;};
  switch(command.type) {
    case 'lottery_result': before=state.lottery_result||null;state.lottery_result=clone(command.value);after=state.lottery_result;break;
    case 'event': before=clone(state.event);state.event={...state.event,...command.value};after=state.event;break;
    case 'rules': before=clone(state.rules);state.rules=clone(command.value);after=state.rules;break;
    case 'color': {
      const t=state.teams.find(t=>t.id===command.target);ensure(t,'팀을 찾지 못했습니다.');before=t.color;t.color=clone(command.value);after=t.color;break;
    }
    case 'draw_add': {
      ensure(state.lottery_result||!state.rules.lottery?.automatic_last||!lottery(state).complete,'자동 확정을 포함해 모든 순위가 정해졌습니다. 기존 기록을 정정하세요.');
      const t=state.teams.find(t=>t.id===command.value.team_id);ensure(t,'추첨 팀을 선택하세요.');
      const d={id,team_id:t.id,color:clone(t.color),note:command.value.note||''};before=null;state.draws.push(d);after=d;target=id;break;
    }
    case 'draw_edit': {
      const d=state.draws.find(d=>d.id===command.target),t=state.teams.find(t=>t.id===command.value.team_id);ensure(d&&t,'추첨 기록/팀을 찾지 못했습니다.');
      before=clone(d);Object.assign(d,{team_id:t.id,color:clone(t.color),note:command.value.note||''});after=d;break;
    }
    case 'draw_remove': before=state.draws.find(d=>d.id===command.target);ensure(before,'추첨 기록을 찾지 못했습니다.');state.draws=state.draws.filter(d=>d.id!==command.target);after=null;break;
    case 'draw_move': {
      before=clone(state.draws);const at=state.draws.findIndex(d=>d.id===command.target),to=command.value;
      ensure(at>=0&&Number.isInteger(to)&&to>=0&&to<state.draws.length,'이동 위치 오류');state.draws.splice(to,0,state.draws.splice(at,1)[0]);after=state.draws;break;
    }
    case 'trade_add': {
      before=null;const value=clone(command.value);ensure(['confirmed','pending'].includes(value.status),'신규 거래 상태 오류');
      const t={id,sequence:Math.max(0,...state.trades.map(t=>t.sequence))+1,status:value.status,date:value.date,date_kind:value.date_kind||'transaction',conditions:value.conditions||'',source_url:value.source_url||'',legs:value.legs};
      state.trades.push(t);after=t;target=id;state.trade_review.status=state.trades.some(t=>t.status==='pending')?'pending':'confirmed';break;
    }
    case 'trade_edit': {
      const t=state.trades.find(t=>t.id===command.target);ensure(t&&t.status!=='cancelled','취소된 거래는 수정하지 않고 새 거래를 등록하세요.');
      before=clone(t);const v=command.value;
      ensure(['confirmed','pending'].includes(v.status),'취소는 거래 취소 기능을 이용하세요.');
      Object.assign(t,{status:v.status,date:v.date,date_kind:v.date_kind||'transaction',conditions:v.conditions||'',source_url:v.source_url||'',legs:clone(v.legs)});after=t;
      state.trade_review.status=state.trades.some(t=>t.status==='pending')?'pending':'confirmed';break;
    }
    case 'trade_cancel': {
      const t=state.trades.find(t=>t.id===command.target);ensure(t&&t.status!=='cancelled','취소할 거래가 없습니다.');
      before=clone(state.trades);t.status='cancelled';t.cancel_reason=command.reason;t.cancelled_at=now;
      if(command.cascade===true) {
        const invalidated=new Set(t.legs.map(l=>l.pick_id));
        for(const later of state.trades.filter(x=>x.sequence>t.sequence).sort((a,b)=>a.sequence-b.sequence)){
          if(later.status!=='cancelled'&&later.legs.some(l=>invalidated.has(l.pick_id))){
            later.status='cancelled';later.cancel_reason=`선행 거래 ${t.id} 취소: ${command.reason}`;later.cancelled_at=now;
            later.legs.forEach(l=>invalidated.add(l.pick_id));
          }
        }
      }
      after=state.trades;state.trade_review.status='pending';break;
    }
    case 'trade_review': before=state.trade_review;state.trade_review=clone(command.value);after=state.trade_review;break;
    case 'result': {
      const p=pick();before=clone(p.result);p.result=resultValue(p.result,command.value,ctx,command);after=p.result;break;
    }
    case 'trainee': {
      const group=state.trainees[command.target];ensure(group,'수련선수 팀 오류');before=clone(group);
      if(command.remove_id)group.entries=group.entries.filter(e=>e.id!==command.remove_id);
      else if(command.value.status==='selected') {
        const old=group.entries.find(e=>e.id===command.entry_id);
        if(command.entry_id)ensure(old,'수정할 수련선수를 찾지 못했습니다.');
        const entry={id:old?.id||id,...resultValue(old,command.value,ctx,command)};
        if(old)Object.assign(old,entry);else group.entries.push(entry);
      }else {ensure(group.entries.length===0,'선수가 남아 있습니다. 개별 삭제 후 패스/대기로 바꾸세요.');}
      group.status=group.entries.length?'selected':command.remove_id?'waiting':command.value.status;if(group.status==='not_recorded')group.source_url=command.value.source_url||'';after=group;break;
    }
    default:throw new Error('지원하지 않는 수정입니다.');
  }
  const ownership=owners(state);state.picks.forEach(p=>p.current_team=ownership[p.id]);
  state.revision++;state.updated_at=now;
  state.audit.push({id,revision:state.revision,at:now,actor,action:command.type,target,reason:command.reason,before:clone(before??null),after:clone(after??null)});
  return validate(state);
}
