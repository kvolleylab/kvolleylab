/* node --test tests/kvl-admin-layout-drafts-v3.test.mjs */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {
  cleanTokens,normalizeScope,fromEditorScope,toEditorOverrides,
  revisionValue,validSlug
} from '../supabase/functions/_shared/kvl-layout-tokens-v1.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=p=>readFileSync(resolve(root,p),'utf8');

test('draft token whitelist accepts layout-only fields',()=>{
  assert.deepEqual(cleanTokens({logoSize:48,winX:-3,nameMode:'two',heroColor:'#AABBCC'}),{
    logoSize:48,winX:-3,nameMode:'two',heroColor:'#aabbcc'
  });
  assert.throws(()=>cleanTokens({logoSize:200}),/invalid_token/);
  assert.throws(()=>cleanTokens({nameMode:'<script>'}),/invalid_token/);
  assert.throws(()=>cleanTokens({heroColor:'red;display:none'}),/invalid_token/);
  assert.throws(()=>cleanTokens({customCSS:'*{display:none}'}),/unknown_token/);
  assert.throws(()=>cleanTokens({logoSize:'48'}),/invalid_token/);
});
test('scope cannot be widened or confused by malformed keys',()=>{
  assert.deepEqual(normalizeScope('competition','university-goseong-men-2026'),{
    scope:'competition',scopeKey:'university-goseong-men-2026'
  });
  assert.deepEqual(fromEditorScope('international','anything'),{scope:'family',scopeKey:'international'});
  assert.deepEqual(fromEditorScope('all','any'),{scope:'all',scopeKey:'all'});
  assert.equal(validSlug('../../bad'),false);
  assert.throws(()=>normalizeScope('all','another'),/invalid_scope/);
  assert.throws(()=>normalizeScope('family','../../bad'),/invalid_scope/);
  assert.throws(()=>normalizeScope('competition',''),/invalid_scope/);
});
test('imports independent draft scopes without touching match/team data',()=>{
  const d=toEditorOverrides([
    {scope:'all',scope_key:'all',tokens:{logoSize:36}},
    {scope:'family',scope_key:'domestic',tokens:{logoSize:44}},
    {scope:'competition',scope_key:'university-goseong-men-2026',tokens:{logoSize:55,nameMode:'two'}}
  ]);
  assert.equal(d.global.logoSize,36);
  assert.equal(d.families.domestic.logoSize,44);
  assert.equal(d.competitions['university-goseong-men-2026'].logoSize,55);
  assert.equal(JSON.stringify(d).includes('matches'),false);
  assert.equal(JSON.stringify(d).includes('participants'),false);
  assert.throws(()=>toEditorOverrides([{scope:'competition',scope_key:'../../bad',tokens:{}}]),/invalid_scope/);
});
test('optimistic revisions are required for every save/restore',()=>{
  assert.equal(revisionValue(null),null);
  assert.equal(revisionValue(3),3);
  assert.throws(()=>revisionValue(undefined),/invalid_revision/);
  assert.throws(()=>revisionValue(0),/invalid_revision/);
  assert.throws(()=>revisionValue('3'),/invalid_revision/);
});
test('function is admin-only, draft-only; no production publishing call',()=>{
  const fn=source('supabase/functions/admin-competition-layout-drafts/index.ts');
  assert.match(fn,/auth\.getUser/);
  assert.match(fn,/kvl_admin_private\.admin_accounts/);
  assert.match(fn,/active=true/);
  assert.match(fn,/for update/);
  assert.match(fn,/revision_conflict/);
  assert.match(fn,/publish_available:false/);
  assert.doesNotMatch(fn,/(?:create_pull_request|github\.com\/repos|deploy_to_production)/);
});
test('editor iframe uses the same source data without writing scores',()=>{
  const page=source('admin-competition-layout-v3.html');
  assert.match(page,/KVLExistingEditorV2/);
  assert.match(page,/current scope|현재 범위/);
  assert.match(page,/saveBtn/);
  assert.match(page,/getSession/);
  assert.match(page,/signInWithPassword/);
  assert.match(page,/same origin|같은 사이트/);
  assert.doesNotMatch(page,/service_role|SUPABASE_DB_URL/);
});
