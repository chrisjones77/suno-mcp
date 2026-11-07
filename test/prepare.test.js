'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { prepare, MAX_BYTES } = require('../src/prepare.js');
const { callTool } = require('../src/offline.js');
function fixture() { return { schemaVersion: 1, purpose: 'finishedSong', status: 'preparedForManualHandoff', ready: true, fields: {title: 'River', style: 'dry 🪕', lyrics: '[Verse]\r\nA river\n  '}, draft: {title: 'River', id: 'draft-1'}, errors: [] }; }
function run(source) { return prepare({exportJson: JSON.stringify(source)}); }
test('exact Unicode, whitespace and line endings survive JSON roundtrip', () => {
  const source = fixture(); const raw = JSON.stringify(source); const p = prepare({exportJson: raw});
  const restored = JSON.parse(JSON.stringify(p));
  for (const k of ['title','lyrics','style']) assert.equal(restored[k], source.fields[k]);
  assert.equal(p.utf16Lengths.style, source.fields.style.length);
  assert.equal(p.exportSha256, createHash('sha256').update(raw).digest('hex'));
  assert.equal(p.upstream.savedRevisionId, null);
  assert.equal(p.upstream.savedRevisionEquivalence, 'unverified');
  assert.equal(p.mode, 'custom'); assert.equal(p.inputVerified, false);
  assert.equal(p.requestedModel, 'unresolved'); assert.equal(p.submissionState,'prepared');
  assert.deepEqual(p.outputs, []);
});
test('byte edits and field edits invalidate identity; repeat import preserves identity', () => {
  const s = fixture(), raw = JSON.stringify(s), p = prepare({exportJson:raw});
  assert.equal(prepare({exportJson:raw}).sourceSha256,p.sourceSha256);
  assert.notEqual(prepare({exportJson:raw+' '}).sourceSha256,p.sourceSha256);
  s.fields.lyrics += '!'; assert.notEqual(run(s).sourceSha256,p.sourceSha256);
});
test('saved revision is retained without claiming saved equivalence', () => {
  const s=fixture();s.draft.revisionId='r2';const p=run(s);
  assert.equal(p.upstream.savedRevisionId,'r2');assert.equal(p.upstream.savedRevisionEquivalence,'unverified');
});
for (const [name, mutate] of [
  ['blocked',s=>s.status='blockedDraft'], ['not ready',s=>s.ready=false],
  ['wrong schema',s=>s.schemaVersion=2], ['wrong purpose',s=>s.purpose='description'],
  ['errors',s=>s.errors=['bad']], ['malformed errors',s=>s.errors={}],
  ['missing draft',s=>delete s.draft], ['title mismatch',s=>s.draft.title='Other'],
  ['empty lyrics',s=>s.fields.lyrics=' '], ['nonstring style',s=>s.fields.style=3],
  ['invalid provenance',s=>s.draft.revisionId={}], ['lone surrogate',s=>s.fields.lyrics='\ud800']
]) test(`reject ${name} without reflecting source or creating a record`, () => {
  const s=fixture();mutate(s);const result=callTool('suno_prepare_console_export',{exportJson:JSON.stringify(s)});
  assert.equal(result.isError,true);assert.deepEqual(Object.keys(JSON.parse(result.content[0].text)),['code']);
});
test('malformed, oversized, extra arguments and requested Simple Mode rejected', () => {
  for (const args of [{exportJson:'SECRET_SENTINEL'}, {exportJson:' '.repeat(MAX_BYTES+1)}, {exportJson:JSON.stringify(fixture()),mode:'simple'}, {}]) {
    const r=callTool('suno_prepare_console_export',args);assert.equal(r.isError,true);assert.doesNotMatch(JSON.stringify(r),/SECRET_SENTINEL/);
  }
});
test('unknown context is never executed or copied into prepared fields', () => {
  const s=fixture();s.token='SECRET_SENTINEL';s.canonicalStyle={url:'http://localhost/execute'};
  const p=run(s);assert.doesNotMatch(JSON.stringify(p),/SECRET_SENTINEL|localhost/);
});

test('export timestamp preserves valid UTC evidence and leaves absence unknown', () => {
  for(const value of [undefined,null,'2026-11-06T12:00:00.000Z']) {
    const s=fixture();s.exportedAt=value;assert.equal(run(s).upstream.exportedAt,value ?? null);
  }
});
test('invalid and calendar-normalized export timestamps are rejected without disclosure', () => {
  for(const value of ['not a date','2026-02-30T12:00:00.000Z','2026-11-06','2026-11-06T25:00:00.000Z']) {
    const s=fixture();s.exportedAt=value;
    const r=callTool('suno_prepare_console_export',{exportJson:JSON.stringify(s)});
    assert.equal(r.isError,true);assert.deepEqual(JSON.parse(r.content[0].text),{code:'INVALID_PROVENANCE'});
  }
});
