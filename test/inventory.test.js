'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {reconcile}=require('../src/inventory.js');
const {callTool}=require('../src/offline.js');
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
function fixture(){return {schemaVersion:1,inventory:{source:'synthetic owner snapshot',observedAt:'2026-11-06T12:00:00.000Z',workspaces:[{id:'default',name:'My Workspace'},{id:'released',name:'Released'}],expectedCount:2,pages:[{cursor:null,nextCursor:null,status:'ok',records:[{id:A,title:'Same title',workspaceId:'default',publication:'private'},{id:B,title:'Same title',workspaceId:'default',publication:'unknown'}]}]},catalogue:{source:'synthetic released catalogue',revision:'commit-1',recordingIds:[A,C]},destinationWorkspaceId:'released'};}
const run=x=>reconcile({inputJson:JSON.stringify(x)});
test('exact IDs, not identical titles; absent IDs and private unknowns remain unresolved',()=>{
 const p=run(fixture());assert.equal(p.rows[0].classification,'catalogued_release');assert.equal(p.rows[1].classification,'unclassified');
 assert.deepEqual(p.catalogueIdsAbsentFromInventory,[C]);assert.equal(p.proposedMoves.length,1);assert.equal(p.proposedMoves[0].recordingId,A);
 assert.deepEqual(p.appliedMoves,[]);assert.equal(p.coverage.liveVerified,false);assert.equal(p.coverage.status,'declared_complete');
 assert.equal(p.proposedMoves[0].preconditions.requireFreshLiveVerification,true);assert.equal(p.liveOperationsEnabled,false);
});
test('public on Suno is distinct from catalogued; both is explicit',()=>{
 const f=fixture();f.inventory.pages[0].records.forEach(r=>r.publication='public');const p=run(f);
 assert.deepEqual(p.rows.map(r=>r.classification),['catalogued_and_public','public_on_suno']);assert.equal(p.proposedMoves.length,2);
});
test('duplicate rows consolidate exact identity without losing observations',()=>{
 const f=fixture();f.inventory.pages[0].records.push({...f.inventory.pages[0].records[0]});const p=run(f);
 assert.equal(p.coverage.duplicateRows,1);assert.equal(p.rows[0].observations.length,2);assert.equal(p.proposedMoves.length,1);
});
for(const [label,change,issue] of [
 ['failed page',f=>{f.inventory.pages.push({cursor:'next',nextCursor:null,status:'failed',records:[]});f.inventory.pages[0].nextCursor='next';},'failed_page'],
 ['unfinished',f=>f.inventory.pages[0].nextCursor='next','unfinished_cursor_chain'],
 ['repeated cursor',f=>f.inventory.pages.push({...f.inventory.pages[0],records:[]}),'repeated_cursor'],
 ['broken chain',f=>f.inventory.pages[0].cursor='missing','broken_cursor_chain'],
 ['missing total',f=>f.inventory.expectedCount=null,'expected_count_unknown'],
 ['changed total',f=>f.inventory.expectedCount=3,'count_mismatch'],
 ['no pages',f=>f.inventory.pages=[],'no_pages']
])test(`${label} holds all move proposals`,()=>{const f=fixture();change(f);const p=run(f);assert.equal(p.coverage.status,'incomplete');assert.ok(p.coverage.issues.includes(issue));assert.deepEqual(p.proposedMoves,[]);});
test('valid cursor chain combines pages',()=>{
 const f=fixture(), second=f.inventory.pages[0].records.pop();f.inventory.pages[0].nextCursor='p2';f.inventory.pages.push({cursor:'p2',nextCursor:null,status:'ok',records:[second]});assert.equal(run(f).coverage.status,'declared_complete');
});
for(const [label,change] of [
 ['publication conflict',r=>r.publication='public'],['workspace conflict',r=>r.workspaceId='released'],['unknown location',r=>r.workspaceId=null]
])test(`${label} preserves evidence and holds affected recording`,()=>{
 const f=fixture(),r={...f.inventory.pages[0].records[0]};change(r);f.inventory.pages[0].records.push(r);const p=run(f);
 assert.equal(p.rows[0].observations.length,2);assert.equal(p.rows[0].catalogueMatch,true);assert.deepEqual(p.proposedMoves,[]);
});
test('unknown observation remains unknown in aggregate without discarding known evidence',()=>{
 const f=fixture();f.inventory.pages[0].records.push({...f.inventory.pages[0].records[0],publication:'unknown'});const p=run(f);assert.equal(p.rows[0].publication,'unknown');assert.equal(p.rows[0].observations.length,2);assert.equal(p.rows[0].observations[0].publication,'private');assert.equal(p.rows[0].classification,'catalogued_release');
});
test('no destination and already placed recordings produce no move',()=>{
 const f=fixture();f.destinationWorkspaceId=null;assert.deepEqual(run(f).proposedMoves,[]);f.destinationWorkspaceId='default';assert.deepEqual(run(f).proposedMoves,[]);
});
test('input, destination and catalogue revision changes bind distinct plan identities',()=>{
 const f=fixture(),p=run(f);assert.equal(run(f).planId,p.planId);f.catalogue.revision='commit-2';assert.notEqual(run(f).planId,p.planId);f.destinationWorkspaceId=null;assert.notEqual(run(f).inputSha256,p.inputSha256);
});
for(const [label,change] of [
 ['malformed ID',f=>f.inventory.pages[0].records[0].id='River'],
 ['URL in ID',f=>f.catalogue.recordingIds=['https://suno.com/song/'+A]],
 ['unknown destination',f=>f.destinationWorkspaceId='invented'],
 ['unknown workspace',f=>f.inventory.pages[0].records[0].workspaceId='invented'],
 ['invalid publication',f=>f.inventory.pages[0].records[0].publication=true],
 ['missing revision',f=>delete f.catalogue.revision],
 ['invalid timestamp',f=>f.inventory.observedAt='2026-02-30T12:00:00.000Z'],
 ['extra fields',f=>f.inventory.token='SECRET_SENTINEL'],
 ['duplicate workspace',f=>f.inventory.workspaces.push(f.inventory.workspaces[0])],
 ['failed page with data',f=>f.inventory.pages[0].status='failed']
])test(`reject ${label} with fixed error`,()=>{const f=fixture();change(f);const p=callTool('suno_reconcile_inventory',{inputJson:JSON.stringify(f)});assert.equal(p.isError,true);assert.equal(JSON.parse(p.content[0].text).code,'INVALID_INVENTORY_INPUT');assert.doesNotMatch(JSON.stringify(p),/SECRET_SENTINEL/);});
test('bounded input, no argument reflection, and immutable caller object',()=>{
 for(const args of [{inputJson:'SECRET_SENTINEL'},{inputJson:' '.repeat(10*1024*1024+1)},{inputJson:JSON.stringify(fixture()),apply:true}]){const r=callTool('suno_reconcile_inventory',args);assert.equal(r.isError,true);assert.doesNotMatch(JSON.stringify(r),/SECRET_SENTINEL/);}
 const f=fixture(),before=JSON.stringify(f);run(f);assert.equal(JSON.stringify(f),before);
 assert.equal(callTool('suno_apply_moves',{}).isError,true);
});

