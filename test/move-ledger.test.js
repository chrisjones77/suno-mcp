'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {createState,append,resume,verifyDestination,initLedger,loadLedger,recordEvent}=require('../src/move-ledger.js');
const {initCaptureStore,recordCapture,loadCaptures}=require('../src/capture-store.js');
const {A,B,C,D,T,later,capture,destination,plan}=require('./fixtures/browser-workflow.js');
const intent=s=>({kind:'intent',batchId:C,at:T,planSha256:s.planSha256,ids:[A]});
const submitted=s=>({kind:'submitted',batchId:C,at:T,planSha256:s.planSha256});
const verified=s=>({kind:'verified',batchId:C,at:later,planSha256:s.planSha256,captures:[destination()]});
function temp(t) {const root=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'suno-synthetic-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return path.join(root,'ledger');}
test('restart after intent or submission holds retry; verification can resolve an interrupted submission',()=>{
 let s=createState(plan());assert.deepEqual(resume(s).notAttempted,[A,B]);
 s=append(s,intent(s));assert.deepEqual(resume(JSON.parse(JSON.stringify(s))).reconcileBeforeAnyRetry[0].ids,[A]);
 assert.throws(()=>append(s,{...intent(s),batchId:D}));
 const resolved=append(s,verified(s));assert.deepEqual(resume(resolved).verified,[A]);
 s=append(s,submitted(s));assert.equal(resume(s).mayApply,false);assert.deepEqual(resume(s).verified,[]);
 s=append(s,verified(s));assert.deepEqual(resume(s).verified,[A]);assert.deepEqual(resume(s).coverageIssues,['count_mismatch']);
 assert.throws(()=>append(s,verified(s)));
});
test('changing selection array, caller plan or verification evidence cannot rewrite prior batches',()=>{
 const p=plan();let s=createState(p);const event=intent(s);s=append(s,event);event.ids[0]=B;p.moves[0].recordingId=B;
 assert.deepEqual(s.events[0].ids,[A]);assert.equal(s.plan.moves[0].recordingId,A);
 const v=verified(s);s=append(s,v);v.captures[0].rows[0].id=B;assert.equal(s.events[1].captures[0].rows[0].id,A);
});
test('wrong plan, batch, destination, stale observation and same-title other ID cannot verify',()=>{
 let s=createState(plan());s=append(s,intent(s));
 for(const patch of [{planSha256:'f'.repeat(64)},{batchId:D},{captures:[destination([B])]},{captures:[capture()]},{captures:[destination([A],{observedAt:'2026-11-07T11:59:00.000Z'})]},{captures:[destination([A],{observedAt:'2026-11-07T12:02:00.000Z'})]},{captures:[]}]) assert.throws(()=>append(s,{...verified(s),...patch}));
});
test('partial verification reports missing IDs and unexpected tracks without interpreting titles or release status',()=>{
 const r=verifyDestination(plan(),[A,B],[destination([A,C])]);assert.deepEqual(r.missing,[B]);assert.deepEqual(r.unexpected,[C]);assert.equal(r.accountCoverageComplete,false);
 for(const c of [destination([A],{search:'song'}),destination([A],{hiddenFilterCount:3})])assert.throws(()=>verifyDestination(plan(),[A],[c]));
});
test('multiple windows deduplicate IDs and pass only the expected batch; sibling planned IDs are not unexpected',()=>{
 const r=verifyDestination(plan(),[A],[destination([A,B]),destination([A],{captureId:B})]);assert.deepEqual(r.missing,[]);assert.deepEqual(r.unexpected,[]);assert.equal(r.observedIds.length,2);
});
test('mixed destinations, reused IDs and unknown IDs reject before recording intent',()=>{
 const p=plan();p.moves[1].toWorkspaceId=C;let s=createState(p);
 assert.throws(()=>append(s,{...intent(s),ids:[A,B]}));assert.throws(()=>append(s,{...intent(s),ids:[A,A]}));assert.throws(()=>append(s,{...intent(s),ids:[D]}));
 const bad=plan();bad.moves.push({...bad.moves[0]});assert.throws(()=>createState(bad));
});
test('ledger is persistent, private, immutable and replayed with plan/hash binding',t=>{
 const dir=temp(t);let s=initLedger(dir,plan());s=recordEvent(dir,intent(s));s=recordEvent(dir,submitted(s));s=recordEvent(dir,verified(s));
 assert.deepEqual(resume(loadLedger(dir).state).verified,[A]);assert.equal(fs.statSync(dir).mode&0o777,0o700);assert.equal(fs.statSync(path.join(dir,'000001.json')).mode&0o777,0o600);
 assert.throws(()=>initLedger(dir,plan()));assert.throws(()=>recordEvent(dir,intent(s)));
 const f=path.join(dir,'000001.json'),event=JSON.parse(fs.readFileSync(f));event.event.ids=[B];fs.writeFileSync(f,JSON.stringify(event));assert.throws(()=>loadLedger(dir));
});
test('torn tail, missing sequence, extra file and changed manifest hold recovery rather than reset',t=>{
 for(const mutation of [dir=>fs.writeFileSync(path.join(dir,'000001.json'),'{',{mode:0o600}),dir=>fs.writeFileSync(path.join(dir,'000002.json'),'{}',{mode:0o600}),dir=>fs.writeFileSync(path.join(dir,'unexpected.json'),'{}',{mode:0o600}),dir=>{const f=path.join(dir,'plan.json'),p=JSON.parse(fs.readFileSync(f));p.plan.catalogueRevision='changed';fs.writeFileSync(f,JSON.stringify(p));}]) {const dir=temp(t);initLedger(dir,plan());mutation(dir);assert.throws(()=>loadLedger(dir));}
});
test('symlinks, hard links and broadly readable evidence reject',t=>{
 const dir=temp(t);initLedger(dir,plan());const file=path.join(dir,'plan.json');
 fs.chmodSync(file,0o644);assert.throws(()=>loadLedger(dir));fs.chmodSync(file,0o600);
 fs.linkSync(file,path.join(path.dirname(dir),'hardlink'));assert.throws(()=>loadLedger(dir));fs.unlinkSync(path.join(path.dirname(dir),'hardlink'));
 const link=path.join(path.dirname(dir),'linked');fs.symlinkSync(dir,link);assert.throws(()=>loadLedger(link));
 fs.renameSync(file,path.join(path.dirname(dir),'original'));fs.symlinkSync(path.join(path.dirname(dir),'original'),file);assert.throws(()=>loadLedger(dir));
});
test('concurrent identical event writers commit once; loser cannot silently advance or duplicate',async t=>{
 const dir=temp(t),s=initLedger(dir,plan()),event=intent(s);
 const run=()=>new Promise(resolve=>{const p=spawn(process.execPath,['src/browser-workflow.js','ledger-record',dir],{cwd:path.resolve(__dirname,'..'),stdio:['pipe','ignore','ignore']});p.stdin.end(JSON.stringify(event));p.on('exit',resolve);});
 const statuses=await Promise.all([run(),run()]);assert.deepEqual(statuses.sort(),[0,1]);assert.equal(loadLedger(dir).state.events.length,1);
});
test('capture checkpoint restart is idempotent and rejects stale chain, changed identity or source',t=>{
 const dir=temp(t);initCaptureStore(dir,{schemaVersion:1,workspaceId:'default',workspaceName:'Synthetic',expectedCount:2});
 recordCapture(dir,capture());recordCapture(dir,capture());assert.equal(loadCaptures(dir).captures.length,1);
 assert.throws(()=>recordCapture(dir,capture({page:2})));
 assert.throws(()=>recordCapture(dir,capture({captureId:D})));
 const second=capture({captureId:D,previousCaptureId:C,page:2});recordCapture(dir,second);
 assert.equal(loadCaptures(dir).nextPreviousCaptureId,D);assert.equal(loadCaptures(dir).collection.coverage.status,'incomplete');
 fs.writeFileSync(path.join(dir,'000002.json'),'{');assert.throws(()=>loadCaptures(dir));
});
test('conflicting capture identities cannot verify a batch',()=>{
 assert.throws(()=>verifyDestination(plan(),[A,B],[destination([A]),destination([B])]));
});
test('linked parent rejected before creating any journal',t=>{
 const dir=temp(t),parent=path.dirname(dir),link=parent+'-link';fs.symlinkSync(parent,link);t.after(()=>fs.unlinkSync(link));
 assert.throws(()=>initLedger(path.join(link,'new-ledger'),plan()));assert.equal(fs.existsSync(path.join(parent,'new-ledger')),false);
});
