'use strict';
const {randomUUID} = require('node:crypto');
const {captureVisible, collect, workspace, text, time} = require('./browser-evidence.js');
const {reconcile} = require('./inventory.js');
const {MAX_BYTES} = require('./prepare.js');

const definitions = [
  ['suno_browser_capture', 'Read the authorized tab’s current rendered window. No navigation or Suno changes.'],
  ['suno_browser_checkpoint', 'Return the session’s captured evidence. Coverage remains incomplete.'],
  ['suno_browser_reconcile', 'Reconcile captured evidence with supplied catalogue by exact ID; never apply moves.']
].map(([name,description]) => ({name,description,inputSchema:{type:'object',properties:
  name === 'suno_browser_reconcile' ? {catalogueJson:{type:'string',maxLength:MAX_BYTES}} : {},
  required:name === 'suno_browser_reconcile' ? ['catalogueJson'] : [],additionalProperties:false},
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:name === 'suno_browser_capture'}}));

// Only the trusted host supplies the tab and short-lived scope, never MCP arguments.
// No socket, CDP, cookies, token import, filesystem writes or navigation capability.
function createReadOnlySession({tab, workspaceId, workspaceName, expiresAt, expectedCount=null}) {
  if (!tab || typeof tab.url !== 'function' || typeof tab.playwright?.evaluate !== 'function' ||
      !workspace(workspaceId) || !text(workspaceName) || !workspaceName.trim() || !time(expiresAt) ||
      Date.parse(expiresAt) <= Date.now() || Date.parse(expiresAt) > Date.now()+3600000 ||
      !(expectedCount === null || Number.isSafeInteger(expectedCount) && expectedCount >= 0 && expectedCount <= 10000))
    throw Error('INVALID_READONLY_SESSION');
  const url = `https://suno.com/create?wid=${workspaceId}`;
  // Strip all browser capabilities except the two used by the fixed collector.
  const reader = {url:() => tab.url(),playwright:{evaluate:fn => tab.playwright.evaluate(fn)}};
  let captures=[], busy=false, closed=false;
  const result = value => ({isError:false,content:[{type:'text',text:JSON.stringify(value)}]});
  const fail = code => ({isError:true,content:[{type:'text',text:JSON.stringify({code})}]});
  const active = () => !closed && Date.now() < Date.parse(expiresAt);
  const checkpoint = () => collect(captures,{workspaceName,expectedCount});
  return {
    tools:structuredClone(definitions),
    close() {closed=true;captures=[];},
    async callTool(name,args={}) {
      if (!definitions.some(t => t.name === name)) return fail('UNKNOWN_TOOL');
      if (!active()) return fail('READONLY_SESSION_CLOSED');
      if (!args || typeof args !== 'object' || Array.isArray(args) ||
          Object.keys(args).some(k => name !== 'suno_browser_reconcile' || k !== 'catalogueJson') ||
          (name === 'suno_browser_reconcile' && (typeof args.catalogueJson !== 'string' || Buffer.byteLength(args.catalogueJson)>MAX_BYTES)))
        return fail('INVALID_ARGUMENTS');
      if (busy) return fail('READONLY_SESSION_BUSY');
      busy=true;
      try {
        if (name === 'suno_browser_capture') {
          if (await reader.url() !== url) return fail('READONLY_CONTEXT_CHANGED');
          const c=await captureVisible(reader,{captureId:randomUUID(),previousCaptureId:captures.at(-1)?.captureId || null,observedAt:new Date().toISOString()});
          if (!active()) return fail('READONLY_SESSION_CLOSED');
          if (c.workspaceId !== workspaceId || await reader.url() !== url) return fail('READONLY_CONTEXT_CHANGED');
          const next=collect([...captures,c],{workspaceName,expectedCount});
          captures=next.captures;
          return result({...next,readOnlyBrowserEnabled:true,writeOperationsEnabled:false,releaseGatesOpen:true});
        }
        if (!captures.length) return fail('NO_BROWSER_EVIDENCE');
        const evidence=checkpoint();
        if (name === 'suno_browser_checkpoint') return result(evidence);
        const catalogue=JSON.parse(args.catalogueJson);
        return result({...reconcile({inputJson:JSON.stringify({schemaVersion:1,inventory:evidence.inventory,catalogue,destinationWorkspaceId:null})}),
          browserCoverage:evidence.coverage,writeOperationsEnabled:false,releaseGatesOpen:true});
      } catch {return fail('READONLY_EVIDENCE_REJECTED');}
      finally {busy=false;}
    }
  };
}
module.exports={createReadOnlySession};
