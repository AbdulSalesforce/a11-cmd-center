import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BUILD_IDS = [
  { label: '256 — Summer \'25', build_name: '256', build_id: 'a06EE000004rIFrYAM' },
  { label: '258 — Winter \'26', build_name: '258', build_id: 'a06EE000004rIFsYAM' },
  { label: '260 — Spring \'26', build_name: '260', build_id: 'a06900000009Q0dAAE' },
];

function makeAuditor() { return { id: crypto.randomUUID(), name: '', email: '' }; }
function makeTag()     { return { id: crypto.randomUUID(), tag_name: '', tag_id: '' }; }
function makeScope()   { return { id: crypto.randomUUID(), page_name: '', url: '' }; }

export default function NewProject() {
  const navigate = useNavigate();

  const [fields, setFields] = useState({
    product_name: '',
    auditor_name: '',
    pm_name: '',
    pm_email: '',
    login_path: '',
    slack_channel: '',
    release_build: '',
    audit_theme_id: '',
    epic_id: '',
  });

  const [multipleAuditors, setMultipleAuditors] = useState(false);
  const [auditors, setAuditors] = useState([makeAuditor()]);
  const [tags, setTags] = useState([]);
  const [scope, setScope] = useState([makeScope()]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function setField(name, value) {
    setFields(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  // ── Auditor helpers ──
  function updateAuditor(id, key, value) {
    setAuditors(list => list.map(a => a.id === id ? { ...a, [key]: value } : a));
  }
  function addAuditor() { setAuditors(list => [...list, makeAuditor()]); }
  function removeAuditor(id) { setAuditors(list => list.filter(a => a.id !== id)); }

  // ── Tag helpers ──
  function updateTag(id, key, value) {
    setTags(list => list.map(t => t.id === id ? { ...t, [key]: value } : t));
  }
  function addTag() { setTags(list => [...list, makeTag()]); }
  function removeTag(id) { setTags(list => list.filter(t => t.id !== id)); }

  // ── Scope helpers ──
  function updateScope(id, key, value) {
    setScope(list => list.map(s => s.id === id ? { ...s, [key]: value } : s));
  }
  function addScope() { setScope(list => [...list, makeScope()]); }
  function removeScope(id) { setScope(list => list.filter(s => s.id !== id)); }

  function validate() {
    const errs = {};
    if (!fields.product_name.trim()) errs.product_name = 'Product name is required.';
    if (!multipleAuditors && !fields.auditor_name.trim()) {
      errs.auditor_name = 'Auditor name is required.';
    }
    if (multipleAuditors) {
      auditors.forEach((a, i) => {
        if (!a.name.trim()) errs[`auditor_name_${i}`] = 'Auditor name is required.';
      });
    }
    scope.forEach((s, i) => {
      if (!s.page_name.trim()) errs[`scope_name_${i}`] = 'Page or component name is required.';
    });
    tags.forEach((t, i) => {
      if (!t.tag_name.trim()) errs[`tag_name_${i}`] = 'Tag name is required.';
      if (!t.tag_id.trim()) errs[`tag_id_${i}`] = 'Tag ID is required.';
    });
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const build = BUILD_IDS.find(b => b.build_name === fields.release_build);

    const body = {
      product_name: fields.product_name.trim(),
      auditor_name: fields.auditor_name.trim() || null,
      pm_name: fields.pm_name.trim() || null,
      pm_email: fields.pm_email.trim() || null,
      login_path: fields.login_path.trim() || null,
      slack_channel: fields.slack_channel.trim() || null,
      release_build_name: build?.build_name || null,
      release_build_id: build?.build_id || null,
      audit_theme_id: fields.audit_theme_id.trim() || null,
      epic_id: fields.epic_id.trim() || null,
      auditors: multipleAuditors ? auditors.map(a => ({ name: a.name.trim(), email: a.email.trim() || null })) : [],
      product_tags: tags.map(t => ({ tag_name: t.tag_name.trim(), tag_id: t.tag_id.trim() })),
      scope_items: scope.filter(s => s.page_name.trim()).map(s => ({ page_name: s.page_name.trim(), url: s.url.trim() || null })),
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const project = await res.json();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setSubmitError('Failed to create project. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="slds-scope">
      <div style={{
        background: 'linear-gradient(to right, #1B5F9E, #2E70B8)',
        padding: '2rem 2rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '2rem',
          fontWeight: '700',
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          New Project
        </h1>
        <p style={{
          color: '#ffffff',
          fontSize: '0.875rem',
          margin: 0,
          opacity: 0.9
        }}>
          Create a new accessibility audit project
        </p>
      </div>

      <div className="page-section">
      <p className="field-hint" style={{ marginBottom: 'var(--space-8)' }}>
        Fields marked <span aria-hidden="true">*</span><span className="visually-hidden">with an asterisk</span> are required.
      </p>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Product Info ── */}
        <section aria-labelledby="section-product">
          <h3 id="section-product" style={{ marginBottom: 'var(--space-5)' }}>Product information</h3>
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="product_name" className="required">Product name</label>
              <input
                id="product_name"
                type="text"
                value={fields.product_name}
                onChange={e => setField('product_name', e.target.value)}
                aria-required="true"
                aria-describedby={errors.product_name ? 'product_name_err' : undefined}
                aria-invalid={!!errors.product_name}
                autoComplete="off"
              />
              {errors.product_name && (
                <span id="product_name_err" className="field-error" role="alert">{errors.product_name}</span>
              )}
            </div>

            <div className="field field-full">
              <label htmlFor="login_path">Login and navigation path</label>
              <input
                id="login_path"
                type="url"
                value={fields.login_path}
                onChange={e => setField('login_path', e.target.value)}
                placeholder="https://..."
              />
              <span className="field-hint">URL or steps needed to reach the product being audited.</span>
            </div>

            <div className="field">
              <label htmlFor="release_build">Release / build</label>
              <select
                id="release_build"
                value={fields.release_build}
                onChange={e => setField('release_build', e.target.value)}
              >
                <option value="">Select a release</option>
                {BUILD_IDS.map(b => (
                  <option key={b.build_name} value={b.build_name}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="slack_channel">Slack channel</label>
              <input
                id="slack_channel"
                type="text"
                value={fields.slack_channel}
                onChange={e => setField('slack_channel', e.target.value)}
                placeholder="#channel-name"
              />
            </div>

            <div className="field">
              <label htmlFor="audit_theme_id">Audit theme ID</label>
              <input
                id="audit_theme_id"
                type="text"
                value={fields.audit_theme_id}
                onChange={e => setField('audit_theme_id', e.target.value)}
              />
              <span className="field-hint">Created by the ACR program.</span>
            </div>

            <div className="field">
              <label htmlFor="epic_id">Epic ID</label>
              <input
                id="epic_id"
                type="text"
                value={fields.epic_id}
                onChange={e => setField('epic_id', e.target.value)}
              />
              <span className="field-hint">Optional.</span>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── Auditor ── */}
        <section aria-labelledby="section-auditor">
          <h3 id="section-auditor" style={{ marginBottom: 'var(--space-5)' }}>Primary auditor</h3>
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="auditor_name" className="required">Auditor name</label>
              <input
                id="auditor_name"
                type="text"
                value={fields.auditor_name}
                onChange={e => setField('auditor_name', e.target.value)}
                placeholder="Your name"
                aria-required="true"
                aria-describedby={errors.auditor_name ? 'auditor_name_err' : undefined}
                aria-invalid={!!errors.auditor_name}
              />
              {errors.auditor_name && (
                <span id="auditor_name_err" className="field-error" role="alert">{errors.auditor_name}</span>
              )}
              <span className="field-hint">The lead auditor for this project. You can add additional auditors below.</span>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── Product Lead ── */}
        <section aria-labelledby="section-lead">
          <h3 id="section-lead" style={{ marginBottom: 'var(--space-5)' }}>Product lead</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pm_name">PM name</label>
              <input
                id="pm_name"
                type="text"
                value={fields.pm_name}
                onChange={e => setField('pm_name', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="pm_email">PM email</label>
              <input
                id="pm_email"
                type="email"
                value={fields.pm_email}
                onChange={e => setField('pm_email', e.target.value)}
              />
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* ── Auditors ── */}
        <section aria-labelledby="section-auditors">
          <h3 id="section-auditors" style={{ marginBottom: 'var(--space-5)' }}>Auditors</h3>

          <div className="field" style={{ marginBottom: 'var(--space-5)' }}>
            <fieldset>
              <legend>Is this a multi-auditor engagement?</legend>
              <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'var(--font-normal)', marginBottom: 0 }}>
                  <input
                    type="radio"
                    name="multi_auditor"
                    value="no"
                    checked={!multipleAuditors}
                    onChange={() => setMultipleAuditors(false)}
                  />
                  No — just me
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 'var(--font-normal)', marginBottom: 0 }}>
                  <input
                    type="radio"
                    name="multi_auditor"
                    value="yes"
                    checked={multipleAuditors}
                    onChange={() => setMultipleAuditors(true)}
                  />
                  Yes — multiple auditors
                </label>
              </div>
            </fieldset>
          </div>

          {multipleAuditors && (
            <div className="repeat-group" role="list" aria-label="Auditor list">
              {auditors.map((auditor, i) => (
                <div key={auditor.id} className="repeat-item" role="listitem">
                  <div className="field">
                    <label htmlFor={`auditor_name_${i}`} className="required">Name</label>
                    <input
                      id={`auditor_name_${i}`}
                      type="text"
                      value={auditor.name}
                      onChange={e => updateAuditor(auditor.id, 'name', e.target.value)}
                      aria-required="true"
                      aria-invalid={!!errors[`auditor_name_${i}`]}
                      aria-describedby={errors[`auditor_name_${i}`] ? `auditor_name_${i}_err` : undefined}
                    />
                    {errors[`auditor_name_${i}`] && (
                      <span id={`auditor_name_${i}_err`} className="field-error" role="alert">{errors[`auditor_name_${i}`]}</span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor={`auditor_email_${i}`}>Email</label>
                    <input
                      id={`auditor_email_${i}`}
                      type="email"
                      value={auditor.email}
                      onChange={e => updateAuditor(auditor.id, 'email', e.target.value)}
                    />
                  </div>
                  {auditors.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => removeAuditor(auditor.id)}
                      aria-label={`Remove auditor ${auditor.name || i + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm add-item-btn" onClick={addAuditor}>
                + Add auditor
              </button>
            </div>
          )}
        </section>

        <hr className="divider" />

        {/* ── Product Tags ── */}
        <section aria-labelledby="section-tags">
          <h3 id="section-tags" style={{ marginBottom: 'var(--space-2)' }}>Product tags</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-5)' }}>
            Optional. Add the Salesforce product tag name and numeric ID pairs for this audit.
          </p>

          <div className="repeat-group" role="list" aria-label="Product tag list">
            {tags.map((tag, i) => (
              <div key={tag.id} className="repeat-item" role="listitem">
                <div className="field">
                  <label htmlFor={`tag_name_${i}`} className="required">Tag name</label>
                  <input
                    id={`tag_name_${i}`}
                    type="text"
                    value={tag.tag_name}
                    onChange={e => updateTag(tag.id, 'tag_name', e.target.value)}
                    placeholder="PT ABC"
                    aria-required="true"
                    aria-invalid={!!errors[`tag_name_${i}`]}
                    aria-describedby={errors[`tag_name_${i}`] ? `tag_name_${i}_err` : undefined}
                  />
                  {errors[`tag_name_${i}`] && (
                    <span id={`tag_name_${i}_err`} className="field-error" role="alert">{errors[`tag_name_${i}`]}</span>
                  )}
                </div>
                <div className="field">
                  <label htmlFor={`tag_id_${i}`} className="required">Tag ID</label>
                  <input
                    id={`tag_id_${i}`}
                    type="text"
                    value={tag.tag_id}
                    onChange={e => updateTag(tag.id, 'tag_id', e.target.value)}
                    placeholder="1234567"
                    aria-required="true"
                    aria-invalid={!!errors[`tag_id_${i}`]}
                    aria-describedby={errors[`tag_id_${i}`] ? `tag_id_${i}_err` : undefined}
                  />
                  {errors[`tag_id_${i}`] && (
                    <span id={`tag_id_${i}_err`} className="field-error" role="alert">{errors[`tag_id_${i}`]}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeTag(tag.id)}
                  aria-label={`Remove tag ${tag.tag_name || i + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm add-item-btn" onClick={addTag}>
            + Add product tag
          </button>
        </section>

        <hr className="divider" />

        {/* ── Audit scope ── */}
        <section aria-labelledby="section-scope">
          <h3 id="section-scope" style={{ marginBottom: 'var(--space-2)' }}>Audit scope</h3>
          <p className="field-hint" style={{ marginBottom: 'var(--space-5)' }}>
            List the pages or components to be audited. Used to track progress.
          </p>

          <div className="repeat-group" role="list" aria-label="Audit scope items">
            {scope.map((item, i) => (
              <div key={item.id} className="repeat-item" role="listitem">
                <div className="field">
                  <label htmlFor={`scope_name_${i}`} className="required">Page or component</label>
                  <input
                    id={`scope_name_${i}`}
                    type="text"
                    value={item.page_name}
                    onChange={e => updateScope(item.id, 'page_name', e.target.value)}
                    placeholder="e.g. Chat window"
                    aria-required="true"
                    aria-invalid={!!errors[`scope_name_${i}`]}
                    aria-describedby={errors[`scope_name_${i}`] ? `scope_name_${i}_err` : undefined}
                  />
                  {errors[`scope_name_${i}`] && (
                    <span id={`scope_name_${i}_err`} className="field-error" role="alert">{errors[`scope_name_${i}`]}</span>
                  )}
                </div>
                <div className="field">
                  <label htmlFor={`scope_url_${i}`}>URL</label>
                  <input
                    id={`scope_url_${i}`}
                    type="url"
                    value={item.url}
                    onChange={e => updateScope(item.id, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                {scope.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeScope(item.id)}
                    aria-label={`Remove scope item ${item.page_name || i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary btn-sm add-item-btn" onClick={addScope}>
            + Add scope item
          </button>
        </section>

        {submitError && (
          <div className="alert alert-error" role="alert" style={{ marginTop: 'var(--space-6)' }}>
            {submitError}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-disabled={submitting}>
            {submitting ? 'Creating project…' : 'Create project'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/audits')}>
            Cancel
          </button>
        </div>

      </form>
      </div>
    </div>
  );
}
