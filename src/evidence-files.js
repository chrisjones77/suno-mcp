'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {check}=require('./browser-evidence.js');
const MAX_FILE=32*1024*1024;
function createPrivateDirectory(dir) {
  const resolved=path.resolve(dir),parent=path.dirname(resolved);
  check(fs.realpathSync(parent)===parent);
  fs.mkdirSync(resolved,{mode:0o700});
  return privateDirectory(resolved);
}
function privateDirectory(dir) {
  const resolved=path.resolve(dir);check(fs.realpathSync(resolved)===resolved);
  const s=fs.lstatSync(resolved);check(s.isDirectory() && (s.mode & 0o077)===0 && s.uid===process.getuid());return resolved;
}
function readPrivate(file) {
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try {const s=fs.fstatSync(fd);check(s.isFile() && s.nlink===1 && s.size<=MAX_FILE && (s.mode&0o077)===0 && s.uid===process.getuid());return JSON.parse(fs.readFileSync(fd,'utf8'));} finally {fs.closeSync(fd);}
}
function writeExclusive(file,value) {
  const data=JSON.stringify(value);check(Buffer.byteLength(data)<=MAX_FILE);
  const fd=fs.openSync(file,'wx',0o600);
  try {fs.writeFileSync(fd,data);fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
  const parent=fs.openSync(path.dirname(file),'r');try {fs.fsyncSync(parent);} finally {fs.closeSync(parent);}
}
module.exports={createPrivateDirectory,privateDirectory,readPrivate,writeExclusive};
