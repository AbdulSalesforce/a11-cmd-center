// Push logged accessibility failures to Salesforce GUS as ADM_Work__c bugs via
// the `sf` CLI (authenticated to the `gus` org alias). Every field mapping and
// lookup object below was verified against the live gus org schema.
//
// Behaviour (per product decisions):
//   • One ADM_Work__c bug per failure.
//   • Fully atomic pre-flight: EVERY field/lookup for EVERY selected failure is
//     resolved first. If the org is unreachable, or ANY required value can't be
//     resolved, nothing is created and a detailed error is returned.
//   • Nothing is written back to the local failure (caller just shows a toast).
const { execFile } = require('child_process');

const SF_BIN = process.env.SF_BIN || 'sf';
const TARGET_ORG = process.env.GUS_ORG_ALIAS || 'gus';
const SF_TIMEOUT_MS = 45000;

// ADM_Impact__c.Name is prefixed "Accessibility: " in the gus org. Derived from
// the failure's severity (P1/P2/P3), not from any free-text stored impact.
const IMPACT_BY_SEVERITY = {
  P1: 'Accessibility: Task Blocking',
  P2: 'Accessibility: Difficult to Finish',
  P3: 'Accessibility: Limited Impact',
};

// Fixed frequency for every pushed bug. Must match an ADM_Frequency__c.Name
// (the org has: Sometimes / Always / Often / Rarely — there is no
// "Some of the time", so "Sometimes" is used).
const DEFAULT_FREQUENCY = 'Sometimes';

// ── sf CLI helpers ────────────────────────────────────────────────────────

