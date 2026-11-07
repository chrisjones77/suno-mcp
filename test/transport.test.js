'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { LEGACY_TOOLS } = require('../src/offline.js');

test('real MCP stdio lists tools, imports offline, and refuses every live operation', {timeout:10000}, async () => {
  const transport = new StdioClientTransport({command:process.execPath,args:[path.resolve(__dirname,'../src/index.js')],stderr:'pipe'});
  const client = new Client({name:'offline-test',version:'1.0.0'});
  try {
    await client.connect(transport);
    const list=await client.listTools();assert.equal(list.tools.length,8);
    for (const name of LEGACY_TOOLS) {
      const r=await client.callTool({name,arguments:{}});
      assert.equal(r.isError,true);assert.equal(JSON.parse(r.content[0].text).code,'LIVE_OPERATIONS_DISABLED');
    }
    const source={schemaVersion:1,purpose:'finishedSong',status:'preparedForManualHandoff',ready:true,fields:{title:'Synthetic fixture',style:'acoustic',lyrics:'Synthetic test lyric'},draft:{title:'Synthetic fixture'}};
    const r=await client.callTool({name:'suno_prepare_console_export',arguments:{exportJson:JSON.stringify(source)}});
    assert.equal(r.isError,false);const p=JSON.parse(r.content[0].text);
    assert.equal(p.lyrics,source.fields.lyrics);assert.equal(p.inputVerified,false);assert.deepEqual(p.outputs,[]);
    const bad=await client.callTool({name:'suno_prepare_console_export',arguments:{exportJson:'SECRET_SENTINEL'}});
    assert.equal(bad.isError,true);assert.doesNotMatch(JSON.stringify(bad),/SECRET_SENTINEL/);
  } finally { await client.close(); }
});
