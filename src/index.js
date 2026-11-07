#!/usr/bin/env node
'use strict';
const { tools, callTool } = require('./offline.js');
async function main() {
  const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
  const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
  const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
  const server = new Server({ name: 'suno', version: '1.0.0' }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async r => callTool(r.params.name, r.params.arguments));
  await server.connect(new StdioServerTransport());
  return server;
}
if (require.main === module) main().catch(() => {
  console.error('Offline server startup failed. Check installed dependencies.');
  process.exitCode = 1;
});
module.exports = { main, tools, callTool };
