'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { renderReport } = require('../src/report.js');
const { reconcile } = require('../src/inventory.js');
const fixture = () => structuredClone(require('../examples/inventory.synthetic.json'));
const cli = input => spawnSync(process.execPath, [path.join(__dirname,'../src/organize.js'),'--json'], {input, encoding:'utf8'});
test('report escapes malicious metadata and retains unknowns and evidence', () => {
  const f = fixture(); f.inventory.pages[0].records[0].title = '<script>alert("x")</script>&';
  const html = renderReport(JSON.stringify(f));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  for (const text of ['unclassified','unknown','declared_complete','No live verification','default','released','requireFreshLiveVerification']) assert.ok(html.includes(text));
});
test('incomplete reports hold all proposals', () => {
  const f = fixture(); f.inventory.expectedCount = null;
  const html = renderReport(JSON.stringify(f));
  assert.ok(html.includes('Proposed moves (0)'));
  assert.ok(html.includes('expected_count_unknown'));
});
test('CLI preserves exact input identity and existing reconciliation result', () => {
  const input = JSON.stringify(fixture(), null, 2);
  const result = cli(input); assert.equal(result.status,0); assert.equal(result.stderr,'');
  assert.deepEqual(JSON.parse(result.stdout),reconcile({inputJson:input}));
});
test('CLI rejects malformed inputs without echoing private content or partial output', () => {
  for (const input of ['SECRET_SENTINEL',Buffer.from([0xff]),Buffer.alloc(10*1024*1024+1,32)]) {
    const result = cli(input); assert.equal(result.status,1); assert.equal(result.stdout,'');
    assert.equal(result.stderr,'INVALID_INVENTORY_INPUT\n');
  }
});
test('HTML CLI renders without MCP or provider startup', () => {
  const r = spawnSync(process.execPath,[path.join(__dirname,'../src/organize.js'),'--html'],{input:JSON.stringify(fixture()),encoding:'utf8'});
  assert.equal(r.status,0); assert.equal(r.stderr,''); assert.ok(r.stdout.startsWith('<!doctype html>'));
});