test('public plus unknown cannot authorize a proposal based only on public status, in either order',()=>{
 for(const reverse of [false,true]) {
  const f=fixture();f.catalogue.recordingIds=[];
  const r=f.inventory.pages[0].records[0];r.publication='public';
  f.inventory.pages[0].records.push({...r,publication:'unknown'});
  if(reverse)f.inventory.pages[0].records.reverse();
  const p=run(f);assert.equal(p.rows[0].publication,'unknown');assert.equal(p.rows[0].classification,'unclassified');assert.deepEqual(p.proposedMoves,[]);
 }
});
test('blank provenance and workspace identifiers are invalid',()=>{
 for(const change of [f=>f.inventory.source=' ', f=>f.catalogue.revision='\t', f=>f.inventory.workspaces[0].id=' ']) {
  const f=fixture();change(f);assert.throws(()=>run(f),/INVALID_INVENTORY_INPUT/);
 }
});

test('plan identity binds reconciliation semantics, not only source bytes',()=>{
 const p=run(fixture());assert.equal(p.reconciliationVersion,'offline-reconcile-v2');
 assert.notEqual(p.planId,`sha256:${p.inputSha256}`);
 const expected=require('node:crypto').createHash('sha256').update(JSON.stringify([p.reconciliationVersion,p.inputSha256])).digest('hex');
 assert.equal(p.planId,`sha256:${expected}`);
});
