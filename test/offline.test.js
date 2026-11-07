'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { tools, callTool, LEGACY_TOOLS } = require('../src/offline.js');
const expected = ['suno_get_credits', 'suno_generate_song', 'suno_generate_from_description', 'suno_check_status', 'suno_wait_for_songs', 'suno_get_recent', 'suno_download_song'];
test('all seven migration names remain discoverable with no retired defaults', () => {
  assert.deepEqual(LEGACY_TOOLS, expected);
  assert.deepEqual(tools.filter(t => LEGACY_TOOLS.includes(t.name)).map(t => t.name), expected);
  for (const tool of tools.filter(t => LEGACY_TOOLS.includes(t.name))) {
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.match(tool.description, /disabled/);
    assert.equal(tool.annotations.openWorldHint, false);
  }
  assert.doesNotMatch(JSON.stringify(tools), /chirp|v5 beta/);
});
for (const name of expected) test(`${name} rejects even old or hostile arguments`, () => {
  for (const args of [undefined, {}, { token: 'SECRET_SENTINEL', folder: '/tmp', model: 'chirp-v4' }, new Proxy({}, {get() {throw Error('SECRET_SENTINEL');}})]) {
    const result = callTool(name, args);
    assert.equal(result.isError, true);
    assert.equal(JSON.parse(result.content[0].text).code, 'LIVE_OPERATIONS_DISABLED');
    assert.doesNotMatch(JSON.stringify(result), /SECRET_SENTINEL/);
  }
});
test('unknown tool names are not reflected in errors', () => {
  const r = callTool('SECRET_SENTINEL', {});
  assert.equal(JSON.parse(r.content[0].text).code, 'UNKNOWN_TOOL');
  assert.doesNotMatch(JSON.stringify(r), /SECRET_SENTINEL/);
});
test('entry import and dispatch load no provider, browser, or transport dependency', () => {
  const script = `const Module=require('node:module');const original=Module._load;
    Module._load=function(id,...args){if(/suno-client|cdp|^ws$|^@modelcontextprotocol|^https?$|^net$/.test(id))throw Error('FORBIDDEN_DEPENDENCY');return original.call(this,id,...args)};
    global.fetch=()=>{throw Error('NETWORK_ATTEMPT')};
    const entry=require('./src/index.js');for(const t of entry.tools){if(!entry.callTool(t.name,{}).isError)throw Error('NOT_DISABLED')}`;
  const r = spawnSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8', timeout: 5000 });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '');
});
test('direct client and CDP access are disabled', () => {
  assert.throws(() => new (require('../src/suno-client.js').SunoClient)(), /LIVE_OPERATIONS_DISABLED/);
  assert.throws(() => require('../src/cdp.js'), /LIVE_OPERATIONS_DISABLED/);
});
for (const file of readdirSync(path.join(root, 'scripts')).filter(f => f.endsWith('.js'))) test(`legacy script ${file} cannot run live operations`, () => {
  const r = spawnSync(process.execPath, [path.join('scripts',file), '--generate'], { cwd: root, encoding: 'utf8', timeout: 5000 });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /LIVE_OPERATIONS_DISABLED/);
  assert.equal(r.stdout, '');
});
test('active entry has no provider client wiring', () => {
  assert.doesNotMatch(readFileSync(path.join(root,'src/index.js'),'utf8'), /suno-client|cdp|generateSong|downloadSong/);
});
