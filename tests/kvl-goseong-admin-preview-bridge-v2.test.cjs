/* Standalone static gate for admin-to-real-Engine preview handoff.
 * Run: node tests/kvl-goseong-admin-preview-bridge-v2.test.cjs
 */
const fs=require("node:fs");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const admin=read("admin-competition-layout-test.html");
const editor=read("prototypes/kvl-existing-competition-editor-v2.html");
const preview=read("prototypes/kvl-goseong-engine-compare-v1.html");
const compareJS=read("assets/js/kvl-goseong-layout-compare-v1.js");
let assertions=0;
function check(x,label){assert.ok(x,label);assertions++;}
function inspectHTML(source,pattern){const m=source.match(pattern);assert(m,"inline script missing");new Function(m[1]);assertions++;}
check(admin.includes('id="enginePreviewBtn"'),"admin opens real-engine preview");
check(admin.includes("api.exportEffectiveChanges()"),"admin sends edited design-only tokens");
check(admin.includes("event.origin!==location.origin"),"admin validates message origin");
check(admin.includes("event.source!==preview"),"admin verifies preview window");
check(admin.includes("kvl-goseong-preview-ready"),"admin handshake");
check(!admin.includes("service_role"),"service-role key not in admin browser code");
check(editor.includes("api.exportEffectiveChanges"),"v2 editor adds safe effective design export");
check(editor.includes("return cleanTokens({...state.overrides.global"),"no raw HTML/CSS/state escape");
check(preview.includes("data-kvl-render-state"),"iframe waits for actual Engine ready state");
check(preview.includes("event.source!==window.opener"),"preview validates opener");
check(preview.includes("kvl-goseong-layout-tokens-v1"),"preview accepts whitelisted tokens");
check(preview.includes("window.KVLGoseongCompareV1.normalize"),"preview never accepts arbitrary CSS");
check(preview.includes("MutationObserver(check)"),"preview waits for async Engine load");
inspectHTML(editor,/<script>([\s\S]*?)<\/script>\s*<\/body>/);
inspectHTML(preview,/<script>([\s\S]*?)<\/script>\s*<\/body>/);
const adminModule=admin.match(/<script type="module">([\s\S]*?)<\/script>/);
assert(adminModule,"admin module missing");
new Function(adminModule[1].replace(/^import\s+\{createClient\}[^\n]*\n/m,""));assertions++;
const context={module:{exports:{}}};vm.runInNewContext(compareJS,context,{filename:"goseong-layout.js"});
const api=context.module.exports;
check(api.normalize({nameMode:"two",logoSize:46,winX:3}).logoSize===46,"validated design draft accepted");
assert.throws(()=>api.normalize({customCss:"h1{display:none}"}),/unknown_token/);assertions++;
const comp=JSON.parse(read("data/competitions/university-goseong-men-2026/config.json"));
const data=JSON.parse(read("data/competitions/university-goseong-men-2026/data.json"));
check(comp.slug==="university-goseong-men-2026"&&data.status==="completed","right completed competition");
check(data.participants.length===15&&data.matches.length===35,"competition data preserved");
console.log("PASS",assertions,"admin->Engine preview bridge static assertions");
