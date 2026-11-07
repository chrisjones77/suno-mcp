'use strict';
const { prepare, InputError, MAX_BYTES } = require('./prepare.js');
const { reconcile } = require('./inventory.js');
const LEGACY_TOOLS = Object.freeze([
  'suno_get_credits', 'suno_generate_song', 'suno_generate_from_description',
  'suno_check_status', 'suno_wait_for_songs', 'suno_get_recent', 'suno_download_song'
]);
const message = 'Live Suno operations are disabled pending the documented service-access and release gates. No browser, token, provider request, generation or download was attempted. Use suno_prepare_console_export for an offline unverified draft. Verified handoff is not yet implemented.';
const tools = Object.freeze([{ name: 'suno_prepare_console_export',
  description: 'Prepare an unverified offline draft from a ready WRBG finishedSong JSON export. No provider limits, model or controls are verified; no approval, submission or account access occurs.',
  inputSchema: { type: 'object', properties: { exportJson: { type: 'string', maxLength: MAX_BYTES } }, required: ['exportJson'], additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
}, { name: 'suno_reconcile_inventory',
  description: 'Reconcile supplied offline inventory and release catalogue by exact recording ID; return dry-run moves only. No collection or changes to Suno.',
  inputSchema: { type: 'object', properties: { inputJson: { type: 'string', maxLength: MAX_BYTES } }, required: ['inputJson'], additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
}, ...LEGACY_TOOLS.map(name => ({
  name, description: message,
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
}))]);
function callTool(name, args) {
  if (name === 'suno_prepare_console_export' || name === 'suno_reconcile_inventory') {
    try { return { isError: false, content: [{ type: 'text', text: JSON.stringify(name === 'suno_prepare_console_export' ? prepare(args) : reconcile(args)) }] }; }
    catch (error) { return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code: error instanceof InputError ? error.message : 'INTERNAL_ERROR' }) }] }; }
  }
  const known = LEGACY_TOOLS.includes(name);
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({
    code: known ? 'LIVE_OPERATIONS_DISABLED' : 'UNKNOWN_TOOL',
    message: known ? message : 'Unknown tool.'
  }) }] };
}
module.exports = { tools, callTool, LEGACY_TOOLS };
