// Import a reviewed workbook transcription through the same audited domain commands as the UI.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {applyCommand,validate,rightID,playerSnapshot} from '../../assets/js/draft-board-core.mjs';
import {joinApplicants} from '../../assets/js/draft-applicants-core.mjs';
const ensure=(ok,message)=>{if(!ok)throw new Error(message);};

export function importObserved(input,record,{applicants,actor,now=new Date().toISOString()}={}) {
  validate(input);
  ensure(record.season===input.season&&record.division===input.division,'기록의 시즌/부문 불일치');
  ensure(record.source_id&&/^[a-f0-9]{64}$/.test(record.sha256),'기록 출처/해시 필요');
  ensure(!input.audit.some(a=>a.reason.includes(record.source_id)),'이미 반영된 기록입니다. 정정 명령을 사용하세요.');
  ensure(input.draws.length===0&&input.picks.every(p=>p.result.status==='waiting')&&Object.values(input.trainees).every(g=>g.status==='waiting'&&!g.entries.length),'입력된 현황이 있어 일괄 반영을 중단했습니다. 개별 변경을 대조하세요.');
  ensure(record.colors.length===7&&new Set(record.colors.map(c=>c.team_id)).size===7,'7팀 색상 기록 필요');
  ensure(record.picks.length===28&&new Set(record.picks.map(p=>rightID(record.season,record.division,p.round,p.original_team))).size===28,'28개 고유 원지명권 기록 필요');
  ensure(record.trainees.length===7&&new Set(record.trainees.map(g=>g.team_id)).size===7,'7팀 수련선수 기록 필요');
  let state=structuredClone(input);
  const change=(type,value,target,locator,extra={})=>{
    state=applyCommand(state,{type,value,target,reason:`${record.source_id} · ${locator} · 사용자 제공 기록 반영`,...extra},{actor,now});
  };
  const player=row=>{
    const corrections=(record.corrections||[]).filter(c=>c.locator===row.locator&&c.player===row.name);
    let affiliation=row.affiliation;
    for(const c of corrections){ensure(c.field==='affiliation'&&c.original===affiliation&&c.sources?.length,'검토되지 않은 선수 정정');affiliation=c.corrected;}
    const found=applicants.filter(a=>a.season===record.season&&a.gender===record.division&&a.application_status==='confirmed'&&a.name===row.name&&a.affiliation===affiliation);
    ensure(found.length===1,`${row.locator}: 신청자 신원을 단일하게 확인하지 못했습니다.`);
    ensure(row.position.split('/').every(p=>found[0].positions.includes(p)),`${row.name}: 신청 포지션과 기록 불일치`);
    return {...playerSnapshot(found[0]),affiliation,position:row.position};
  };
  for(const color of record.colors){
    const t=state.teams.find(t=>t.id===color.team_id);
    ensure(t&&t.balls===color.balls&&t.probability===color.probability,'공식 최초 배분과 입력값 불일치');
    ensure(!t.color,'기존 색상 변경은 개별 정정으로 처리하세요.');
    change('color',{name:color.name,hex:color.hex},t.id,color.locator);
  }
  for(const [index,d]of record.draws.entries()){
    ensure(d.sequence===index+1,'추첨 기록의 나온 순서 불일치');
    ensure(state.teams.find(t=>t.id===d.team_id)?.color.name===d.color_name,'추첨 색상과 배정 색상 불일치');
    change('draw_add',{team_id:d.team_id,note:d.note||''},undefined,d.locator);
  }
  for(const row of record.picks){
    const id=rightID(state.season,state.division,row.round,row.original_team),p=state.picks.find(p=>p.id===id);
    ensure(p&&p.current_team===row.actual_team,'실제 팀이 보유팀과 다릅니다. 해당 라운드의 공식 거래부터 대조하세요.');
    if(row.status==='waiting')continue;
    change('result',{status:row.status,actual_team:row.actual_team,player:row.status==='selected'?player(row):null,source_url:''},id,row.locator);
  }
  for(const group of record.trainees){
    if(group.entries.length){
      ensure(group.status==='selected','수련선수 목록과 상태 불일치');
      for(const row of group.entries)change('trainee',{status:'selected',actual_team:group.team_id,player:player(row),source_url:''},group.team_id,row.locator);
    }else if(group.status==='passed'){
      ensure(group.source_cells.some(c=>c.status==='passed'),'명시적 패스 기록이 필요합니다.');
      change('trainee',{status:'passed'},group.team_id,group.source_cells.map(c=>c.locator).join(', '));
    }
  }
  const selected=state.picks.filter(p=>p.result.status==='selected').length;
  const trainees=Object.values(state.trainees).reduce((n,g)=>n+g.entries.length,0);
  const complete=state.picks.every(p=>p.result.status!=='waiting')&&Object.values(state.trainees).every(g=>g.status!=='waiting');
  change('event',{status:complete?'completed':'selecting',note:`${record.event_date} 제공 기록 반영 · 일반 지명 ${selected}명 · 수련선수 ${trainees}명`},undefined,'진행 상태');
  return validate(state);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [statePath,recordPath,outputPath,actor]=process.argv.slice(2);
  ensure(statePath&&recordPath&&outputPath&&actor,'Usage: node import_observed.mjs <current-state> <reviewed-record> <output> <verified-actor>');
  const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
  const record=read(recordPath);
  const applicants=joinApplicants(read(`data/draft-applicants/${record.season}/applicants.json`),read(`data/draft-applicants/${record.season}/player-links.json`));
  const state=importObserved(read(statePath),record,{applicants,actor});
  fs.writeFileSync(outputPath,JSON.stringify(state,null,2)+'\n');
  console.log(JSON.stringify({revision:state.revision,draws:state.draws.length,selected:state.picks.filter(p=>p.result.status==='selected').length,trainees:Object.values(state.trainees).reduce((n,g)=>n+g.entries.length,0),status:state.event.status}));
}
