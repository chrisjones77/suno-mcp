#!/usr/bin/env node
'use strict';
// Standalone offline CLI; deliberately not registered with the MCP server.
const {collect} = require('./browser-evidence.js');
const ledger = require('./move-ledger.js');
const captures = require('./capture-store.js');
const {MAX_BYTES} = require('./prepare.js');
async function main(argv=process.argv.slice(2)) {
  try {
    const [command,dir,...extra]=argv;
    if(extra.length || !['collect','verify','ledger-init','ledger-record','ledger-status','capture-init','capture-record','capture-status'].includes(command) || (['collect','verify'].includes(command) ? dir!==undefined : !dir)) throw Error();
    let input;
    if(!command.endsWith('-status')) {
      const chunks=[];let size=0;
      for await(const c of process.stdin) {size+=c.length;if(size>MAX_BYTES)throw Error();chunks.push(c);}
      input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
    }
    let result;
    switch(command) {
      case 'collect': result=collect(input.captures,input.options);break;
      case 'verify': result=ledger.verifyDestination(input.plan,input.ids,input.captures);break;
      case 'ledger-init': result=ledger.resume(ledger.initLedger(dir,input));break;
      case 'ledger-record': result=ledger.resume(ledger.recordEvent(dir,input));break;
      case 'ledger-status': result=ledger.resume(ledger.loadLedger(dir).state);break;
      case 'capture-init': result=captures.initCaptureStore(dir,input);break;
      case 'capture-record': result=captures.recordCapture(dir,input);break;
      case 'capture-status': result=captures.loadCaptures(dir);break;
    }
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  } catch {process.stderr.write('OFFLINE_BROWSER_WORKFLOW_ERROR\n');process.exitCode=1;}
}
if(require.main===module)main();
module.exports={main};
