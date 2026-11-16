export const TEAM_LEVELS={professional:'프로',university:'대학',high_school:'고교',middle_school:'중학',national:'대표팀 연결',international:'국제',domestic:'기타 국내'};
export const TEAM_LEVEL_ORDER=['professional','university','high_school','middle_school','national','international','domestic'];
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function playerAffiliation(player){
 const name=(player.level==='professional'?(player.team||player.school):(player.school||player.team))||'';
 const sourceKey=player.schoolKey||((player.level==='professional'?'team:':'name:')+name);
 return{name,key:sourceKey};
}
export function groupPlayerTeams(players){
 const map=new Map();
 for(const p of players){
  const aff=playerAffiliation(p);if(!aff.name)continue;
  const level=p.level||'domestic',gender=p.gender||'M',groupKey=[level,gender,aff.key].join('|');
  if(!map.has(groupKey))map.set(groupKey,{groupKey,sourceKey:aff.key,name:aff.name,level,gender,players:[]});
  map.get(groupKey).players.push(p);
 }
 return [...map.values()].map(team=>{
  const heights=team.players.map(p=>Number(p.height)||0).filter(Boolean);
  const positions={};for(const p of team.players){const pos=String(p.position||p.rawPosition||'미확인').split(/[\/,+]/)[0]||'미확인';positions[pos]=(positions[pos]||0)+1}
  const seasons=[...new Set(team.players.map(p=>String(p.season||'')).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ko'));
  const avgHeight=heights.length?heights.reduce((a,b)=>a+b,0)/heights.length:0;
  team.players=[...team.players].sort((a,b)=>(Number(a.jersey)||999)-(Number(b.jersey)||999)||(a.nameKo||'').localeCompare(b.nameKo||'','ko'));
  return{...team,playerCount:team.players.length,avgHeight,positions,seasons};
 }).sort((a,b)=>(TEAM_LEVEL_ORDER.indexOf(a.level)-TEAM_LEVEL_ORDER.indexOf(b.level))||a.gender.localeCompare(b.gender)||a.name.localeCompare(b.name,'ko'));
}
export function teamHref(team){
 const q=new URLSearchParams({level:team.level,gender:team.gender,key:team.sourceKey});
 return 'team-detail.html?'+q.toString();
}
export function teamLabel(team){return [TEAM_LEVELS[team.level]||team.level,team.gender==='W'?'여자':'남자'].join(' · ')}
