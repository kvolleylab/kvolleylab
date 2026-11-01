// Parse archived official HTML into importer input; no MASTER writes.
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require(process.env.KVL_JSDOM_PATH||'jsdom');
const [archive,out]=process.argv.slice(2);if(!archive||!out)throw Error('Usage: node scripts/extract-vnl-women-2026.cjs <unpacked archive> <output directory>');
fs.mkdirSync(out,{recursive:true});
const html=file=>new JSDOM(fs.readFileSync(path.join(archive,file),'utf8')).window.document;
const rows=t=>[...t.querySelectorAll('tbody tr')].map(r=>({code:r.querySelector('.vbw-mu__team__name--abbr')?.textContent.trim(),cells:[...r.querySelectorAll('td')].map(c=>({key:c.className,value:c.textContent.trim()}))}));
const standings=[...html('women-standings.html').querySelectorAll('table')].map(rows);if(standings.length!==2||standings.some(t=>t.length!==18))throw Error('Official standings HTML changed');
fs.writeFileSync(path.join(out,'women-standings-parsed.json'),JSON.stringify(standings));
const teams=JSON.parse(fs.readFileSync(path.join(archive,'vnl-official-2026.json'),'utf8')).allTeams.filter(t=>t.tournamentCode==='WVNL2026');
const rosters=Object.fromEntries(teams.map(t=>{const ps=[...html(t.code+'.html').querySelectorAll('tbody tr')].map(row=>{const cells=[...row.querySelectorAll('td')],a=row.querySelector('td.playername a');if(!a||cells.length<3)return null;return{number:+cells[0].textContent.trim(),en:a.textContent.trim(),position:cells[2].textContent.trim().replace(/^O$/,'OP'),officialPlayerId:a.getAttribute('href').split('/').pop(),officialProfileUrl:'https://en.volleyballworld.com'+a.getAttribute('href')};}).filter(Boolean);if(!ps.length)throw Error('Missing roster '+t.code);return[t.code,ps];}));
fs.writeFileSync(path.join(out,'women-rosters-parsed.json'),JSON.stringify(rosters));
console.log(JSON.stringify({teams:teams.length,players:Object.values(rosters).reduce((n,a)=>n+a.length,0)}));
