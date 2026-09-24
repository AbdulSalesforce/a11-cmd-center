import { useState, useEffect, useRef } from 'react';
import FailureScenarioPicker from './FailureScenarioPicker';
import BuildPicker from './BuildPicker';
import AuditThemePicker from './AuditThemePicker';
import ISSUE_LIBRARY from '../data/issue-library.json';
import '../styles/log-failure-panel.css';

// Zip a project's parallel audit_theme_ids / audit_theme_names arrays into a
// list of { value, name } rows the panel can render and edit. Falls back to the
// legacy single audit_theme_id when the arrays are absent.
function themesFromProject(project) {
  const ids = project?.audit_theme_ids?.length
    ? project.audit_theme_ids
    : (project?.audit_theme_id ? [project.audit_theme_id] : []);
  const names = project?.audit_theme_names || [];
  return ids
    .map((id, i) => ({ value: String(id).trim(), name: names[i] || '' }))
    .filter(t => t.value);
}

// Every logged bug's subject is prefixed with this tag on save. The field itself
// stays clean (no prefill) — the prefix is prepended when the failure is saved.
const SUBJECT_PREFIX = '[Accessibility] ';

// Failure scenario → issue library entry. Scenarios are unique (1:1), so a plain
// Map lookup resolves the WCAG criterion and severity for a chosen scenario.
const SCENARIO_MAP = new Map(
  ISSUE_LIBRARY.filter(i => i.failing_scenario).map(i => [i.failing_scenario, i]),
);

// Severity pills shown beside the WCAG criterion. The scenario auto-selects one,
// and the auditor can override by clicking. Only P1–P3 are offered (the DB
// doesn't accept P0), so a library P0 is clamped to P1.
const SEVERITIES = ['P1', 'P2', 'P3'];

// Impact is derived from severity — one label per priority.
const IMPACT_BY_SEVERITY = {
  P1: 'Task Blocking',
  P2: 'Difficult to Finish',
  P3: 'Limited Impact',
};

// The library's reference_resources (an array of one-line paragraphs) rendered
// as the Details/Description text — one resource per line.
function referencesToDetails(refs) {
  if (Array.isArray(refs)) return refs.filter(Boolean).join('\n');
  return refs || '';
}

// Clamp a library severity to a selectable pill: P0 → P1, empty → P3.
function clampSeverity(s) {
  return s === 'P0' ? 'P1' : (s || 'P3');
}

const EMPTY = {
  subject: '',
  failure_scenario: '',
  wcag_criterion: '',
  severity: '',
  product_tag_id: '',
  found_in_build_id: '',
  found_in_build_name: '',
  screenshot_link: '',
  details: '',
  page_name: '',
};

// Strip the "[Accessibility] " prefix so the field shows only the auditor's text.
function stripSubjectPrefix(raw) {
  const trimmed = (raw || '').trim();
  const p = SUBJECT_PREFIX.trim();
  return trimmed.startsWith(p) ? trimmed.slice(p.length).trim() : trimmed;
}

// Map a saved failure back into the form's field shape for edit mode.
function fieldsFromFailure(failure) {
  if (!failure) return EMPTY;
  return {
    ...EMPTY,
    subject: stripSubjectPrefix(failure.subject),
    failure_scenario: failure.failure_scenario || '',
    wcag_criterion: failure.wcag_criterion || '',
    severity: failure.severity || '',
    product_tag_id: failure.product_tag_id || '',
    found_in_build_id: failure.found_in_build_id || '',
    found_in_build_name: failure.found_in_build_name || '',
    screenshot_link: failure.screenshot_link || failure.screenshots?.[0]?.drive_url || '',
    details: failure.details || '',
    page_name: failure.page_name || '',
  };
}