// Run an arbitrary sf subcommand and return the parsed JSON `result`. Rejects
// with a readable message (sf prints JSON even on failure, so parse first).
function sfJson(args, { allowNonZero = false } = {}) {
  return new Promise((resolve, reject) => {
    execFile(SF_BIN, [...args, '--json'], { timeout: SF_TIMEOUT_MS, maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => {
        let parsed = null;
        const start = stdout ? stdout.indexOf('{') : -1;
        if (start !== -1) { try { parsed = JSON.parse(stdout.slice(start)); } catch { /* ignore */ } }
        if (parsed && parsed.status === 0) return resolve(parsed.result || {});
        if (parsed && allowNonZero) return resolve(parsed.result || {});
        const message = (parsed && parsed.message) || (stderr && stderr.trim()) ||
          (err && err.message) || 'sf command failed';
        reject(new Error(message));
      });
  });
}

function runSoql(query) {
  return sfJson(['data', 'query', '--target-org', TARGET_ORG, '--query', query])
    .then(r => r.records || []);
}

// First matching record Id for a query, or null when there is no match.
async function resolveId(query) {
  const records = await runSoql(query);
  return records.length ? records[0].Id : null;
}

// Escape a value for embedding inside a SOQL string literal.
function soql(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Escape a value for the `--values "Field__c='...'"` create syntax. Single
// quotes are escaped and newlines flattened so the space-delimited parser
// doesn't split a value mid-way.
function val(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
}

// ── description assembly ────────────────────────────────────────────────────

// HTML-wrapped Details_and_Steps_to_Reproduce__c. Folds page/component and
// platform context in as extra lines (no dedicated GUS fields for them).
function buildDescription(f) {
  const lines = [];
  if (f.details) lines.push(`<p>${f.details.replace(/\r?\n/g, '<br/>')}</p>`);
  if (f.wcag_criterion) lines.push(`<p><b>WCAG success criterion:</b> ${f.wcag_criterion}</p>`);
  if (f.page_name) lines.push(`<p><b>Page / component:</b> ${f.page_name}</p>`);
  const platform = [f.platform_type, f.mobile_os].filter(Boolean).join(' / ');
  if (platform && platform !== 'Not specified') lines.push(`<p><b>Platform:</b> ${platform}</p>`);
  return lines.join('');
}

// ── resolution (read-only pre-flight) ───────────────────────────────────────

// Resolve every Salesforce Id a single failure's bug needs. Returns
// { values, themeId } on success, or throws an Error describing the first
// unresolved required field (used to abort the whole push).
//
// People fields (Assignee, QA Engineer, Product Owner, Scrum Team) are
// intentionally NOT set: GUS's own bug-assignment rule auto-populates them from
// the Product Tag when the record is created. Verified empirically — a bug
// created with only Product_Tag__c set came back with the tag's rule assignee /
// QA / PO / team already filled in. Setting them ourselves would fight (or be
// overwritten by) that automation and produced the wrong people.
async function resolveFailure(f, { themeId }) {
  const label = `“${f.subject || 'failure'}” (#${f.sf_issue_id})`;
  const severity = f.severity;

  // WCAG success criterion → lookup Id (+ Customer__c text). Required.
  if (!f.wcag_criterion) throw new Error(`${label}: no WCAG success criterion.`);
  const wcagId = await resolveId(
    `SELECT Id FROM AQUA_WCAG_Success_Criteria__c WHERE Name = '${soql(f.wcag_criterion)}' LIMIT 1`);
  if (!wcagId) throw new Error(`${label}: WCAG criterion "${f.wcag_criterion}" not found in GUS.`);

  // Impact (derived from severity) → lookup Id. Required.
  const impactName = IMPACT_BY_SEVERITY[severity];
  if (!impactName) throw new Error(`${label}: unmapped severity "${severity}".`);
  const impactId = await resolveId(
    `SELECT Id FROM ADM_Impact__c WHERE Name = '${soql(impactName)}' LIMIT 1`);
  if (!impactId) throw new Error(`${label}: impact "${impactName}" not found in GUS.`);

  // Frequency (fixed default) → lookup Id. Required.
  const frequencyId = await resolveId(
    `SELECT Id FROM ADM_Frequency__c WHERE Name = '${soql(DEFAULT_FREQUENCY)}' LIMIT 1`);
  if (!frequencyId) throw new Error(`Frequency "${DEFAULT_FREQUENCY}" not found in GUS.`);

  // Product tag — required. It's what GUS's assignment rule keys off to fill in
  // the Assignee / QA Engineer / Product Owner / Scrum Team. We hold its real
  // GUS Id, so just verify it still exists and hand it to the create.
  if (!f.tag_id) throw new Error(`${label}: no product tag selected (drives the GUS assignment rule).`);
  const tagRecords = await runSoql(
    `SELECT Id FROM ADM_Product_Tag__c WHERE Id = '${soql(f.tag_id)}' LIMIT 1`);
  if (!tagRecords.length) throw new Error(`${label}: product tag ${f.tag_id} not found in GUS.`);

  // Found in build — required by GUS on ADM_Work__c creation. Fail the push
  // here rather than letting the create error out mid-batch.
  if (!f.found_in_build_id) {
    throw new Error(`${label}: no "Found in build" selected (required by GUS).`);
  }

  // Assemble the createable field set. Assignee / QA / PO / Scrum Team are
  // deliberately omitted (see note above — GUS's assignment rule fills them).
  const values = {
    Subject__c: f.subject,
    Type__c: 'Bug',
    Status__c: 'New',
    Priority__c: severity,
    Details_and_Steps_to_Reproduce__c: buildDescription(f),
    A11Y_WCAG_Success_Criteria__c: wcagId,
    Customer__c: f.wcag_criterion,
    Impact__c: impactId,
    Frequency__c: frequencyId,
    Product_Tag__c: f.tag_id,
    Found_in_Build__c: f.found_in_build_id,
  };

  return { values, themeId };
}

// ── create (write) ──────────────────────────────────────────────────────────

async function createBug(values) {
  const valuesStr = Object.entries(values)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}='${val(v)}'`)
    .join(' ');
  const result = await sfJson(
    ['data', 'create', 'record', '--target-org', TARGET_ORG, '--sobject', 'ADM_Work__c', '--values', valuesStr]);
  const recordId = result.id || result.Id;
  if (!recordId) throw new Error('GUS create returned no record id.');
  const nameRows = await runSoql(`SELECT Name FROM ADM_Work__c WHERE Id = '${soql(recordId)}' LIMIT 1`);
  return { recordId, gusId: nameRows.length ? nameRows[0].Name : recordId };
}

// Link the bug to the project's audit theme via the ADM_Theme_Assignment__c
// junction (there is no direct Theme field on ADM_Work__c). Best-effort: a
// theme-link failure does not undo the already-created bug.
async function assignTheme(recordId, themeId) {
  if (!themeId) return;
  try {
    await sfJson(['data', 'create', 'record', '--target-org', TARGET_ORG,
      '--sobject', 'ADM_Theme_Assignment__c',
      '--values', `Work__c='${val(recordId)}' Theme__c='${val(themeId)}'`]);
  } catch (err) {
    // Surface as a soft warning on the result rather than failing the push.
    return err.message;
  }
}

// Confirm the sf CLI can reach the target org (authenticated + online) before
// we attempt any writes. Throws a readable error otherwise.
async function ensureReachable() {
  const org = await sfJson(['org', 'display', '--target-org', TARGET_ORG]);
  if (!org.username) throw new Error('Could not determine the authenticated GUS user.');
}

// ── public entry point ───────────────────────────────────────────────────────

// Create one ADM_Work__c bug per failure. `failures` are DB rows (each carrying
// tag_id via the product_tags join); `project` supplies audit_theme_ids.
// Throws before any write if the org is unreachable or any failure can't be
// fully resolved (atomic pre-flight). Returns { pushed, bugs, warnings }.
async function pushFailuresToGus({ failures, project }) {
  if (!failures.length) throw new Error('No failures selected.');

  // Org reachability, up front. A failure here aborts everything before any
  // record is created. (People fields are assigned by GUS, so we no longer need
  // the running user's Id — just confirm the CLI can reach the org.)
  try {
    await ensureReachable();
  } catch (err) {
    const e = new Error(`Unable to reach GUS: ${err.message} Ensure the sf CLI is authenticated to the "${TARGET_ORG}" org.`);
    e.unreachable = true;
    throw e;
  }

  const themeId = Array.isArray(project.audit_theme_ids) && project.audit_theme_ids.length
    ? String(project.audit_theme_ids[0]).trim()
    : (project.audit_theme_id || null);

  // Pre-flight: resolve every failure. Collect all problems so the user sees
  // everything wrong at once, and create nothing if any exist.
  const resolved = [];
  const problems = [];
  for (const f of failures) {
    try {
      resolved.push({ failure: f, ...(await resolveFailure(f, { themeId })) });
    } catch (err) {
      problems.push(err.message);
    }
  }
  if (problems.length) {
    const e = new Error(`Push aborted — nothing was created. Resolve these and retry:\n• ${problems.join('\n• ')}`);
    e.problems = problems;
    throw e;
  }

  // All resolved — create the bugs.
  const bugs = [];
  const warnings = [];
  for (const { failure, values } of resolved) {
    const { recordId, gusId } = await createBug(values);
    const warn = await assignTheme(recordId, themeId);
    if (warn) warnings.push(`${gusId}: theme link failed — ${warn}`);
    bugs.push({ failureId: failure.id, sf_issue_id: failure.sf_issue_id, recordId, gusId });
  }

  return { pushed: bugs.length, bugs, warnings };
}

module.exports = { pushFailuresToGus };
