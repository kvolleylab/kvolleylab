import {getMemberAccess,safeReturnPath} from './kvl-member-access-v1.mjs';

const GATE_MODE='preview'; // switch to 'enforced' only after general-member onboarding is approved.
const GATED_PATHS=new Set([
  'players.html','player.html','teams.html','university-teams.html','university-team.html',
  'draft-hub.html','player-compare.html','player-cohort.html','records.html'
]);
const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
if(GATED_PATHS.has(path)){
  const previewForced=new URLSearchParams(location.search).get('memberGate')==='1';
  const enforce=GATE_MODE==='enforced'||previewForced;
  try{
    const status=await getMemberAccess();
    document.documentElement.dataset.kvlMemberRole=status.role||'guest';
    document.documentElement.dataset.kvlMemberAccess=status.access?'granted':'guest';
    window.dispatchEvent(new CustomEvent('kvl:member-access',{detail:status}));
    if(enforce&&!status.access){
      const target=safeReturnPath(location.pathname.split('/').pop()+location.search+location.hash);
      location.replace('member-login.html?return='+encodeURIComponent(target)+(previewForced?'&preview=1':''));
    }
  }catch(err){
    document.documentElement.dataset.kvlMemberRole='error';
    window.dispatchEvent(new CustomEvent('kvl:member-access',{detail:{ok:false,access:false,role:'error',error:err.message}}));
    if(enforce)location.replace('member-login.html?return='+encodeURIComponent(safeReturnPath(location.pathname.split('/').pop()+location.search+location.hash)));
  }
}
