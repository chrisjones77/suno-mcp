'use strict';
const { reconcile } = require('./inventory.js');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cell = value => `<td>${escape(value)}</td>`;
function table(headers, rows) {
  return `<table><thead><tr>${headers.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell).join('')}</tr>`).join('')}</tbody></table>`;
}
function renderReport(inputJson) {
  const plan = reconcile({ inputJson });
  const counts = {};
  for (const row of plan.rows) counts[row.classification] = (counts[row.classification] || 0) + 1;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Offline recording review</title><style>body{font:16px system-ui;margin:2rem;color:#18232f;background:#fff}table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border:1px solid #aab5bf;padding:.6rem;text-align:left;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#edf1f5}p{max-width:85ch}section{overflow-x:auto}code{overflow-wrap:anywhere}@media print{body{margin:0}tr{break-inside:avoid}}</style></head><body>
<h1>Offline recording review</h1>
<p>Dry run only. No live verification; no moves applied. Private or uncatalogued recordings are not automatically experiments. Listening remains unassessed. This report contains private supplied metadata; keep it private.</p>
<h2>Snapshot and coverage</h2>
${table(['Field','Value'], [
  ['Inventory source',plan.provenance.inventorySource],['Observed at',plan.provenance.observedAt],
  ['Catalogue source',plan.provenance.catalogueSource],['Catalogue revision',plan.provenance.catalogueRevision],
  ['Plan ID',plan.planId],['Input SHA-256',plan.inputSha256],['Coverage',plan.coverage.status],
  ['Coverage issues',plan.coverage.issues.join(', ') || 'None in supplied evidence'],
  ['Expected unique recordings',plan.coverage.expectedCount ?? 'Unknown'],['Unique recordings',plan.coverage.uniqueRecordings],
  ['Supplied rows',plan.coverage.suppliedRows],['Duplicate observations',plan.coverage.duplicateRows]
])}
<p>Declared complete means the supplied pagination and count agree; it does not prove completeness of the actual Suno workspace.</p>
<h2>Classification totals</h2>${table(['Classification','Recordings'],Object.entries(counts))}
<h2>Recordings</h2><section>${table(['Recording ID','Titles (JSON; null means unknown)','Publication','Classification','Conflicts','Move holds','Observations (JSON)'],plan.rows.map(r => [r.id,JSON.stringify(r.titles),r.publication,r.classification,r.conflicts.join(', '),r.moveHoldReasons.join(', '),JSON.stringify(r.observations)]))}</section>
<h2>Proposed moves (${plan.proposedMoves.length})</h2>
<p>Review candidates only. Every proposal requires fresh live verification and separate execution authorization. This organizer cannot apply moves.</p>
${table(['Recording ID','From workspace ID','To workspace ID','Reason','Preconditions (JSON)'],plan.proposedMoves.map(m => [m.recordingId,m.fromWorkspaceId,m.toWorkspaceId,m.reason,JSON.stringify(m.preconditions)]))}
<h2>Catalogue IDs absent from this snapshot (${plan.catalogueIdsAbsentFromInventory.length})</h2>
<p>These are absent from the supplied scope, not proven missing from your account.</p>
${table(['Recording ID'],plan.catalogueIdsAbsentFromInventory.map(id => [id]))}
</body></html>\n`;
}
module.exports = { renderReport };
