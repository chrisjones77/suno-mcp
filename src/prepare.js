'use strict';
const { createHash } = require('node:crypto');
const MAX_BYTES = 10 * 1024 * 1024;
const sha = value => createHash('sha256').update(value, 'utf8').digest('hex');
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = v => typeof v === 'string' && v.trim().length > 0;
class InputError extends Error {}
function reject(code) { throw new InputError(code); }
function optional(v) {
  if (v === undefined || v === null) return null;
  if (!text(v) || v.length > 1024 || !v.isWellFormed()) reject('INVALID_PROVENANCE');
  return v;
}
function prepare(args) {
  if (!object(args) || Object.keys(args).some(k => k !== 'exportJson') || typeof args.exportJson !== 'string') reject('INVALID_ARGUMENTS');
  const raw = args.exportJson;
  if (Buffer.byteLength(raw, 'utf8') > MAX_BYTES) reject('EXPORT_TOO_LARGE');
  if (!raw.isWellFormed()) reject('INVALID_UNICODE');
  let source;
  try { source = JSON.parse(raw); } catch { reject('INVALID_JSON'); }
  if (!object(source) || source.schemaVersion !== 1 || source.purpose !== 'finishedSong' || source.status !== 'preparedForManualHandoff' || source.ready !== true) reject('EXPORT_NOT_READY');
  if (source.errors !== undefined && (!Array.isArray(source.errors) || source.errors.length)) reject('EXPORT_HAS_ERRORS');
  if (!object(source.fields) || !object(source.draft)) reject('INVALID_EXPORT');
  const fields = {};
  for (const k of ['title','style','lyrics']) {
    const v = source.fields[k];
    if (!text(v) || !v.isWellFormed()) reject('INVALID_FIELDS');
    fields[k] = v;
  }
  if (fields.title !== source.draft.title) reject('TITLE_MISMATCH');
  const exportSha256 = sha(raw);
  // Versioned fixed-order tuple, exact strings; no whitespace/Unicode normalization.
  const sourceSha256 = sha(JSON.stringify(['suno-prepared-v1', exportSha256,
    fields.title, fields.style, fields.lyrics, 'finished-lyrics', 'custom', false,
    'unresolved', null, 'unresolved', {}, 'none']));
  return {
    schemaVersion: 1, packageId: `sha256:${sourceSha256}`, sourceRevision: `sha256:${exportSha256}`,
    exportSha256, sourceSha256, createdAt: new Date().toISOString(), status: 'prepared',
    intentType: 'finished-lyrics', mode: 'custom', ...fields, instrumental: false,
    requestedModel: 'unresolved', modelCatalogSource: null,
    controlInventoryVersion: 'unresolved', controlIntents: {}, attachmentIntent: 'none',
    upstream: { draftId: optional(source.draft.id), savedRevisionId: optional(source.draft.revisionId),
      exportedAt: optional(source.exportedAt), savedRevisionEquivalence: 'unverified' },
    utf16Lengths: Object.fromEntries(Object.entries(fields).map(([k,v]) => [k,v.length])),
    inputVerified: false, submissionState: 'prepared', outputs: [],
    gates: ['control_inventory_unresolved', 'provider_limits_unverified', 'model_and_controls_unresolved',
      'manual_handoff_not_implemented', 'release_assurance_pending']
  };
}
module.exports = { prepare, InputError, MAX_BYTES };
