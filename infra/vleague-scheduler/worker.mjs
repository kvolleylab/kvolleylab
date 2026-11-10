import {tick,failureDetails} from './scheduler.mjs';
export class VLeagueCoordinator {
  constructor(ctx,env) { this.ctx=ctx;this.env=env; }
  async fetch(request) {
    if (new URL(request.url).pathname==='/health') {
      return Response.json(await this.ctx.storage.get('health') || {status:'NOT_OBSERVED'});
    }
    const now=Date.now();
    const acquired=await this.ctx.blockConcurrencyWhile(async()=>{
      if ((await this.ctx.storage.get('leaseUntil')||0)>now) return false;
      await this.ctx.storage.put('leaseUntil',now+120000);return true;
    });
    if (!acquired) return Response.json({status:'ALREADY_RUNNING'});
    try {return Response.json(await tick(this.env,this.ctx.storage,now));}
    catch (error) {
      const failure={status:'WATCHDOG_FAILED',checkedAt:new Date(now).toISOString(),...failureDetails(error)};
      await this.ctx.storage.put('health',failure);
      console.error(JSON.stringify(failure));
      throw Error('VLEAGUE_WATCHDOG_FAILED');
    }
    finally {await this.ctx.storage.delete('leaseUntil');}
  }
}
const coordinator=env=>env.COORDINATOR.get(env.COORDINATOR.idFromName('vleague-2026-27'));
export default {
  async scheduled(_event,env,ctx) {ctx.waitUntil(coordinator(env).fetch('https://internal/tick'));},
  async fetch(request,env) {
    // A visitor can inspect health but cannot trigger a GitHub write.
    if(request.method!=='GET'||new URL(request.url).pathname!=='/health')return new Response('Not found',{status:404});
    return coordinator(env).fetch('https://internal/health');
  }
};
