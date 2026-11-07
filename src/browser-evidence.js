'use strict';
// No browser connection is created here. A host may supply an already-authorized
// CUA tab for this single, read-only visible-DOM capture.
const { createHash } = require('node:crypto');
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid = x => typeof x === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(x);
const workspace = x => x === 'default' || uuid(x);
const text = (x, max = 1024) => typeof x === 'string' && x.length <= max && x.isWellFormed();
const time = x => text(x) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x;
function check(ok) { if (!ok) throw Error('INVALID_BROWSER_EVIDENCE'); }
function keys(x, names) { check(x && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).length === names.length && Object.keys(x).every(k => names.includes(k))); }
function validateCapture(c) {
  keys(c, ['schemaVersion','captureId','previousCaptureId','observedAt','workspaceId','url','page','search','hiddenFilterCount','sort','nextEnabled','rows']);
  check(c.schemaVersion === 1 && uuid(c.captureId) && (c.previousCaptureId === null || uuid(c.previousCaptureId)) && time(c.observedAt) && workspace(c.workspaceId));
  check(c.url === `https://suno.com/create?wid=${c.workspaceId}`);
  check(Number.isSafeInteger(c.page) && c.page > 0 && c.page <= 10000 && text(c.search) && Number.isInteger(c.hiddenFilterCount) && c.hiddenFilterCount >= 0 && c.hiddenFilterCount <= 3);
  check(['New','Old'].includes(c.sort) && typeof c.nextEnabled === 'boolean' && Array.isArray(c.rows) && c.rows.length <= 1000);
  for (const r of c.rows) {
    keys(r,['id','title','display','buttons']);
    check(uuid(r.id) && (r.title === null || text(r.title)) && text(r.display,16384) && Array.isArray(r.buttons) && r.buttons.length <= 40 && r.buttons.every(b => text(b)));
  }
  return structuredClone(c);
}
async function captureVisible(tab, {captureId, previousCaptureId = null, observedAt}) {
  const url = await tab.url();
  const match = /^https:\/\/suno\.com\/create\?wid=(default|[a-f0-9-]+)$/.exec(url);
  check(match && workspace(match[1]));
  const dom = await tab.playwright.evaluate(() => {
    const input = name => document.querySelector(`input[aria-label="${name}"]`) || Array.from(document.querySelectorAll('input')).find(e => e.getAttribute('placeholder') === name);
    const page = input('Current page number');
    // Search is identified from its rendered accessible name/placeholder only.
    const search = input('Search clips') || input('Search');
    const combos = Array.from(document.querySelectorAll('[role="combobox"]')).map(e => (e.getAttribute('aria-label') || e.textContent).trim());
    const filter = combos.find(s => /^Filters(?: \([0-3]\))?$/.test(s));
    const sort = combos.find(s => ['New','Old'].includes(s));
    const next = document.querySelector('button[aria-label="Next page"]');
    const rows = Array.from(document.querySelectorAll('[role="group"]')).flatMap(g => {
      const a = g.querySelector('a[href^="/song/"]');
      if (!a) return []; // virtualized placeholders are not recordings
      return [{id:a.getAttribute('href').slice(6), title:a.textContent.trim() || null, display:g.innerText,
        buttons:Array.from(g.querySelectorAll('button')).map(b => b.getAttribute('aria-label') || b.innerText)}];
    });
    return {page:page ? Number(page.value) : null, search:search ? search.value : null,
      hiddenFilterCount:filter ? Number(/\((\d)\)/.exec(filter)?.[1] || 0) : null,
      sort:sort || null, nextEnabled:next ? !next.disabled : null, rows};
  });
  check(await tab.url() === url); // navigation during capture invalidates context
  return validateCapture({schemaVersion:1,captureId,previousCaptureId,observedAt,workspaceId:match[1],url,...dom});
}
function collect(captures, {workspaceName, expectedCount = null}) {
  check(Array.isArray(captures) && captures.length > 0 && captures.length <= 1000 && text(workspaceName) && workspaceName.trim());
  check(expectedCount === null || (Number.isSafeInteger(expectedCount) && expectedCount >= 0 && expectedCount <= 10000));
  const unique = new Map(), issues = new Set(['rendered_windows_only']);
  let duplicateCaptures = 0;
  for (const raw of captures) {
    const c = validateCapture(raw), prior = unique.get(c.captureId);
    if (prior) { check(hash(prior) === hash(c)); duplicateCaptures++; }
    else unique.set(c.captureId,c);
  }
  const windows = [...unique.values()], first = windows[0];
  let previous = null, previousTime = null;
  const ids = new Set(), pages = new Set();
  for (const c of windows) {
    check(c.workspaceId === first.workspaceId);
    if (c.previousCaptureId !== previous) issues.add('broken_capture_chain');
    if (previousTime && c.observedAt < previousTime) issues.add('nonmonotonic_time');
    previous = c.captureId; previousTime = c.observedAt;
    if (c.search || c.hiddenFilterCount) issues.add('filtered_observation');
    if (c.sort !== first.sort) issues.add('sort_changed');
    pages.add(c.page); c.rows.forEach(r => ids.add(r.id));
  }
  check(ids.size <= 10000);
  const orderedPages = [...pages].sort((a,b) => a-b);
  if (orderedPages.some((p,i) => p !== i+1)) issues.add('page_gap');
  if (windows.at(-1).nextEnabled) issues.add('ambiguous_terminal_next');
  if (expectedCount === null) issues.add('expected_count_unknown');
  else if (ids.size !== expectedCount) issues.add('count_mismatch');
  // A rendered window, even with disabled Next and a matching count, is not an
  // atomic full-page export. Never synthesize a completed reconciliation cursor.
  const inventory = {source:'Browser-visible DOM capture v1', observedAt:windows.at(-1).observedAt,
    workspaces:[{id:first.workspaceId,name:workspaceName}], expectedCount,
    pages:windows.map((c,i) => ({cursor:i ? windows[i-1].captureId : null,nextCursor:c.captureId,status:'ok',
      records:c.rows.map(r => ({id:r.id,title:r.title,workspaceId:c.workspaceId,
        publication:r.buttons.includes('Unpublish clip') && !r.buttons.includes('Publish clip') ? 'public' : 'unknown'}))}))};
  return {schemaVersion:1, inventory, captures:windows, evidenceSha256:hash(windows),
    coverage:{status:'incomplete',issues:[...issues].sort(),uniqueRecordings:ids.size,duplicateCaptures},liveOperationsEnabled:false};
}
module.exports = {captureVisible, validateCapture, collect, hash, uuid, workspace, time, text, keys, check};
