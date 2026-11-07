#!/usr/bin/env node
'use strict';
const { MAX_BYTES, InputError } = require('./prepare.js');
const { reconcile } = require('./inventory.js');
const { renderReport } = require('./report.js');
async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !['--html','--json'].includes(args[0])) {
    process.stderr.write('Usage: node src/organize.js --html|--json < normalized-input.json > report\n');
    process.exitCode = 1;
    return;
  }
  try {
    const chunks = []; let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) throw new InputError('INVALID_INVENTORY_INPUT');
      chunks.push(chunk);
    }
    let input;
    try { input = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Buffer.concat(chunks)); }
    catch { throw new InputError('INVALID_INVENTORY_INPUT'); }
    const output = args[0] === '--html' ? renderReport(input) : JSON.stringify(reconcile({ inputJson: input }), null, 2) + '\n';
    process.stdout.write(output);
  } catch (error) {
    process.stderr.write((error instanceof InputError ? error.message : 'OFFLINE_ORGANIZER_ERROR') + '\n');
    process.exitCode = 1;
  }
}
if (require.main === module) main();
