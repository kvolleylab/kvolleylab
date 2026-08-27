(()=>{
'use strict';
if(document.body?.dataset.competition!=='gosung-2026')return;

const RULES_URL='https://drive.google.com/file/d/1OhVVPCwMJzwTRklLPbdkWE6TYylYB4nk/view?usp=drivesdk';
const PAMPHLET_URL='';

const ensureStyle=()=>{
  if(document.getElementById('kvl-gosung-source-links-style'))return;
  const style=document.createElement('style');
  style.id='kvl-gosung-source-links-style';
  style.textContent=`
    #sources .cd-sources{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}
    #sources .cd-sources>a,#sources .cd-source-pending{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:58px;padding:14px 16px;border:1px solid #e3e8ee;border-radius:13px;background:#fff;color:#334a64;font-weight:800;text-decoration:none}
    #sources .cd-sources>a:hover{border-color:#d6b25e;background:#fffaf0;color:#17365d}
    #sources .cd-source-pending{border-style:dashed;background:#f8fafc;color:#7b8998;cursor:default}
    #sources .cd-source-pending small{font-size:11px;font-weight:800;color:#94a3b8;white-space:nowrap}
    @media(max-width:620px){#sources .cd-sources{grid-template-columns:1fr}#sources .cd-source-pending{align-items:flex-start;flex-direction:column;gap:4px}}
  `;
  document.head.appendChild(style);
};

const markup=()=>{
  const pamphlet=PAMPHLET_URL
    ?`<a href="${PAMPHLET_URL}" target="_blank" rel="noopener noreferrer">2026 고성대회 팸플릿 PDF 열기 <span>→</span></a>`
    :`<div class="cd-source-pending" aria-disabled="true"><span>2026 고성대회 팸플릿 PDF</span><small>원본 등록 후 연결</small></div>`;
  return `<a href="${RULES_URL}" target="_blank" rel="noopener noreferrer">2026 고성대회 요강 PDF 열기 <span>→</span></a>${pamphlet}`;
};

const apply=()=>{
  const section=document.getElementById('sources');
  const root=document.getElementById('cdSources');
  if(!section||!root)return false;
  ensureStyle();
  section.querySelectorAll(':scope > .cd-rule-card').forEach(el=>el.remove());
  const html=markup();
  if(root.innerHTML!==html)root.innerHTML=html;
  return true;
};

const start=()=>{
  apply();
  const section=document.getElementById('sources');
  if(!section)return;
  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;apply();});
  }).observe(section,{childList:true,subtree:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
