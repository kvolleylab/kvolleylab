(()=>{
const area=document.getElementById('playerArea');if(!area)return;
let timer=null;
const schoolKey=value=>String(value||'').replace(/\s+/g,'').replace(/대학교사범대학부속/g,'사대부속').replace(/사범대학부속/g,'사대부속').replace(/사범대학부설/g,'사대부설').replace(/체육고등학교$/,'체고').replace(/체육고$/,'체고').replace(/여자고등학교$/,'여고').replace(/여고등학교$/,'여고').replace(/고등학교$/,'고').replace(/중학교$/,'중');
const fullSchool=value=>{const s=String(value||'').trim();if(!s)return'';if(/(고등학교|중학교)$/.test(s))return s;if(/체고$/.test(s))return s.replace(/체고$/,'체육고등학교');if(/체육고$/.test(s))return s.replace(/체육고$/,'체육고등학교');if(/여고$/.test(s))return s.replace(/여고$/,'여자고등학교');if(/고$/.test(s))return `${s}등학교`;if(/중$/.test(s))return `${s}학교`;return s};
const shortSchool=value=>String(value||'').replace(/체육고등학교$/,'체고').replace(/여자고등학교$/,'여고').replace(/고등학교$/,'고').replace(/중학교$/,'중');
const score=value=>{const s=String(value||'');let n=s.length;if(/(고등학교|중학교)$/.test(s))n+=100;if(/체육/.test(s))n+=10;if(/대학교사범대학부속/.test(s))n+=20;return n};
function apply(){
 const history=area.querySelector('.pd-history');if(!history)return;
 const rows=[...history.querySelectorAll('.pd-history-row')];if(!rows.length)return;
 const groups=new Map();
 rows.forEach(row=>{const cells=[...row.querySelectorAll(':scope > span')];const schoolCell=cells[cells.length-1];if(!schoolCell)return;const raw=schoolCell.dataset.rawSchool||schoolCell.textContent.trim();schoolCell.dataset.rawSchool=raw;const key=schoolKey(raw);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(raw)});
 groups.forEach((values,key)=>{const canonical=fullSchool([...new Set(values)].sort((a,b)=>score(b)-score(a))[0]||'');rows.forEach(row=>{const cells=[...row.querySelectorAll(':scope > span')];const schoolCell=cells[cells.length-1];if(!schoolCell||schoolKey(schoolCell.dataset.rawSchool)!==key)return;const mobile=shortSchool(canonical);schoolCell.innerHTML=`<span class="pd-school-full">${canonical}</span><span class="pd-school-short">${mobile}</span>`})});
 rows.sort((a,b)=>{const da=a.querySelector('small')?.textContent.trim()||'';const db=b.querySelector('small')?.textContent.trim()||'';return db.localeCompare(da)}).forEach(row=>history.appendChild(row));
}
const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(apply,0)});observer.observe(area,{childList:true,subtree:true});apply();
})();