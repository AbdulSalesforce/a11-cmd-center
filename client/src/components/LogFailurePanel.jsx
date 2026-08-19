import { useState, useEffect, useRef } from 'react';
import WcagPicker from './WcagPicker';
import { getSuggestedSeverity, WCAG_CRITERIA } from '../data/wcag';
import '../styles/log-failure-panel.css';

const PLATFORMS = ['Desktop', 'Mobile', 'Web Mobile'];
const MOBILE_OS = ['Android', 'iOS', 'Both'];

const EMPTY = {
  subject: '',
  wcag_criterion: '',
  severity: '',
  mobile_os: '',
  product_tag_id: '',
};

// Slide-in side panel for quickly logging a failure with just the required
// fields. Mounting the component opens it; the parent unmounts it to close, so
// the form always starts fresh. On save it calls onSave(failure) with a
// normalized failure object and leaves persistence/table-refresh to the parent.
export default function LogFailurePanel({ onClose, onSave, project, existingFailures = [] }) {
  const [fields, setFields] = useState(EMPTY);
  const [platforms, setPlatforms] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);

  const tagOptions = project?.product_tags ?? [];
  const scopeOptions = project?.scope_items ?? [];
  const isMobile = platforms.some(p => p === 'Mobile' || p === 'Web Mobile');

  // Move focus into the panel once mounted.
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

  function handleWcagChange(criterion) {
    setField('wcag_criterion', criterion);
    if (criterion) {
      const c = WCAG_CRITERIA.find(c => c.full === criterion);
      if (c && !fields.severity) setField('severity', getSuggestedSeverity(c.id));
    }
  }

  function togglePlatform(platform) {
    setPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]);
    if (errors.platforms) setErrors(e => ({ ...e, platforms: '' }));
  }

  function validate() {
    const errs = {};
    if (!fields.subject.trim()) errs.subject = 'Subject is required.';
    if (!fields.wcag_criterion) errs.wcag_criterion = 'WCAG criterion is required.';
    if (platforms.length === 0) errs.platforms = 'At least one platform is required.';
    if (!fields.severity) errs.severity = 'Severity is required.';
    if (isMobile && !fields.mobile_os) errs.mobile_os = 'Mobile OS is required for mobile platforms.';
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
    const failure = {
      subject: fields.subject.trim(),
      wcag_criterion: fields.wcag_criterion,
      severity: fields.severity,
      platform_type: platforms.join(', '),
      mobile_os: isMobile ? fields.mobile_os : '',
      page_name: fields.page_name || '',
      product_tag_id: fields.product_tag_id || null,
      product_tag_name: tag?.tag_name || '',
    };
    try {
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
          <h2 id="lfp-title">Log failure</h2>
          <button type="button" className="lfp-close" aria-label="Close panel" onClick={onClose}>
            &times;
          </button>
        </header>

        <form className="lfp-body" onSubmit={handleSubmit} noValidate>
          <p className="field-hint lfp-required-note">
            Fields marked <span aria-hidden="true">*</span>
            <span className="visually-hidden">with an asterisk</span> are required.
          </p>

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
              placeholder="Brief description of the issue"
            />
            {errors.subject && <span className="field-error" role="alert">{errors.subject}</span>}
          </div>

          {/* WCAG criterion */}
          <div className="field">
            <label htmlFor="wcag_criterion" className="required">WCAG success criterion</label>
            <WcagPicker
              value={fields.wcag_criterion}
              onChange={handleWcagChange}
              error={errors.wcag_criterion}
            />
            {errors.wcag_criterion && (
              <span className="field-error" role="alert">{errors.wcag_criterion}</span>
            )}
            {duplicate && (
              <div className="alert alert-warning" role="alert">
                This criterion is already logged for this page (issue #{duplicate.sf_issue_id}).
              </div>
            )}
          </div>

          {/* Severity */}
          <div className="field">
            <fieldset>
              <legend className="required">Severity</legend>
              <div className="severity-group" id="severity">
                {['P1', 'P2', 'P3'].map(p => (
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
            </fieldset>
            {errors.severity && <span className="field-error" role="alert">{errors.severity}</span>}
          </div>

          {/* Platform */}
          <div className="field">
            <fieldset>
              <legend className="required">Platform</legend>
              <div className="checkbox-group" id="platforms">
                {PLATFORMS.map(p => (
                  <label key={p} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={platforms.includes(p)}
                      onChange={() => togglePlatform(p)}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </fieldset>
            {errors.platforms && <span className="field-error" role="alert">{errors.platforms}</span>}
          </div>

          {/* Mobile OS — conditional */}
          {isMobile && (
            <div className="field">
              <label htmlFor="mobile_os" className="required">Mobile OS</label>
              <select
                id="mobile_os"
                value={fields.mobile_os}
                onChange={e => setField('mobile_os', e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.mobile_os}
              >
                <option value="">Select OS</option>
                {MOBILE_OS.map(os => <option key={os} value={os}>{os}</option>)}
              </select>
              {errors.mobile_os && <span className="field-error" role="alert">{errors.mobile_os}</span>}
            </div>
          )}

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

          {/* Product tag — required per the audit template when tags exist */}
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

          <div className="lfp-actions">
            <button type="submit" className="btn btn-primary" disabled={saving} aria-disabled={saving}>
              {saving ? 'Saving…' : 'Save failure'}
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
