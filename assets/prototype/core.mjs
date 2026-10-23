// Demo state only. This is not authentication or an authorization boundary.
export const STATUSES=['관심','직접관찰완료','재확인필요','추적중','보류'];
export const LEVELS={middle_school:'중학',high_school:'고교',university:'대학',international:'국제',national:'대표팀',domestic:'국내'};
export const emptyState=()=>({version:1,accounts:{a:{saves:{},notes:[]},b:{saves:{},notes:[]}}});
export function account(state,who){if(!['a','b'].includes(who))throw new Error('회원 체험 화면에서 사용할 수 있습니다.');return state.accounts[who]}
export function searchPlayers(players,f={}){
 const words=(f.q||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const grades=(Array.isArray(f.grades)?f.grades:f.grade?[f.grade]:[]).map(String).filter(Boolean);
 return players.filter(p=>{
  const hay=[p.id,p.name,p.nameEn,p.code,p.team,p.school,p.schoolCode,p.birthDate,p.nationality,p.rawPosition,LEVELS[p.level]].join(' ').toLocaleLowerCase();
  return words.every(w=>hay.includes(w))&&(!f.level||p.level===f.level)&&(!f.gender||p.gender===f.gender)&&(!f.position||p.rawPosition.split(/[/,+]/).includes(f.position))&&(!f.school||p.school===f.school)&&(!grades.length||grades.includes(String(p.grade)))&&(!f.draft||p.draftEligible)&&(!f.type||(f.type==='international'?p.level==='international':p.level!=='international'));
 });
}
export function toggleSave(state,who,id){const a=account(state,who);if(a.saves[id]){delete a.saves[id];return false}a.saves[id]={playerId:id,status:'관심',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};return true}
export function setStatus(state,who,id,status){const a=account(state,who);if(!STATUSES.includes(status)||!a.saves[id])throw new Error('추적 선수와 상태를 확인하세요.');a.saves[id].status=status;a.saves[id].updatedAt=new Date().toISOString()}
function validDate(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;const dt=new Date(`${d}T12:00:00Z`);return !isNaN(dt)&&dt.toISOString().slice(0,10)===d}
export function saveNote(state,who,fields){
 const a=account(state,who);const memo=String(fields.memo||'').trim(),event=String(fields.event||'').trim(),next=String(fields.next||'').trim();
 if(!fields.playerId||!validDate(fields.observedAt)||!memo)throw new Error('관찰일과 메모를 입력하세요.');
 if(memo.length>2000||event.length>100||next.length>300)throw new Error('입력 가능한 글자 수를 확인하세요.');
 const now=new Date().toISOString();const old=fields.id?a.notes.find(n=>n.id===fields.id&&n.playerId===fields.playerId):null;
 if(fields.id&&!old)throw new Error('이 체험 계정의 메모를 찾을 수 없습니다.');
 if(old){Object.assign(old,{observedAt:fields.observedAt,memo,event,next,updatedAt:now});return old}
 const note={id:globalThis.crypto.randomUUID(),playerId:fields.playerId,observedAt:fields.observedAt,memo,event,next,createdAt:now,updatedAt:now};a.notes.push(note);return note;
}
export function deleteNote(state,who,id){const a=account(state,who);const i=a.notes.findIndex(n=>n.id===id);if(i<0)throw new Error('이 체험 계정의 메모를 찾을 수 없습니다.');return a.notes.splice(i,1)[0]}
export function restoreNote(state,who,note){const a=account(state,who);if(!a.notes.some(n=>n.id===note.id))a.notes.push(note)}
export function notesFor(state,who,id){return [...account(state,who).notes].filter(n=>!id||n.playerId===id).sort((a,b)=>b.observedAt.localeCompare(a.observedAt)||b.updatedAt.localeCompare(a.updatedAt))}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
