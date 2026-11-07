'use strict';
const { createHash } = require('node:crypto');
const { InputError, MAX_BYTES } = require('./prepare.js');
const hash = s => createHash('sha256').update(s).digest('hex');
const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const str = x => typeof x === 'string' && x.length > 0 && x.length <= 1024 && x.isWellFormed();
const id = x => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(x);
function fail() { throw new InputError('INVALID_INVENTORY_INPUT'); }
function keys(x, allowed) { if (!obj(x) || Object.keys(x).some(k => !allowed.includes(k))) fail(); }
function timestamp(x) { return str(x) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x; }
function reconcile(args) {
  keys(args,['inputJson']);
  if (typeof args.inputJson !== 'string' || Buffer.byteLength(args.inputJson,'utf8') > MAX_BYTES || !args.inputJson.isWellFormed()) fail();
  let input; try { input=JSON.parse(args.inputJson); } catch { fail(); }
  keys(input,['schemaVersion','inventory','catalogue','destinationWorkspaceId']);
  if(input.schemaVersion!==1) fail();
  const {inventory: inv,catalogue: cat,destinationWorkspaceId: dest}=input;
  keys(inv,['source','observedAt','workspaces','pages','expectedCount']);
  keys(cat,['source','revision','recordingIds']);
  if(!str(inv.source)||!timestamp(inv.observedAt)||!str(cat.source)||!str(cat.revision)||!Array.isArray(cat.recordingIds)||cat.recordingIds.length>10000||!cat.recordingIds.every(id))fail();
  if(!Array.isArray(inv.workspaces)||inv.workspaces.length>1000||!Array.isArray(inv.pages)||inv.pages.length>500)fail();
  if(inv.expectedCount!==null&&(!Number.isSafeInteger(inv.expectedCount)||inv.expectedCount<0||inv.expectedCount>10000))fail();
  const workspaces=new Set();
  for(const w of inv.workspaces){keys(w,['id','name']);if(!str(w.id)||!str(w.name)||workspaces.has(w.id))fail();workspaces.add(w.id);}
  if(dest!==null&&(!str(dest)||!workspaces.has(dest)))fail();
  const releases=new Set(cat.recordingIds), records=new Map(), coverageIssues=[];
  let expectedCursor=null, count=0, chainEnded=false;
  const seenCursors=new Set();
  if(!inv.pages.length)coverageIssues.push('no_pages');
  for(const page of inv.pages){
    keys(page,['cursor','nextCursor','status','records']);
    if(![null].includes(page.cursor)&&!str(page.cursor))fail();
    if(page.nextCursor!==null&&!str(page.nextCursor))fail();
    if(!['ok','failed'].includes(page.status)||!Array.isArray(page.records))fail();
    if(seenCursors.has(page.cursor))coverageIssues.push('repeated_cursor');
    if(chainEnded||page.cursor!==expectedCursor)coverageIssues.push('broken_cursor_chain');
    seenCursors.add(page.cursor);expectedCursor=page.nextCursor;chainEnded=page.nextCursor===null;
    if(page.status==='failed'){coverageIssues.push('failed_page');if(page.records.length)fail();}
    for(const r of page.records){
      if(++count>10000)fail();
      keys(r,['id','title','workspaceId','publication']);
      if(!id(r.id)||(r.title!==null&&!str(r.title))||(r.workspaceId!==null&&!workspaces.has(r.workspaceId))||!['public','private','unknown'].includes(r.publication))fail();
      if(!records.has(r.id))records.set(r.id,[]);
      records.get(r.id).push({...r});
    }
  }
  if(!chainEnded)coverageIssues.push('unfinished_cursor_chain');
  if(inv.expectedCount===null)coverageIssues.push('expected_count_unknown');
  else if(inv.expectedCount!==records.size)coverageIssues.push('count_mismatch');
  const issues=[...new Set(coverageIssues)];
  const inputSha256=hash(args.inputJson), rows=[], proposedMoves=[];
  for(const [recordingId,observations] of [...records.entries()].sort(([a],[b])=>a.localeCompare(b))){
    const titles=[...new Set(observations.map(r=>r.title))];
    const locations=[...new Set(observations.map(r=>r.workspaceId))];
    const publications=[...new Set(observations.map(r=>r.publication))];
    const conflicts=[];
    if(locations.length>1)conflicts.push('workspace_conflict');
    if(publications.includes('public')&&publications.includes('private'))conflicts.push('publication_conflict');
    const publication=conflicts.includes('publication_conflict')?'unknown':publications.includes('public')?'public':publications.includes('private')?'private':'unknown';
    const catalogued=releases.has(recordingId);
    const classification=catalogued?(publication==='public'?'catalogued_and_public':'catalogued_release'):(publication==='public'?'public_on_suno':'unclassified');
    const reasons=[];
    if(issues.length)reasons.push('inventory_coverage_unresolved');
    reasons.push(...conflicts);
    if(locations.includes(null))reasons.push('workspace_unknown');
    if(dest===null)reasons.push('destination_not_selected');
    if(classification==='unclassified')reasons.push('release_status_unknown');
    if(locations.length===1&&locations[0]===dest)reasons.push('already_in_destination');
    rows.push({id:recordingId,titles,observations,publication,catalogueMatch:catalogued,classification,
      listeningVerdict:'unassessed',conflicts,moveHoldReasons:reasons});
    if(!reasons.length)proposedMoves.push({recordingId,fromWorkspaceId:locations[0],toWorkspaceId:dest,
      reason:classification,preconditions:{inputSha256,catalogueRevision:cat.revision,observedAt:inv.observedAt,
        expectedWorkspaceId:locations[0],expectedPublication:publication,requireFreshLiveVerification:true}});
  }
  return {schemaVersion:1,mode:'dry_run',inputSha256,planId:`sha256:${inputSha256}`,
    provenance:{inventorySource:inv.source,observedAt:inv.observedAt,catalogueSource:cat.source,catalogueRevision:cat.revision},
    coverage:{status:issues.length?'incomplete':'declared_complete',liveVerified:false,issues,
      suppliedRows:count,uniqueRecordings:records.size,duplicateRows:count-records.size,expectedCount:inv.expectedCount},
    rows,catalogueIdsAbsentFromInventory:[...releases].filter(x=>!records.has(x)).sort(),proposedMoves,
    appliedMoves:[],requiresHumanReview:true,liveOperationsEnabled:false};
}
module.exports={reconcile};
