'use strict';
// Offline evidence ledger only: no function selects, moves or retries a clip.
const fs = require('node:fs');
const path = require('node:path');
const {hash,uuid,workspace,time,text,keys,check,validateCapture} = require('./browser-evidence.js');
function validatePlan(plan) {
  keys(plan,['schemaVersion','inventorySha256','catalogueRevision','coverageIssues','moves']);
  check(plan.schemaVersion === 1 && /^[a-f0-9]{64}$/.test(plan.inventorySha256) && text(plan.catalogueRevision) && plan.catalogueRevision.trim());
  check(Array.isArray(plan.coverageIssues) && plan.coverageIssues.length <= 100 && plan.coverageIssues.every(x => text(x)));
  check(Array.isArray(plan.moves) && plan.moves.length > 0 && plan.moves.length <= 10000);
  const ids = new Set();
  for (const m of plan.moves) {
    keys(m,['recordingId','fromWorkspaceId','toWorkspaceId']);
    check(uuid(m.recordingId) && workspace(m.fromWorkspaceId) && workspace(m.toWorkspaceId) && m.fromWorkspaceId !== m.toWorkspaceId && !ids.has(m.recordingId)); ids.add(m.recordingId);
  }
  return structuredClone(plan);
}
function verifyDestination(plan, batch, captures) {
  validatePlan(plan);
  check(Array.isArray(batch) && batch.length > 0 && new Set(batch).size === batch.length);
  const targets = batch.map(id => plan.moves.find(m => m.recordingId === id));
  check(targets.every(Boolean) && new Set(targets.map(m => m.toWorkspaceId)).size === 1);
  check(Array.isArray(captures) && captures.length > 0 && captures.length <= 1000);
  const windows = captures.map(validateCapture), identity = new Map();
  for (const c of windows) {check(!identity.has(c.captureId) || identity.get(c.captureId) === hash(c));identity.set(c.captureId,hash(c));}
  const destination = targets[0].toWorkspaceId;
  check(windows.every(c => c.workspaceId === destination));
  // Verification consumes unfiltered windows. Search observations must first be
  // captured separately and reviewed; they cannot establish the destination set.
  check(windows.every(c => c.search === '' && c.hiddenFilterCount === 0));
  const observed = new Set(windows.flatMap(c => c.rows.map(r => r.id)));
  const allExpected = new Set(plan.moves.filter(m => m.toWorkspaceId === destination).map(m => m.recordingId));
  return {destination,expectedIds:[...batch].sort(),observedIds:[...observed].sort(),
    missing:batch.filter(id => !observed.has(id)).sort(),unexpected:[...observed].filter(id => !allExpected.has(id)).sort(),
    evidenceSha256:hash(windows),coverageIssues:[...plan.coverageIssues],
    accountCoverageComplete:false,liveOperationsEnabled:false};
}
function createState(plan) {
  const copy = validatePlan(plan);
  return {schemaVersion:1,plan:copy,planSha256:hash(copy),events:[]};
}
function reduce(state) {
  const batches = new Map(), used = new Set();
  for (const e of state.events) {
    if(e.kind === 'intent') { batches.set(e.batchId,{ids:e.ids,status:'uncertain',lastAt:e.at});e.ids.forEach(id => used.add(id)); }
    else {const b=batches.get(e.batchId); b.status=e.kind === 'verified' ? 'verified' : 'uncertain';b.lastAt=e.at;}
  }
  return {batches,used};
}
function append(state, event) {
  keys(state,['schemaVersion','plan','planSha256','events']);
  // Replay validates a caller-supplied or persisted state before use.
  let clean = createState(state.plan);
  check(state.schemaVersion === 1 && state.planSha256 === clean.planSha256 && Array.isArray(state.events) && state.events.length <= 30000);
  for (const old of state.events) clean = transition(clean,old);
  return transition(clean,event);
}
function transition(state,event) {
  check(event && ['intent','submitted','verified'].includes(event.kind));
  const names=['kind','batchId','at','planSha256'];
  keys(event,event.kind === 'intent' ? [...names,'ids'] : event.kind === 'verified' ? [...names,'captures'] : names);
  check(uuid(event.batchId) && time(event.at) && event.planSha256 === state.planSha256);
  check(!state.events.length || event.at >= state.events.at(-1).at);
  const {batches,used}=reduce(state), b=batches.get(event.batchId);
  if (event.kind === 'intent') {
    check(!b && Array.isArray(event.ids) && event.ids.length > 0 && event.ids.length <= 10000 && new Set(event.ids).size === event.ids.length);
    const moves=event.ids.map(id => state.plan.moves.find(m => m.recordingId === id));
    check(moves.every(Boolean) && event.ids.every(id => !used.has(id)) && new Set(moves.map(m => m.fromWorkspaceId)).size === 1 && new Set(moves.map(m => m.toWorkspaceId)).size === 1);
  } else {
    check(b && b.status !== 'verified');
    const last=state.events.filter(e => e.batchId === event.batchId).at(-1);
    if(event.kind === 'submitted') check(last.kind === 'intent');
    else {
      check(Array.isArray(event.captures));
      check(event.captures.every(c => c.observedAt >= b.lastAt && c.observedAt <= event.at));
      const v=verifyDestination(state.plan,b.ids,event.captures);
      check(!v.missing.length && !v.unexpected.length);
    }
  }
  // Copy at every boundary: later selection mutations cannot rewrite this batch.
  return {...state,events:[...state.events,structuredClone(event)]};
}
function resume(state) {
  keys(state,['schemaVersion','plan','planSha256','events']);
  check(state.schemaVersion === 1 && Array.isArray(state.events) && state.events.length <= 30000);
  let clean=createState(state.plan);
  check(state.planSha256===clean.planSha256);
  for(const e of state.events) clean=transition(clean,e);
  const {batches,used}=reduce(clean);
  return {planSha256:clean.planSha256,verified:[...batches.values()].filter(b=>b.status==='verified').flatMap(b=>b.ids).sort(),
    reconcileBeforeAnyRetry:[...batches].filter(([,b])=>b.status!=='verified').map(([batchId,b])=>({batchId,ids:b.ids})),
    notAttempted:clean.plan.moves.filter(m=>!used.has(m.recordingId)).map(m=>m.recordingId),
    coverageIssues:clean.plan.coverageIssues,liveOperationsEnabled:false,mayApply:false};
}
const {createPrivateDirectory,privateDirectory,readPrivate,writeExclusive}=require('./evidence-files.js');
function initLedger(dir,plan) {
  const state=createState(plan);
  const root=createPrivateDirectory(dir);writeExclusive(path.join(root,'plan.json'),{schemaVersion:1,plan:state.plan,planSha256:state.planSha256});return state;
}
function loadLedger(dir) {
  const root=privateDirectory(dir), manifest=readPrivate(path.join(root,'plan.json'));
  keys(manifest,['schemaVersion','plan','planSha256']);check(manifest.schemaVersion===1);
  let state=createState(manifest.plan);check(state.planSha256===manifest.planSha256);
  const files=fs.readdirSync(root).filter(n=>n!=='plan.json').sort();
  check(files.length<=30000);
  let previousHash=state.planSha256;
  for(let i=0;i<files.length;i++) {
    check(files[i]===`${String(i+1).padStart(6,'0')}.json`);
    const record=readPrivate(path.join(root,files[i]));keys(record,['sequence','previousHash','event','sha256']);
    check(record.sequence===i+1 && record.previousHash===previousHash && record.sha256===hash([record.sequence,record.previousHash,record.event]));
    state=transition(state,record.event);previousHash=record.sha256;
  }
  return {state,head:previousHash};
}
function recordEvent(dir,event) {
  const root=privateDirectory(dir), {state,head}=loadLedger(root);
  const next=transition(state,event),sequence=next.events.length;
  // Exclusive sequence-file creation is the compare-and-swap for concurrent
  // writers. A partial/torn write holds replay, never triggers an automatic retry.
  writeExclusive(path.join(root,`${String(sequence).padStart(6,'0')}.json`),
    {sequence,previousHash:head,event:next.events.at(-1),sha256:hash([sequence,head,next.events.at(-1)])});
  return next;
}
module.exports={validatePlan,verifyDestination,createState,append,resume,initLedger,loadLedger,recordEvent};
