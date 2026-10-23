export const LEVELS={middle_school:'중학',high_school:'고교',university:'대학',international:'국제',national:'대표팀',domestic:'국내'};
export function searchPlayers(players,f={}){
 const words=(f.q||'').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const grades=(Array.isArray(f.grades)?f.grades:f.grade?[f.grade]:[]).map(String).filter(Boolean);
 return players.filter(p=>{
  const hay=[p.id,p.name,p.nameEn,p.code,p.team,p.school,p.schoolCode,p.birthDate,p.nationality,p.rawPosition,LEVELS[p.level]].join(' ').toLocaleLowerCase();
  return words.every(w=>hay.includes(w))&&(!f.level||p.level===f.level)&&(!f.gender||p.gender===f.gender)&&(!f.position||p.rawPosition.split(/[/,+]/).includes(f.position))&&(!f.school||p.school===f.school)&&(!grades.length||grades.includes(String(p.grade)))&&(!f.draft||p.draftEligible)&&(!f.type||(f.type==='international'?p.level==='international':p.level!=='international'));
 });
}
export function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
