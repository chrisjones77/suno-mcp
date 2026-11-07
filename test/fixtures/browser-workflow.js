'use strict';
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const C='33333333-3333-4333-8333-333333333333';
const D='44444444-4444-4444-8444-444444444444';
const T='2026-11-07T12:00:00.000Z';
const later='2026-11-07T12:01:00.000Z';
function capture(changes={}) {return {schemaVersion:1,captureId:C,previousCaptureId:null,observedAt:later,workspaceId:'default',url:'https://suno.com/create?wid=default',page:1,search:'',hiddenFilterCount:0,sort:'New',nextEnabled:true,rows:[{id:A,title:'Synthetic same title',display:'2:00\nSynthetic same title',buttons:['Publish clip']}],...changes};}
function destination(ids=[A],changes={}) {return capture({workspaceId:D,url:`https://suno.com/create?wid=${D}`,rows:ids.map(id=>({id,title:'Synthetic same title',display:'2:00\nSynthetic same title',buttons:['Publish clip']})),...changes});}
function plan() {return {schemaVersion:1,inventorySha256:'a'.repeat(64),catalogueRevision:'synthetic-v1',coverageIssues:['count_mismatch'],moves:[A,B].map(recordingId=>({recordingId,fromWorkspaceId:'default',toWorkspaceId:D}))};}
module.exports={A,B,C,D,T,later,capture,destination,plan};
