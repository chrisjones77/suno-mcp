'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {capture,plan,destination,A,B,C,D,T,later}=require('./fixtures/browser-workflow.js');
const root=path.resolve(__dirname,'..');
const run=(args,input)=>spawnSync(process.execPath,['src/browser-workflow.js',...args],{cwd:root,input:input===undefined?undefined:JSON.stringify(input),encoding:'utf8',timeout:10000});
test('offline CLI captures, resumes, reconciles and verifies a synthetic inventory without live tools',t=>{
 const tmp=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'suno-cli-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const dir=path.join(tmp,'captures');let r=run(['capture-init',dir],{schemaVersion:1,workspaceId:'default',workspaceName:'Synthetic',expectedCount:1});assert.equal(r.status,0,r.stderr);
 r=run(['capture-record',dir],capture());assert.equal(r.status,0,r.stderr);
 r=run(['capture-status',dir]);assert.equal(JSON.parse(r.stdout).nextPreviousCaptureId,C);
 r=run(['collect'],{captures:[capture()],options:{workspaceName:'Synthetic',expectedCount:1}});assert.equal(JSON.parse(r.stdout).coverage.status,'incomplete');
 const ledger=path.join(tmp,'moves');r=run(['ledger-init',ledger],plan());const digest=JSON.parse(r.stdout).planSha256;
 r=run(['ledger-record',ledger],{kind:'intent',batchId:C,at:T,planSha256:digest,ids:[A]});assert.equal(r.status,0,r.stderr);
 r=run(['ledger-status',ledger]);assert.equal(JSON.parse(r.stdout).reconcileBeforeAnyRetry.length,1);
 r=run(['verify'],{plan:plan(),ids:[A,B],captures:[destination([A])]});assert.deepEqual(JSON.parse(r.stdout).missing,[B]);
 r=run(['ledger-record',ledger],{kind:'verified',batchId:C,at:later,planSha256:digest,captures:[destination()]});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(r.stdout).verified,[A]);
});
test('CLI rejects apply, publishing, malformed/extra arguments and emits fixed private-safe errors',()=>{
 for(const [args,input] of [[['apply'],{}],[['publish'],{}],[['collect','extra'],{}],[['collect'],{token:'SECRET_SENTINEL'}],[['verify'],{}]]) {
  const r=run(args,input);assert.equal(r.status,1);assert.equal(r.stdout,'');assert.equal(r.stderr,'OFFLINE_BROWSER_WORKFLOW_ERROR\n');
 }
});
test('MCP exposes none of the new live or ledger entrypoints; offline imports perform no network or browser connection',()=>{
 const {tools,callTool}=require('../src/offline.js');
 for(const name of ['suno_capture_browser','suno_apply_moves','suno_verify_destination','suno_record_move','suno_publish','suno_delete']) {
  assert.ok(!tools.some(t=>t.name===name));assert.equal(callTool(name,{}).isError,true);
 }
 const script=`const Module=require('node:module'),load=Module._load;Module._load=function(id,...args){if(/^(node:)?(https?|net|tls|child_process)$/.test(id)||/suno-client|cdp|playwright|puppeteer/.test(id))throw Error('FORBIDDEN');return load.call(this,id,...args)};global.fetch=()=>{throw Error('FORBIDDEN')};for(const file of ['browser-evidence','move-ledger','capture-store','browser-workflow'])require('./src/'+file+'.js');`;
 const r=spawnSync(process.execPath,['-e',script],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
});