// Slide-in side panel for logging a failure — or editing an existing one when
// initialFailure is provided. Mounting the component opens it; the parent
// unmounts it to close. On save it calls onSave(failure) with a normalized
// failure object and leaves persistence/table-refresh to the parent.
export default function LogFailurePanel({ onClose, onSave, onSaveThemes, project, initialFailure = null, existingFailures = [] }) {
  const isEdit = Boolean(initialFailure);
  const [fields, setFields] = useState(() => fieldsFromFailure(initialFailure));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);

  // Applied audit themes for the project, editable inline. Committed to the
  // project only when the panel is saved (see handleSubmit → onSaveThemes).
  const [themes, setThemes] = useState(() => themesFromProject(project));
  // A fresh picker instance per add, so it clears after each selection.
  const [themePickerKey, setThemePickerKey] = useState(0);

  function addTheme(value, name) {
    if (!value) return;
    setThemes(list => (list.some(t => t.value === value) ? list : [...list, { value, name }]));
    setThemePickerKey(k => k + 1);
  }
  function removeTheme(value) {
    setThemes(list => list.filter(t => t.value !== value));
  }

  const tagOptions = project?.product_tags ?? [];
  const scopeOptions = project?.scope_items ?? [];
  // Impact is fully derived from the selected severity.
  const impact = IMPACT_BY_SEVERITY[fields.severity] || '';

  // Move focus into the subject field once the panel mounts.
  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Duplicate detection — same criterion already logged for the same page.
  const duplicate = fields.wcag_criterion && fields.page_name
    ? existingFailures.find(f =>
        f.wcag_criterion === fields.wcag_criterion && f.page_name === fields.page_name)
    : null;

  function setField(name, value) {
    setFields(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  // Choosing a failure scenario from the library auto-fills the WCAG success
  // criterion, severity, and Details/Description (from the entry's reference
  // resources). The criterion field is read-only, so it only ever comes from
  // here. A free-typed scenario with no library match leaves details untouched.
  function handleScenarioChange(scenario) {
    const issue = SCENARIO_MAP.get(scenario);
    setFields(f => ({
      ...f,
      failure_scenario: scenario,
      wcag_criterion: issue?.wcag_criteria || '',
      // No P0 pill, so map a library P0 up to P1; leave blank when unmatched.
      severity: issue ? clampSeverity(issue.severity) : '',
      details: issue ? referencesToDetails(issue.reference_resources) : f.details,
    }));
    setErrors(e => ({ ...e, failure_scenario: '', wcag_criterion: '' }));
  }

  // The subject minus its "[Accessibility]" prefix — the auditor's own text.
  function subjectBody(raw) {
    const trimmed = raw.trim();
    return trimmed.startsWith(SUBJECT_PREFIX.trim())
      ? trimmed.slice(SUBJECT_PREFIX.trim().length).trim()
      : trimmed;
  }

  function validate() {
    const errs = {};
    if (!subjectBody(fields.subject)) errs.subject = 'Subject is required.';
    if (!fields.failure_scenario) {
      errs.failure_scenario = 'Select a failure scenario from the library.';
    } else if (!fields.wcag_criterion) {
      errs.wcag_criterion = 'This scenario has no linked WCAG criterion. Pick another scenario.';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setSaving(true);
    const tag = tagOptions.find(t => t.id === fields.product_tag_id);
    // Severity is derived from the scenario (P0 clamped to P1); the DB requires
    // a value, so fall back to P3 when the library entry has none.
    const severity = clampSeverity(fields.severity);
    const failure = {
      // Guarantee the tag prefix even if the auditor edited or removed it.
      subject: `${SUBJECT_PREFIX}${subjectBody(fields.subject)}`,
      wcag_criterion: fields.wcag_criterion,
      failure_scenario: fields.failure_scenario.trim(),
      severity,
      // Impact follows severity one-to-one.
      impact: IMPACT_BY_SEVERITY[severity] || '',
      platform_type: 'Not specified',
      page_name: fields.page_name || '',
      product_tag_id: fields.product_tag_id || null,
      product_tag_name: tag?.tag_name || '',
      found_in_build_id: fields.found_in_build_id || null,
      found_in_build_name: fields.found_in_build_name || '',
      details: fields.details.trim(),
      // Kept for local display; also sent as a screenshot record so the API
      // persists it through the existing screenshots table.
      screenshot_link: fields.screenshot_link.trim(),
      screenshots: fields.screenshot_link.trim()
        ? [{ drive_url: fields.screenshot_link.trim(), filename: 'screenshot' }]
        : [],
    };
    try {
      // Persist any theme add/removes to the project alongside the failure.
      if (onSaveThemes) {
        await onSaveThemes({
          audit_theme_ids: themes.map(t => t.value),
          audit_theme_names: themes.map(t => t.name),
        });
      }
      await onSave(failure);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="lfp-overlay" onMouseDown={onClose}>
      <aside
        ref={panelRef}
        className="lfp-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lfp-title"
        onMouseDown={e => e.stopPropagation()}
      >
        <header className="lfp-header">
          <h2 id="lfp-title">{isEdit ? 'Edit failure' : 'Log failure'}</h2>
          <div className="lfp-header-right">
            <p className="field-hint lfp-required-note">
              Fields marked <span aria-hidden="true">*</span>
              <span className="visually-hidden">with an asterisk</span> are required.
            </p>
            <button type="button" className="lfp-close" aria-label="Close panel" onClick={onClose}>
              &times;
            </button>
          </div>
        </header>

        <form className="lfp-body" onSubmit={handleSubmit} noValidate>
          {/* Subject */}
          <div className="field">
            <label htmlFor="subject" className="required">Subject</label>
            <input
              ref={firstFieldRef}
              id="subject"
              type="text"
              value={fields.subject}
              onChange={e => setField('subject', e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.subject}
              className="lfp-subject-input"
              placeholder="Type what you find the accessibility issue"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {errors.subject && <span className="field-error" role="alert">{errors.subject}</span>}
          </div>

          {/* Failure scenario — searchable, sourced from the issue library. The
              choice drives the WCAG criterion below. */}
          <div className="field">
            <label htmlFor="failure_scenario" className="required">Failure scenario</label>
            <FailureScenarioPicker
              id="failure_scenario"
              value={fields.failure_scenario}
              onChange={handleScenarioChange}
            />
            {errors.failure_scenario && (
              <span className="field-error" role="alert">{errors.failure_scenario}</span>
            )}
          </div>

          {/* WCAG criterion, Priority, and Impact share one row. The criterion
              and impact are read-only (auto-filled from the scenario); the
              priority pills auto-select but can be changed. */}
          <div className="field">
            <div className="lfp-triple-row">
              <div className="lfp-col lfp-col-wcag">
                <label htmlFor="wcag_criterion">WCAG success criterion</label>
                <input
                  id="wcag_criterion"
                  type="text"
                  value={fields.wcag_criterion}
                  readOnly
                  tabIndex={-1}
                  aria-invalid={!!errors.wcag_criterion}
                  placeholder="Auto-filled from the selected failure scenario"
                />
              </div>

              <div className="lfp-severity-field">
                <span className="lfp-severity-hint" id="lfp-severity-hint">
                  You can change your priority
                </span>
                <div
                  className="lfp-severity-pills"
                  role="group"
                  aria-labelledby="lfp-severity-hint"
                >
                  {SEVERITIES.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`severity-btn severity-${p.toLowerCase()}`}
                      aria-pressed={fields.severity === p}
                      onClick={() => setField('severity', p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lfp-col lfp-col-impact">
                <label htmlFor="impact">Impact</label>
                <input
                  id="impact"
                  type="text"
                  value={impact}
                  readOnly
                  tabIndex={-1}
                  placeholder="Auto-filled from the priority"
                />
              </div>
            </div>
            {errors.wcag_criterion && (
              <span className="field-error" role="alert">{errors.wcag_criterion}</span>
            )}
            {duplicate && (
              <div className="alert alert-warning" role="alert">
                This criterion is already logged for this page (issue #{duplicate.sf_issue_id}).
              </div>
            )}
          </div>

          {/* Page — optional, but drives duplicate detection */}
          {scopeOptions.length > 0 && (
            <div className="field">
              <label htmlFor="page_name">Page or component</label>
              <select
                id="page_name"
                value={fields.page_name || ''}
                onChange={e => setField('page_name', e.target.value)}
              >
                <option value="">Select or leave blank</option>
                {scopeOptions.map(s => (
                  <option key={s.id} value={s.page_name}>{s.page_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Product tag + Found in build, side by side. */}
          <div className="lfp-pair-row">
            {tagOptions.length > 0 && (
              <div className="field">
                <label htmlFor="product_tag_id">Product tag</label>
                <select
                  id="product_tag_id"
                  value={fields.product_tag_id}
                  onChange={e => setField('product_tag_id', e.target.value)}
                >
                  <option value="">Select tag</option>
                  {tagOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.tag_name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Found in build — searchable, auto-fetched from GUS */}
            <div className="field">
              <label htmlFor="found_in_build">Found in build</label>
              <BuildPicker
                id="found_in_build"
                value={fields.found_in_build_name}
                onChange={() => setFields(f => ({ ...f, found_in_build_id: '', found_in_build_name: '' }))}
                onSelect={b => setFields(f => ({ ...f, found_in_build_id: b.id, found_in_build_name: b.name }))}
              />
            </div>
          </div>

          {/* Applied audit themes — project-level. Existing themes can be
              removed and new ones added; changes save with the panel. */}
          <div className="field">
            <label htmlFor="lfp_add_theme">Audit themes applied</label>
            {themes.length > 0 ? (
              <ul className="lfp-theme-list">
                {themes.map(t => (
                  <li key={t.value} className="lfp-theme-chip">
                    <span className="lfp-theme-chip-label">{t.name || t.value}</span>
                    <button
                      type="button"
                      className="lfp-theme-chip-remove"
                      onClick={() => removeTheme(t.value)}
                      aria-label={`Remove theme ${t.name || t.value}`}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="field-hint">No audit themes applied yet.</p>
            )}
            <AuditThemePicker
              key={themePickerKey}
              id="lfp_add_theme"
              value=""
              onChange={(value, name) => addTheme(value, name)}
            />
          </div>

          {/* Screenshot drive link */}
          <div className="field">
            <label htmlFor="screenshot_link">Screenshot drive link</label>
            <input
              id="screenshot_link"
              type="url"
              value={fields.screenshot_link}
              onChange={e => setField('screenshot_link', e.target.value)}
              placeholder="https://drive.google.com/..."
              autoComplete="off"
            />
          </div>

          {/* Details / description */}
          <div className="field">
            <label htmlFor="details">Details / description</label>
            <textarea
              id="details"
              rows={4}
              value={fields.details}
              onChange={e => setField('details', e.target.value)}
              placeholder="Describe the issue, expected behaviour, and any context."
            />
          </div>

          <div className="lfp-actions">
            <button type="submit" className="btn btn-primary" disabled={saving} aria-disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Save failure')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
