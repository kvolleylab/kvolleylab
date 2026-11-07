// External wake-up + independent public-data watchdog. Never writes match data.
export const REPO = 'kvolleylab/kvolleylab';
export const WORKFLOW = 'vleague-auto-update-v1.yml';
export const START = Date.parse('2026-10-31T00:00:00+09:00');
export const END = Date.parse('2027-04-30T00:00:00+09:00');
const MINUTE = 60000;
const API = `https://api.github.com/repos/${REPO}`;
const SITE = 'https://kvolleylab.com';
export function inWindow(now) {
  if (now < START || now >= END) return false;
  const kst = new Date(now + 9 * 60 * MINUTE), hour = kst.getUTCHours(), minute = kst.getUTCMinutes();
  return (hour >= 12 && hour < 24) || (hour === 9 && minute >= 17 && minute < 22);
}
export function publisherRun(run) {
  return run.head_branch === 'main' && (run.event === 'schedule' ||
    (run.event === 'workflow_dispatch' && run.display_title === 'V-League live publisher'));
}
export function publicHealth(feeds, now) {
  const day = new Date(now + 9 * 60 * MINUTE).toISOString().slice(0, 10), problems = [];
  for (const [index, feed] of feeds.entries()) {
    if (!Array.isArray(feed?.matches) || feed.matches.length < 126) throw Error('PUBLIC_FEED_INVALID');
    for (const m of feed.matches) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date||'') || m.date > day || m.notRequired === true || !/^\d{2}:\d{2}$/.test(m.time || '') || ['final','cancelled','postponed','not_required'].includes(m.status)) continue;
      const start = Date.parse(`${m.date}T${m.time}:00+09:00`);
      if (now < start) continue;
      const observed = Date.parse(m.status==='live' ? m.liveScore?.observedAt || '' : '');
      // A scheduled fixture has no live observation. Allow 30 minutes from start.
      const baseline = Math.max(start, Number.isFinite(observed) && observed <= now + MINUTE ? observed : start);
      if (now - baseline >= 30 * MINUTE) problems.push({gender:index===0?'men':'women',matchId:m.id,
        reason:m.status==='live'?'LIVE_OBSERVATION_STALE':'STARTED_MATCH_UNOBSERVED',
        observedAt:Number.isFinite(observed)&&observed<=now+MINUTE?new Date(observed).toISOString():null});
    }
  }
  return problems;
}
async function requestJSON(url, options, fetcher) {
  const response = await fetcher(url, {...options, redirect:'error', signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw Error(`HTTP_${response.status}`);
  return response.status === 204 ? null : response.json();
}
export async function tick(env, storage, now=Date.now(), fetcher=fetch) {
  if (env.KVL_SCHEDULER_APPROVED !== 'true' || !inWindow(now)) return {status:'INACTIVE'};
  if (!env.GITHUB_TOKEN) throw Error('GITHUB_CREDENTIAL_NOT_CONFIGURED');
  const headers = {Authorization:`Bearer ${env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28','User-Agent':'KVL-VLeague-Scheduler','Content-Type':'application/json'};
  const gh = (path, options={}) => requestJSON(API+path,{...options,headers},fetcher);
  const runs = (await gh(`/actions/workflows/${WORKFLOW}/runs?branch=main&per_page=50`)).workflow_runs;
  if (!Array.isArray(runs)) throw Error('RUN_LIST_INVALID');
  const publishers = runs.filter(publisherRun).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
  let problems = [], feedVerified = false;
  try {
    const feeds = await Promise.all(['men','women'].map(g=>requestJSON(`${SITE}/data/competitions/v-league-${g}-2026-27/data.json?kvlWatch=${Math.floor(now/MINUTE)}`,{cache:'no-store'},fetcher)));
    problems = publicHealth(feeds,now); feedVerified = true;
  } catch { problems = [{reason:'PUBLIC_FEED_UNAVAILABLE'}]; }
  const latest = publishers[0];
  if (latest && latest.status === 'completed' && latest.conclusion && !['success','skipped'].includes(latest.conclusion)) problems.push({reason:'PUBLISHER_FAILED',runId:latest.id});
  const lastDispatch = await storage.get('lastDispatch') || 0;
  const lastRun = latest ? Date.parse(latest.created_at) : 0;
  // All publishers share the existing GitHub concurrency key. Do not cancel one
  // in flight; a hung run is an alert, never permission to overlap MASTER writes.
  const kstDay=new Date(now+9*60*MINUTE).toISOString().slice(0,10);
  const windowStart=Date.parse(kstDay+'T12:00:00+09:00');
  if(now>=windowStart&&now-Math.max(lastRun,windowStart)>=30*MINUTE)problems.push({reason:'PUBLISHER_SCHEDULE_GAP'});
  const running = publishers.find(r=>r.status!=='completed');
  if (running && now-Date.parse(running.created_at)>=30*MINUTE) problems.push({reason:'PUBLISHER_STUCK',runId:running.id});
  let dispatched = false;
  if (!running && now-Math.max(lastDispatch,lastRun)>=15*MINUTE) {
    // Write intent first. An ambiguous HTTP timeout waits one interval instead
    // of duplicating an already accepted dispatch. Next tick checks actual runs.
    await storage.put('lastDispatch',now);
    try {
      await gh(`/actions/workflows/${WORKFLOW}/dispatches`,{method:'POST',body:JSON.stringify({ref:'main',inputs:{publish:true,match_only:true}})});
      dispatched=true;
    } catch { problems.push({reason:'DISPATCH_NOT_CONFIRMED'}); }
  }
  let previous = await storage.get('incident'),pending=await storage.get('pendingIncident');
  const alert = problems.length>0;
  if(env.KVL_NOTIFICATIONS_APPROVED==='true'&&pending){
    const marker=`<!-- kvl-vleague-watch:${pending.id}:${pending.open?'open':'recovered'} -->`;
    const comments=await gh('/issues/257/comments?per_page=100&since='+encodeURIComponent(new Date(Date.parse(pending.id)-MINUTE).toISOString()));
    if(comments.some(c=>c.body?.includes(marker))){await storage.put('incident',pending);previous=pending;await storage.delete('pendingIncident');pending=null;}
    else if(pending.open!==alert){await storage.delete('pendingIncident');pending=null;}
  }
  const recovering = !alert && previous?.open && feedVerified;
  let notified=false;
  if (env.KVL_NOTIFICATIONS_APPROVED==='true' && ((alert&&!previous?.open)||recovering)) {
    const incident = pending?.open===alert?pending:(alert?{open:true,id:new Date(now).toISOString()}: {...previous,open:false});
    await storage.put('pendingIncident',incident);
    const marker = `<!-- kvl-vleague-watch:${incident.id}:${alert?'open':'recovered'} -->`;
    // Readback handles a comment accepted before the last request timed out.
    const comments=await gh('/issues/257/comments?per_page=100&since='+encodeURIComponent(new Date(Date.parse(incident.id)-MINUTE).toISOString()));
    if (!comments.some(c=>c.body?.includes(marker))) {
      const stamp=new Date(now+9*60*MINUTE).toISOString().slice(0,16).replace('T',' ');
      const body=marker+'\n'+(alert?'### V-리그 갱신 장애 감지':'### V-리그 공개 데이터 지연 해소')+'\n\n'+stamp+' KST\n\n'+
        (alert?problems.map(p=>'- '+p.reason+(p.matchId?' · '+p.matchId:'')+(p.runId?` · https://github.com/${REPO}/actions/runs/${p.runId}`:'')).join('\n'):
        '남녀 공개 피드의 지연 조건이 해소되었습니다. 실제 경기 중 두 차례 화면 검증 완료를 의미하지 않습니다.')+
        '\n\n공식 API·MASTER 쓰기는 기존 승인된 GitHub publisher만 수행합니다.';
      await gh('/issues/257/comments',{method:'POST',body:JSON.stringify({body})});
    }
    await storage.put('incident',incident);await storage.delete('pendingIncident');notified=true;
  }
  const result={status:alert?'DEGRADED':'CHECKED',checkedAt:new Date(now).toISOString(),dispatched,notified,problems};
  await storage.put('health',result);return result;
}
