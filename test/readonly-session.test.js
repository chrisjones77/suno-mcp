'use strict';
const test=require('node:test'), assert=require('node:assert/strict');
const {createReadOnlySession}=require('../src/readonly-session.js');
const {createServer}=require('../src/index.js');
const {Client}=require('@modelcontextprotocol/sdk/client/index.js');
const {InMemoryTransport}=require('@modelcontextprotocol/sdk/inMemory.js');
const {LEGACY_TOOLS}=require('../src/offline.js');
const {capture,A}=require('./fixtures/browser-workflow.js');
const decode=r=>JSON.parse(r.content[0].text);
function fixture() {
 let reads=0,url='https://suno.com/create?wid=default';
 const c=capture(); const {page,search,hiddenFilterCount,sort,nextEnabled,rows}=c;
 const dom={page,search,hiddenFilterCount,sort,nextEnabled,rows};
 const tab={url:async()=>url,playwright:{evaluate:async()=>{reads++;return dom;}}};
 return {tab,dom,reads:()=>reads,setUrl:s=>url=s,options:{tab,workspaceId:'default',workspaceName:'Synthetic',expiresAt:new Date(Date.now()+60000).toISOString()}};
}
test('real MCP transport captures, checkpoints and reconciles; legacy tools stay disabled',async()=>{
 const f=fixture();f.dom.hiddenFilterCount=3;
 const session=createReadOnlySession(f.options),server=createServer({browserSession:session});
 const client=new Client({name:'test',version:'1'}),[a,b]=InMemoryTransport.createLinkedPair();
 await server.connect(a);await client.connect(b);
 try {
  assert.equal((await client.listTools()).tools.length,12);
  for(const name of LEGACY_TOOLS)assert.equal(decode(await client.callTool({name,arguments:{}})).code,'LIVE_OPERATIONS_DISABLED');
  const r=decode(await client.callTool({name:'suno_browser_capture',arguments:{}}));
  assert.equal(r.coverage.status,'incomplete');assert.equal(r.writeOperationsEnabled,false);assert.equal(r.releaseGatesOpen,true);
  assert.equal(r.inventory.pages[0].records[0].publication,'unknown');
  const cp=decode(await client.callTool({name:'suno_browser_checkpoint',arguments:{}}));assert.equal(cp.evidenceSha256,r.evidenceSha256);
  const out=decode(await client.callTool({name:'suno_browser_reconcile',arguments:{catalogueJson:JSON.stringify({source:'synthetic',revision:'test',recordingIds:[A]})}}));
  assert.equal(out.rows[0].catalogueMatch,true);assert.equal(out.coverage.status,'incomplete');assert.deepEqual(out.appliedMoves,[]);assert.deepEqual(out.proposedMoves,[]);assert.equal(f.reads(),1);
  assert.ok(out.browserCoverage.issues.includes('filtered_observation'));
 } finally {session.close();await client.close();await server.close();}
});
test('expiry after initialization blocks new reads',async t=>{
 const f=fixture(),s=createReadOnlySession(f.options);
 t.mock.method(Date,'now',()=>Date.parse(f.options.expiresAt));
 assert.equal(decode(await s.callTool('suno_browser_capture')).code,'READONLY_SESSION_CLOSED');assert.equal(f.reads(),0);
});
test('unknown tools and arbitrary browser commands cannot reach the tab',async()=>{
 const f=fixture(),s=createReadOnlySession(f.options);
 for(const [name,args] of [['move',{}],['suno_browser_capture',{url:'https://evil.test'}],['suno_browser_capture',{script:'SECRET'}],['suno_browser_reconcile',{}]])assert.equal((await s.callTool(name,args)).isError,true);
 assert.equal(f.reads(),0);assert.equal(decode(await s.callTool('suno_browser_checkpoint')).code,'NO_BROWSER_EVIDENCE');
});
test('wrong origin, changed workspace and expired or revoked sessions fail closed',async()=>{
 const f=fixture(),s=createReadOnlySession(f.options);
 f.setUrl('https://evil.test/create?wid=default');assert.equal(decode(await s.callTool('suno_browser_capture')).code,'READONLY_CONTEXT_CHANGED');assert.equal(f.reads(),0);
 s.close();assert.equal(decode(await s.callTool('suno_browser_capture')).code,'READONLY_SESSION_CLOSED');
 assert.throws(()=>createReadOnlySession({...f.options,expiresAt:'2020-01-01T00:00:00.000Z'}));
 assert.throws(()=>createReadOnlySession({...f.options,expiresAt:new Date(Date.now()+7200000).toISOString()}));
});
test('failure redacts host errors and preserves the previous checkpoint',async()=>{
 const f=fixture(),s=createReadOnlySession(f.options);const first=decode(await s.callTool('suno_browser_capture'));
 f.tab.playwright.evaluate=async()=>{throw Error('SECRET');};
 const failure=await s.callTool('suno_browser_capture');assert.equal(failure.isError,true);assert.doesNotMatch(JSON.stringify(failure),/SECRET/);
 assert.equal(decode(await s.callTool('suno_browser_checkpoint')).evidenceSha256,first.evidenceSha256);
});
test('overlapping requests reject and revocation during a read discards its result',async()=>{
 const f=fixture();let release;f.tab.playwright.evaluate=()=>new Promise(r=>{release=r;});
 const s=createReadOnlySession(f.options),pending=s.callTool('suno_browser_capture');
 await new Promise(setImmediate);assert.equal(decode(await s.callTool('suno_browser_capture')).code,'READONLY_SESSION_BUSY');
 s.close();release(f.dom);assert.equal(decode(await pending).code,'READONLY_SESSION_CLOSED');
});
test('navigation during capture rejects evidence',async()=>{
 const f=fixture(),s=createReadOnlySession(f.options);
 f.tab.playwright.evaluate=async()=>{f.setUrl('https://suno.com/create?wid=other');return f.dom;};
 assert.equal((await s.callTool('suno_browser_capture')).isError,true);
 assert.equal(decode(await s.callTool('suno_browser_checkpoint')).code,'NO_BROWSER_EVIDENCE');
});
