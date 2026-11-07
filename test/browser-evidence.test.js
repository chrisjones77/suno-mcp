'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {captureVisible,collect,validateCapture}=require('../src/browser-evidence.js');
const {reconcile}=require('../src/inventory.js');
const {A,B,C,D,T,capture}=require('./fixtures/browser-workflow.js');
const opts={workspaceName:'Synthetic workspace',expectedCount:2};
test('duplicate windows deduplicate capture identity, not recording observations or titles',()=>{
 const first=capture(),second=capture({captureId:D,previousCaptureId:C,rows:[...first.rows,{...first.rows[0],id:B}]});
 const result=collect([first,second,first],opts);
 assert.equal(result.coverage.uniqueRecordings,2);assert.equal(result.coverage.duplicateCaptures,1);
 assert.equal(result.inventory.pages[1].records.length,2);assert.equal(result.captures.length,2);
 const f={schemaVersion:1,inventory:result.inventory,catalogue:{source:'synthetic',revision:'v1',recordingIds:[A]},destinationWorkspaceId:null};
 const reconciliation=reconcile({inputJson:JSON.stringify(f)});
 assert.equal(reconciliation.rows[0].catalogueMatch,true);assert.equal(reconciliation.rows[1].catalogueMatch,false);
 assert.equal(reconciliation.rows[1].publication,'unknown');assert.equal(reconciliation.coverage.status,'incomplete');
 assert.deepEqual(reconciliation.proposedMoves,[]);
});
test('Publish button is not private or released evidence; Unpublish is public',()=>{
 const c=capture();c.rows.push({...c.rows[0],id:B,buttons:['Unpublish clip']});
 assert.deepEqual(collect([c],opts).inventory.pages[0].records.map(r=>r.publication),['unknown','public']);
});
test('matching count and disabled Next never prove full coverage',()=>{
 const result=collect([capture({nextEnabled:false})],{...opts,expectedCount:1});
 assert.equal(result.coverage.status,'incomplete');assert.deepEqual(result.coverage.issues,['rendered_windows_only']);
 assert.notEqual(result.inventory.pages[0].nextCursor,null);
});
test('repeated page and lazy loading retain evidence; gaps, filters and count changes remain open',()=>{
 const c=capture({page:3,search:'synthetic',hiddenFilterCount:1,previousCaptureId:D});
 const r=collect([c],opts);for(const issue of ['page_gap','filtered_observation','broken_capture_chain','count_mismatch','ambiguous_terminal_next'])assert.ok(r.coverage.issues.includes(issue));
});
test('sort and clock changes are explicit rather than silently merged',()=>{
 const c=capture({captureId:D,previousCaptureId:C,sort:'Old',observedAt:T});
 const r=collect([capture(),c],opts);assert.ok(r.coverage.issues.includes('sort_changed'));assert.ok(r.coverage.issues.includes('nonmonotonic_time'));
});
test('capture identity collisions, workspace drift and credentials in URL reject',()=>{
 assert.throws(()=>collect([capture(),capture({page:2})],opts));
 assert.throws(()=>collect([capture(),capture({captureId:D,workspaceId:B,url:`https://suno.com/create?wid=${B}`})],opts));
 for(const patch of [{url:'https://suno.com/create?wid=default&token=SECRET'},{token:'SECRET'},{observedAt:'2026-02-30T12:00:00.000Z'},{rows:[{id:'same-title'}]},{hiddenFilterCount:null}])assert.throws(()=>validateCapture(capture(patch)));
});
function fakeDocument() {
 const attr=(map)=>({getAttribute:k=>map[k]??null});
 const anchor={...attr({href:`/song/${A}`}),textContent:'Synthetic song'};
 const group={innerText:'2:00\nSynthetic song',querySelector:()=>anchor,querySelectorAll:()=>[{innerText:'Publish',getAttribute:()=> 'Publish clip'}]};
 return {querySelector:s=>({'input[aria-label="Current page number"]':{value:'1'},'input[aria-label="Search clips"]':{value:''},'button[aria-label="Next page"]':{disabled:false}}[s]||null),
 querySelectorAll:s=>s==='[role="group"]'?[group,{querySelector:()=>null}]:s==='[role="combobox"]'?['Filters','New'].map(textContent=>({textContent,getAttribute:()=>null})):[]};
}
test('host adapter only reads URL and visible DOM, excludes placeholders, executes no action',async()=>{
 const calls=[];const tab={url:async()=>{calls.push('url');return 'https://suno.com/create?wid=default';},playwright:{evaluate:async fn=>{calls.push('evaluate');return vm.runInNewContext(`(${fn.toString()})()`,{document:fakeDocument()});}}};
 const result=await captureVisible(tab,{captureId:C,observedAt:T});assert.equal(result.rows.length,1);assert.equal(result.rows[0].id,A);assert.equal(result.nextEnabled,true);assert.deepEqual(calls,['url','evaluate','url']);
});
test('missing controls or navigation while reading reject instead of producing an empty complete snapshot',async()=>{
 let count=0;const tab={url:async()=>++count===1?'https://suno.com/create?wid=default':`https://suno.com/create?wid=${D}`,playwright:{evaluate:async()=>({})}};
 await assert.rejects(captureVisible(tab,{captureId:C,observedAt:T}));
 tab.url=async()=> 'https://suno.com/create?wid=default';await assert.rejects(captureVisible(tab,{captureId:C,observedAt:T}));
});
test('contradictory publication controls stay unknown',()=>{
 const c=capture();c.rows[0].buttons=['Publish clip','Unpublish clip'];assert.equal(collect([c],opts).inventory.pages[0].records[0].publication,'unknown');
});
test('collector output stays inside the existing reconciler page and observation limits',()=>{
 const id=n=>`${n.toString(16).padStart(8,'0')}-0000-4000-8000-000000000000`;
 const windows=Array.from({length:501},(_,i)=>capture({captureId:id(i+1),previousCaptureId:i?id(i):null,rows:[]}));
 assert.throws(()=>collect(windows,opts));
 const rows=Array.from({length:1000},()=>capture().rows[0]);
 assert.throws(()=>collect(windows.slice(0,11).map(c=>({...c,rows})),opts));
});
test('blank captured titles become unknown rather than incompatible reconciliation input',()=>{
 const c=capture();c.rows[0].title='  ';
 const result=collect([c],opts);assert.equal(result.inventory.pages[0].records[0].title,null);
 assert.doesNotThrow(()=>reconcile({inputJson:JSON.stringify({schemaVersion:1,inventory:result.inventory,catalogue:{source:'synthetic',revision:'v1',recordingIds:[]},destinationWorkspaceId:null})}));
});
