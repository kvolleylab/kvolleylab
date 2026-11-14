// Reproducible single HTML. Embedded data are generated read-only fallback snapshots, never a manual database.
const fs=require('node:fs'),path=require('node:path');
const dir=__dirname,root=path.resolve(dir,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const source={};for(const gender of ['men','women']){
 const slug=`v-league-${gender}-2026-27`,data=JSON.parse(read(`data/competitions/${slug}/data.json`)),config=JSON.parse(read(`data/competitions/${slug}/config.json`));
 source[gender]={data,config:{slug:config.slug,structure:{calendarDisplay:config.structure.calendarDisplay}}};
}
const values={FONT:read('assets/css/pretendard-global.css'),NAV_CSS:read('assets/css/kvl-global-sidebar-v1.css'),SUBMENU_CSS:read('assets/css/kvl-global-sidebar-submenus.css'),MATRIX_CSS:read('prototypes/vleague-matrix-v3/matrix.css'),NAV_JS:read('assets/js/kvl-global-sidebar-v1.js'),CORE_JS:read('prototypes/vleague-matrix-v3/core.js'),APP_JS:read('prototypes/vleague-matrix-v3/app.js'),SNAPSHOT:JSON.stringify(source).replace(/</g,'\\u003c')};
let html=read('prototypes/vleague-matrix-v3/page.html');for(const [k,v]of Object.entries(values))html=html.replace(`/*__${k}__*/`,()=>v);
const dest=process.argv[2]||path.join(dir,'index.html');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,html);console.log(`Built ${dest} (${Buffer.byteLength(html)} bytes)`);
