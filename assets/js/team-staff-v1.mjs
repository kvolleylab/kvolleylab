const PRO_STAFF_URL='data/master/team_staff_vleague_2026_27_v1.json?v=20261117-1';
const UNIVERSITY_STAFF_URL='data/master/university_staff_2026.json';
let cache=null;
async function load(){
 if(cache)return cache;
 cache=Promise.all([
  fetch(PRO_STAFF_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}).catch(()=>({teams:{}})),
  fetch(UNIVERSITY_STAFF_URL,{cache:'no-store'}).then(r=>r.ok?r.json():{teams:{}}).catch(()=>({teams:{}}))
 ]).then(([pro,university])=>({pro:pro.teams||{},university:university.teams||{}}));
 return cache;
}
export async function attachTeamStaff(teams){
 const data=await load();
 const uniByName=new Map(Object.values(data.university).map(v=>[v.school_name,v]));
 for(const team of teams){
  const pro=data.pro[team.name];
  const uni=uniByName.get(team.name);
  team.staff=pro?{headCoach:pro.head_coach||'',source:pro.source||''}:uni?{headCoach:uni.head_coach||'',source:''}:{headCoach:'',source:''};
 }
 return teams;
}
