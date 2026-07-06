const { randomUUID } = require('crypto');
const db = require('./src/db/schema');

const PROJECT_ID      = 'demo-project-001';
const COMPLETED_ID    = 'demo-project-complete';

// Wipe existing demo data (checklist items are now per-scope-item, will be recreated below)

// Wipe any existing demo data so re-running is safe
db.prepare("DELETE FROM projects WHERE id = ?").run(PROJECT_ID);

const project = db.prepare(`
  INSERT INTO projects (
    id, product_name, pm_name, pm_email, login_path, slack_channel,
    release_build_name, release_build_id, audit_theme_id, epic_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  PROJECT_ID,
  'Service Cloud Voice',
  'Sarah Chen',
  'schen@salesforce.com',
  'https://login.salesforce.com → Service → Service Cloud Voice',
  '#scv-a11y',
  '260',
  'a06900000009Q0dAAE',
  'AT-2026-042',
  'W-14892301'
);

const auditors = [
  { name: 'Jonathan Bell', email: 'jonathan.bell@salesforce.com' },
  { name: 'Priya Sharma',  email: 'psharma@salesforce.com' },
];
const insertAuditor = db.prepare(
  'INSERT INTO auditors (id, project_id, name, email) VALUES (?, ?, ?, ?)'
);
const auditorIds = auditors.map(a => {
  const id = randomUUID();
  insertAuditor.run(id, PROJECT_ID, a.name, a.email);
  return { ...a, id };
});

const tags = [
  { tag_name: 'PT SCV Core',    tag_id: '4829103' },
  { tag_name: 'PT SCV Omni',    tag_id: '4829104' },
];
const insertTag = db.prepare(
  'INSERT INTO product_tags (id, project_id, tag_name, tag_id) VALUES (?, ?, ?, ?)'
);
tags.forEach(t => insertTag.run(randomUUID(), PROJECT_ID, t.tag_name, t.tag_id));

const scope = [
  { page_name: 'Agent Console — Voice tab',     url: null },
  { page_name: 'Incoming call notification',    url: null },
  { page_name: 'Call controls toolbar',         url: null },
  { page_name: 'After-call work screen',        url: null },
  { page_name: 'Supervisor barge-in modal',     url: null },
];
const insertScope = db.prepare(
  'INSERT INTO scope_items (id, project_id, page_name, url, status) VALUES (?, ?, ?, ?, ?)'
);
const scopeIds = scope.map((s, i) => {
  const id = randomUUID();
  const status = i === 0 ? 'complete' : i === 1 ? 'in_progress' : 'pending';
  insertScope.run(id, PROJECT_ID, s.page_name, s.url, status);
  return { ...s, id };
});

const failures = [
  {
    subject: 'Call accept button has no accessible name',
    details: 'The "Accept call" button in the incoming call notification renders as an icon-only button with no text, aria-label, or title attribute.',
    steps: '1. Receive an incoming call\n2. Navigate to the accept button with a keyboard or screen reader\n3. Observe that no accessible name is announced',
    impact: 'Screen reader users cannot identify what the button does. VoiceOver announces "button" with no label, making call management impossible.',
    recommendations: 'Add aria-label="Accept call" to the button element, or include visually-hidden text inside it.',
    html_code: '<button class="call-btn accept"><svg>…</svg></button>',
    auditor_comments: 'Reproduced in JAWS 2024 + Chrome and VoiceOver + Safari.',
    page_name: 'Incoming call notification',
    sub_page_name: '',
    wcag_criterion: 'SC 4.1.2 Name, Role, Value (Level A)',
    platform_type: 'Desktop',
    mobile_os: null,
    severity: 'P1',
    known_work_id: null,
    agency_ref_id: null,
    auditor_id: auditorIds[0].id,
    status: 'open',
  },
  {
    subject: 'Focus not moved to call controls after accepting call',
    details: 'When a call is accepted via keyboard, focus remains on the notification banner rather than moving to the call controls toolbar.',
    steps: '1. Wait for incoming call\n2. Press Enter on "Accept"\n3. Observe focus position after banner dismisses',
    impact: 'Keyboard-only users must manually search for the call controls after answering, creating a significant time penalty in live call situations.',
    recommendations: 'After the notification dismisses, programmatically move focus to the mute button or the first interactive control in the call toolbar.',
    html_code: null,
    auditor_comments: null,
    page_name: 'Call controls toolbar',
    sub_page_name: '',
    wcag_criterion: 'SC 2.4.3 Focus Order (Level A)',
    platform_type: 'Desktop',
    mobile_os: null,
    severity: 'P1',
    known_work_id: null,
    agency_ref_id: null,
    auditor_id: auditorIds[0].id,
    status: 'open',
  },
  {
    subject: 'Color alone used to indicate mute state',
    details: 'The mute button changes from green to red when muted but there is no icon change, label change, or other non-color indicator.',
    steps: '1. Join an active call\n2. Activate the mute button\n3. Inspect the button for non-color state indicators',
    impact: 'Users with color vision deficiency cannot reliably determine whether they are muted, risking accidental audio leaks.',
    recommendations: 'Add a visual text label or icon swap (e.g. a slashed microphone icon) when muted. Also reflect state in aria-pressed.',
    html_code: '<button class="mute-btn muted" style="background:#d9534f">Mute</button>',
    auditor_comments: 'aria-pressed is not set — separate 4.1.2 issue may be warranted.',
    page_name: 'Call controls toolbar',
    sub_page_name: '',
    wcag_criterion: 'SC 1.4.1 Use of Color (Level A)',
    platform_type: 'Desktop',
    mobile_os: null,
    severity: 'P2',
    known_work_id: 'W-14901122',
    agency_ref_id: null,
    auditor_id: auditorIds[1].id,
    status: 'fixed',
  },
  {
    subject: 'After-call work timer not exposed to assistive technology',
    details: 'The countdown timer shown during after-call work updates visually every second but the live region is missing, so screen reader users receive no time updates.',
    steps: '1. End a call\n2. Listen with a screen reader during the after-call work window\n3. Observe that timer changes are not announced',
    impact: 'Screen reader users cannot track how much after-call work time remains without visually consulting the screen.',
    recommendations: 'Wrap the timer in a <div role="timer" aria-live="off" aria-atomic="true"> or announce key thresholds (e.g. "30 seconds remaining") via a polite live region.',
    html_code: '<div class="acw-timer">0:42</div>',
    auditor_comments: null,
    page_name: 'After-call work screen',
    sub_page_name: '',
    wcag_criterion: 'SC 4.1.3 Status Messages (Level AA)',
    platform_type: 'Desktop',
    mobile_os: null,
    severity: 'P2',
    known_work_id: null,
    agency_ref_id: null,
    auditor_id: auditorIds[0].id,
    status: 'open',
  },
];

const insertFailure = db.prepare(`
  INSERT INTO failures (
    id, project_id, auditor_id, sf_issue_id, agency_ref_id, subject,
    details, steps, impact, recommendations, html_code, auditor_comments,
    page_name, sub_page_name, wcag_criterion, platform_type, mobile_os,
    severity, known_work_id, product_tag_id, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

failures.forEach((f, i) => {
  insertFailure.run(
    randomUUID(), PROJECT_ID, f.auditor_id, i + 1,
    f.agency_ref_id, f.subject, f.details, f.steps, f.impact,
    f.recommendations, f.html_code, f.auditor_comments,
    f.page_name, f.sub_page_name, f.wcag_criterion, f.platform_type,
    f.mobile_os, f.severity, f.known_work_id, null, f.status
  );
});

const insertChecklist = db.prepare(`
  INSERT INTO checklist_items (id, scope_item_id, sc_id, status, na_note)
  VALUES (?, ?, ?, ?, ?)
`);

// Checklist for first scope item (Agent Console — Voice tab): in progress
const checklistSeeds1 = [
  { sc_id: 'SC 1.1.1', status: 'pass' },
  { sc_id: 'SC 1.2.1', status: 'na',   na_note: 'No prerecorded audio/video content in scope' },
  { sc_id: 'SC 1.3.1', status: 'pass' },
  { sc_id: 'SC 1.4.1', status: 'pass' },
  { sc_id: 'SC 2.1.1', status: 'pass' },
  { sc_id: 'SC 2.4.3', status: 'fail' },
];

checklistSeeds1.forEach(item => {
  insertChecklist.run(randomUUID(), scopeIds[0].id, item.sc_id, item.status, item.na_note || null);
});

console.log('Demo data seeded:');
console.log(`  Project: Service Cloud Voice (id: ${PROJECT_ID})`);
console.log(`  Auditors: ${auditors.length}`);
console.log(`  Scope items: ${scope.length}`);
console.log(`  Failures: ${failures.length}`);
console.log(`  Checklist items: ${checklistSeeds1.length} reviewed on first scope item`);

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETED demo project — all scope items complete, full checklist reviewed
// ─────────────────────────────────────────────────────────────────────────────
db.prepare("DELETE FROM projects WHERE id = ?").run(COMPLETED_ID);

db.prepare(`
  INSERT INTO projects (
    id, product_name, pm_name, pm_email, login_path, slack_channel,
    release_build_name, release_build_id, audit_theme_id, epic_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  COMPLETED_ID,
  'Field Service Mobile',
  'Marcus Webb',
  'mwebb@salesforce.com',
  'https://login.salesforce.com → Field Service',
  '#fsm-a11y',
  '58.1',
  'a06900000009Q1aAAE',
  'AT-2026-031',
  'W-14701188'
);

const completedAuditors = [
  { name: 'Jonathan Bell', email: 'jonathan.bell@salesforce.com' },
  { name: 'Keiko Tanaka',  email: 'ktanaka@salesforce.com' },
];
const completedAuditorIds = completedAuditors.map(a => {
  const id = randomUUID();
  insertAuditor.run(id, COMPLETED_ID, a.name, a.email);
  return { ...a, id };
});

const completedTags = [
  { tag_name: 'PT FSM iOS',     tag_id: '5013201' },
  { tag_name: 'PT FSM Android', tag_id: '5013202' },
];
completedTags.forEach(t => insertTag.run(randomUUID(), COMPLETED_ID, t.tag_name, t.tag_id));

const completedScope = [
  { page_name: 'Work order list view' },
  { page_name: 'Work order detail' },
  { page_name: 'Map & directions screen' },
  { page_name: 'Appointment booking flow' },
];
const completedScopeIds = completedScope.map(s => {
  const id = randomUUID();
  insertScope.run(id, COMPLETED_ID, s.page_name, null, 'pending');
  return { ...s, id };
});

const completedFailures = [
  {
    subject: 'Map zoom controls not keyboard accessible',
    details: 'The + and − zoom buttons on the map screen are rendered as non-interactive <div> elements and cannot be reached or activated with a keyboard.',
    steps: '1. Open a work order with a map\n2. Tab through the page\n3. Observe that zoom controls receive no focus',
    impact: 'Keyboard-only users cannot zoom the map, blocking the core navigation task for this screen.',
    recommendations: 'Reimplement zoom buttons as <button> elements. Ensure they receive logical tab focus and respond to Enter and Space.',
    html_code: '<div class="zoom-btn zoom-in">+</div>',
    auditor_comments: 'Confirmed in Chrome + JAWS and Firefox + NVDA.',
    page_name: 'Map & directions screen',
    wcag_criterion: 'SC 2.1.1 Keyboard (Level A)',
    platform_type: 'Desktop',
    severity: 'P1',
    status: 'verified',
    auditor_id: null,
  },
  {
    subject: 'Appointment time slot selected state not conveyed',
    details: 'Time slot buttons in the booking flow change background color when selected but have no aria-pressed or aria-selected attribute; selected state is invisible to screen readers.',
    steps: '1. Reach the appointment booking flow\n2. Select a time slot\n3. Re-navigate to it with a screen reader',
    impact: 'Screen reader users cannot confirm which slot they have selected before proceeding.',
    recommendations: 'Add aria-pressed="true/false" to toggle buttons or aria-selected on listbox options depending on the pattern used.',
    html_code: '<button class="slot selected">10:00 AM</button>',
    auditor_comments: null,
    page_name: 'Appointment booking flow',
    wcag_criterion: 'SC 4.1.2 Name, Role, Value (Level A)',
    platform_type: 'Desktop',
    severity: 'P1',
    status: 'verified',
    auditor_id: null,
  },
  {
    subject: 'Work order status badge contrast insufficient',
    details: 'The "In Progress" amber badge uses #C77B00 text on #FFF8E1 background, yielding a contrast ratio of approximately 3.2:1 — below the 4.5:1 minimum.',
    steps: '1. Open a work order list with In Progress items\n2. Check contrast of amber badge',
    impact: 'Low-vision users may be unable to read the status label reliably.',
    recommendations: 'Darken the text to #7A4B00 or darken the background to meet 4.5:1.',
    html_code: '<span class="badge status-in-progress">In Progress</span>',
    auditor_comments: 'Computed via WebAIM Contrast Checker.',
    page_name: 'Work order list view',
    wcag_criterion: 'SC 1.4.3 Contrast (Minimum) (Level AA)',
    platform_type: 'Desktop',
    severity: 'P2',
    status: 'fixed',
    auditor_id: null,
  },
  {
    subject: 'Address autocomplete suggestions not announced',
    details: 'When typing in the address field in the directions screen, autocomplete suggestions appear visually but are not in a live region and are not announced by screen readers.',
    steps: '1. Focus the address input on the map screen\n2. Type a partial address\n3. Observe screen reader output as suggestions appear',
    impact: 'Screen reader users are unaware that suggestions have appeared and must navigate to discover them.',
    recommendations: 'Implement a combobox pattern per ARIA 1.2 with role="combobox" and aria-controls pointing to the listbox, or add a polite live region count announcement.',
    html_code: null,
    auditor_comments: null,
    page_name: 'Map & directions screen',
    wcag_criterion: 'SC 4.1.3 Status Messages (Level AA)',
    platform_type: 'Desktop',
    severity: 'P2',
    status: 'verified',
    auditor_id: null,
  },
  {
    subject: 'Missing skip navigation link',
    details: 'There is no skip navigation link at the top of any screen, requiring keyboard users to tab through the full header and side navigation on every page load.',
    steps: '1. Load any screen\n2. Press Tab as the first keypress\n3. Observe that no skip link appears',
    impact: 'Keyboard-only users face unnecessary keystrokes on every page navigation.',
    recommendations: 'Add a visually hidden "Skip to main content" link as the first focusable element, visible on focus.',
    html_code: null,
    auditor_comments: null,
    page_name: 'Work order list view',
    wcag_criterion: 'SC 2.4.1 Bypass Blocks (Level A)',
    platform_type: 'Desktop',
    severity: 'P3',
    status: 'fixed',
    auditor_id: null,
  },
];

completedFailures.forEach((f, i) => {
  insertFailure.run(
    randomUUID(), COMPLETED_ID, completedAuditorIds[0].id, i + 1,
    null, f.subject, f.details, f.steps, f.impact,
    f.recommendations, f.html_code, f.auditor_comments,
    f.page_name, null, f.wcag_criterion, f.platform_type,
    null, f.severity, null, null, f.status
  );
});

// Full checklist — every SC reviewed for the completed project
const WCAG_A_AA = [
  'SC 1.1.1','SC 1.2.1','SC 1.2.2','SC 1.2.3','SC 1.2.4','SC 1.2.5',
  'SC 1.3.1','SC 1.3.2','SC 1.3.3','SC 1.3.4','SC 1.3.5',
  'SC 1.4.1','SC 1.4.2','SC 1.4.3','SC 1.4.4','SC 1.4.5',
  'SC 1.4.10','SC 1.4.11','SC 1.4.12','SC 1.4.13',
  'SC 2.1.1','SC 2.1.2','SC 2.1.4',
  'SC 2.2.1','SC 2.2.2',
  'SC 2.3.1',
  'SC 2.4.1','SC 2.4.2','SC 2.4.3','SC 2.4.4','SC 2.4.5','SC 2.4.6','SC 2.4.7',
  'SC 2.5.1','SC 2.5.2','SC 2.5.3','SC 2.5.4',
  'SC 3.1.1','SC 3.1.2',
  'SC 3.2.1','SC 3.2.2','SC 3.2.3','SC 3.2.4',
  'SC 3.3.1','SC 3.3.2','SC 3.3.3','SC 3.3.4',
  'SC 4.1.1','SC 4.1.2','SC 4.1.3',
];

// SCs that have logged failures → 'fail'; media/n/a SCs → 'na'; rest → 'pass'
const failedSCs    = new Set(['SC 1.4.3','SC 2.1.1','SC 2.4.1','SC 4.1.2','SC 4.1.3']);
const naMediaSCs   = new Set(['SC 1.2.1','SC 1.2.2','SC 1.2.3','SC 1.2.4','SC 1.2.5','SC 1.4.2']);

// Add complete checklists to all 4 scope items
completedScopeIds.forEach(scope => {
  WCAG_A_AA.forEach(sc_id => {
    let status = 'pass';
    if (failedSCs.has(sc_id))  status = 'fail';
    if (naMediaSCs.has(sc_id)) status = 'na';
    insertChecklist.run(randomUUID(), scope.id, sc_id, status, null);
  });
});

console.log(`  Completed project: Field Service Mobile (id: ${COMPLETED_ID})`);
console.log(`    Scope items: ${completedScope.length} (all complete)`);
console.log(`    Failures: ${completedFailures.length}`);
console.log(`    Checklist items: ${WCAG_A_AA.length} reviewed`);
