'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const shared='assets/js/kvl-supabase-browser-v1.mjs';
const consumers=[
 'assets/js/member-login-v1.mjs',
 'assets/js/member-session-v1.mjs',
 'assets/js/member-access-gate-v1.mjs',
 'assets/js/team-roster-member-summary-v1.mjs'
];

test('browser auth modules share exactly one Supabase client module',()=>{
 const singleton=read(shared);
 assert.match(singleton,/Symbol\.for\('kvl\.supabase\.browser\.client\.v1'\)/);
 assert.match(singleton,/persistSession:true/);
 assert.match(singleton,/autoRefreshToken:true/);
 assert.equal((singleton.match(/createClient\(/g)||[]).length,1,'shared module creates the browser client once');
 for(const file of consumers){
  const body=read(file);
  assert.match(body,/kvl-supabase-browser-v1\.mjs\?v=20261124-auth-singleton-v1/,file);
  assert.doesNotMatch(body,/supabase-js-2\.84\.0\.mjs/,file+' must not import the vendor auth client directly');
  assert.doesNotMatch(body,/createClient\(/,file+' must not create another GoTrue client');
 }
});

test('teams and login bust old auth module caches',()=>{
 const nav=read('assets/js/unified-nav.js');
 const teams=read('teams.html');
 const login=read('member-login.html');
 assert.match(nav,/member-session-v1\.mjs\?v=20261124-auth-singleton-v1/);
 assert.match(nav,/member-access-gate-v1\.mjs\?v=20261124-auth-singleton-v1/);
 assert.match(teams,/unified-nav\.js\?v=20261124-auth-singleton-v1/);
 assert.match(teams,/team-roster-member-summary-v1\.mjs\?v=20261124-auth-singleton-v1/);
 assert.match(login,/member-login-v1\.mjs\?v=20261124-auth-singleton-v1/);
});
