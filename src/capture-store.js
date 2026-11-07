'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {check,keys,workspace,text,validateCapture,hash,collect,MAX_CAPTURES}=require('./browser-evidence.js');
const {createPrivateDirectory,privateDirectory,readPrivate,writeExclusive}=require('./evidence-files.js');
function validateConfig(config) {
  keys(config,['schemaVersion','workspaceId','workspaceName','expectedCount']);
  check(config.schemaVersion===1 && workspace(config.workspaceId) && text(config.workspaceName) && config.workspaceName.trim());
  check(config.expectedCount===null || (Number.isSafeInteger(config.expectedCount) && config.expectedCount>=0 && config.expectedCount<=10000));
}
function initCaptureStore(dir,config) {
  validateConfig(config);const root=createPrivateDirectory(dir);
  writeExclusive(path.join(root,'capture-config.json'),config);
  return {captures:0,nextPreviousCaptureId:null,liveOperationsEnabled:false};
}
function loadCaptures(dir) {
  const root=privateDirectory(dir),config=readPrivate(path.join(root,'capture-config.json'));validateConfig(config);
  const files=fs.readdirSync(root).filter(n=>n!=='capture-config.json').sort();check(files.length<=MAX_CAPTURES);
  const captures=[];let previousHash=hash(config);
  for(let i=0;i<files.length;i++) {
    check(files[i]===`${String(i+1).padStart(6,'0')}.json`);
    const entry=readPrivate(path.join(root,files[i]));keys(entry,['previousHash','capture','sha256']);
    check(entry.previousHash===previousHash && entry.sha256===hash([previousHash,entry.capture]));
    const c=validateCapture(entry.capture);
    check(c.workspaceId===config.workspaceId && c.previousCaptureId===(captures.at(-1)?.captureId || null) && !captures.some(x=>x.captureId===c.captureId));
    captures.push(c);previousHash=entry.sha256;
  }
  return {config,captures,head:previousHash,nextPreviousCaptureId:captures.at(-1)?.captureId || null,
    collection:captures.length?collect(captures,config):null,liveOperationsEnabled:false};
}
function recordCapture(dir,raw) {
  const root=privateDirectory(dir),current=loadCaptures(root),c=validateCapture(raw);
  const prior=current.captures.find(x=>x.captureId===c.captureId);
  if(prior) {check(hash(prior)===hash(c));return current;} // idempotent exact replay
  check(current.captures.length<MAX_CAPTURES && c.workspaceId===current.config.workspaceId && c.previousCaptureId===current.nextPreviousCaptureId);
  // Validate the whole prospective collection before creating a durable entry.
  collect([...current.captures,c],current.config);
  writeExclusive(path.join(root,`${String(current.captures.length+1).padStart(6,'0')}.json`),
    {previousHash:current.head,capture:c,sha256:hash([current.head,c])});
  return loadCaptures(root);
}
module.exports={initCaptureStore,loadCaptures,recordCapture};
