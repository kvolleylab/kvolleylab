// K-Volley Lab · international hub prototype v1 · 2026-11-04
export const CATEGORIES = [
  ['olympic','올림픽'], ['world-championship','세계선수권'], ['vnl','VNL'],
  ['continental','대륙선수권'], ['asian-games','아시안게임'], ['multi-sport','종합경기대회']
];
export function todayKST(now=new Date()) {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function categoryOf(item) {
  const family=String(item.family||'').toLowerCase();
  if(CATEGORIES.some(([key])=>key===family))return family;
  if(['olympics','olympic-games'].includes(family))return 'olympic';
  if(['world','world-championships','wch'].includes(family))return 'world-championship';
  if(family==='games')return /^asian-games(?:-|$)/.test(item.id||'')?'asian-games':'multi-sport';
  return family;
}
export const yearOf=item=>Number(item.year||String(item.startDate||item.endDate||'').slice(0,4));
export const dateSort=(a,b)=>String(b.endDate||'').localeCompare(String(a.endDate||''))||String(b.startDate||'').localeCompare(String(a.startDate||''))||String(a.id).localeCompare(String(b.id));
export function temporalStatus(item,today) {
  if(!item.startDate||!item.endDate)return 'unknown';
  return item.startDate>today?'upcoming':item.endDate<today?'completed':'active';
}
export function selectItems(data,{year=2026,category='',all=false,today=todayKST()}={}) {
  const list=(data.competitions||[]).filter(x=>yearOf(x)===Number(year)&&(!category||categoryOf(x)===category));
  if(all||category)return list.sort(dateSort);
  // recentPolicy remains the source for the cap; future-only events are always excluded.
  const limit=Math.min(3,Math.max(1,Number(data.recentPolicy?.limit)||3));
  return list.filter(x=>x.showInRecent!==false&&x.startDate&&x.endDate&&x.startDate<=today)
    .sort((a,b)=>(temporalStatus(b,today)==='active')-(temporalStatus(a,today)==='active')||dateSort(a,b)).slice(0,limit);
}
// Categories are global; each year's records are filtered independently.
export function groupByYear(data,{category='',selectedYear=2026,today=todayKST()}={}) {
  const years=[...new Set([2026,2025,2024,2023,2022,selectedYear,...(data.competitions||[]).map(yearOf).filter(y=>Number.isInteger(y)&&y>0)])].sort((a,b)=>b-a);
  return years.map(year=>({year,count:(data.competitions||[]).filter(x=>yearOf(x)===year).length,
    items:selectItems(data,{year,category,all:year!==2026,today})}));
}
export function hubUrl(path,{year,category='',all=false}={}) {
  const params=new URLSearchParams();
  if(year!==undefined)params.set('year',year);
  if(all)params.set('view','all');
  if(category)params.set('category',category);
  return path+(params.size?'?'+params:'');
}
export function displayCard(item,detail,today=todayKST()) {
  const phase=temporalStatus(item,today),c={...item.card};
  c.status=({upcoming:'대회 예정',active:'대회 진행 중',completed:'대회 종료',unknown:'일정 확인 중'})[phase];
  if(phase==='upcoming')c.accentStatus='대회 예정';
  else if(detail?.status===phase&&detail.stageLabel)c.accentStatus=detail.stageLabel;
  else if(phase==='completed'&&!/우승|금메달|은메달|동메달|종료|직행/.test(c.accentStatus||''))c.accentStatus='대회 종료';
  else if(phase==='active'&&/우승|금메달|종료/.test(c.accentStatus||''))c.accentStatus='대회 진행 중';
  c.dateLabel=c.dateLabel||[item.startDate,item.endDate].filter(Boolean).join(' ~ ');
  return {...item,card:c};
}
