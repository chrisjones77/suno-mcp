#!/usr/bin/env node
'use strict';
const { tools, callTool } = require('./offline.js');
function createServer({browserSession} = {}) {
  const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
  const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
  const server = new Server({ name: 'suno', version: '1.0.0' }, { capabilities: { tools: {} } });
  const browserNames = new Set(browserSession?.tools.map(t => t.name) || []);
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools,...(browserSession?.tools || [])] }));
  server.setRequestHandler(CallToolRequestSchema, async r => browserNames.has(r.params.name)
    ? browserSession.callTool(r.params.name,r.params.arguments) : callTool(r.params.name, r.params.arguments));
  return server;
}
async function main() {
  const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
  const server = createServer();
  await server.connect(new StdioServerTransport());
  return server;
}
if (require.main === module) main().catch(() => {
  console.error('Offline server startup failed. Check installed dependencies.');
  process.exitCode = 1;
});
module.exports = { main, createServer, tools, callTool };
