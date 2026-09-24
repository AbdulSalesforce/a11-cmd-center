import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addStoredProject, getStoredProject, updateStoredProject } from '../data/projectStore';
import AuditThemePicker from '../components/AuditThemePicker';
import ProductTagPicker from '../components/ProductTagPicker';
import EmployeePicker from '../components/EmployeePicker';
import { useAuth } from '../context/auth-context';

const BUILD_IDS = [
  { label: '256 — Summer \'25', build_name: '256', build_id: 'a06EE000004rIFrYAM' },
  { label: '258 — Winter \'26', build_name: '258', build_id: 'a06EE000004rIFsYAM' },
  { label: '260 — Spring \'26', build_name: '260', build_id: 'a06900000009Q0dAAE' },
  // Even-numbered builds 262–280. Salesforce build ids aren't known yet, so
  // they're left blank until the real ADM_Build__c ids are wired in.
  { label: '262', build_name: '262', build_id: '' },
  { label: '264', build_name: '264', build_id: '' },
  { label: '266', build_name: '266', build_id: '' },
  { label: '268', build_name: '268', build_id: '' },
  { label: '270', build_name: '270', build_id: '' },
  { label: '272', build_name: '272', build_id: '' },
  { label: '274', build_name: '274', build_id: '' },
  { label: '276', build_name: '276', build_id: '' },
  { label: '278', build_name: '278', build_id: '' },
  { label: '280', build_name: '280', build_id: '' },
];

function makeAuditor() { return { id: crypto.randomUUID(), name: '', email: '' }; }
function makeTag()     { return { id: crypto.randomUUID(), tag_name: '', tag_id: '' }; }
function makeScope()   { return { id: crypto.randomUUID(), page_name: '', url: '' }; }
function makeTheme()   { return { id: crypto.randomUUID(), value: '', name: '' }; }

// ── Edit-mode hydration ── Derive form state from an existing project (or null
// for a blank form). Scope rows keep their real DB ids so the server can
// reconcile them on save and preserve each item's checklist progress.
function fieldsFrom(p) {
  // The DB only stores the combined product_name; split it back into the two
  // form fields when the project doesn't carry them separately.
  const [cloudPart, ...featureParts] = (p?.product_name || '').split(' — ');
  return {
    cloud_name: p?.cloud_name ?? (cloudPart || ''),
    feature_epic: p?.feature_epic ?? featureParts.join(' — '),
    auditor_name: p?.auditor_name || '',
    pm_name: p?.pm_name || '',
    pm_email: p?.pm_email || '',
    login_path: p?.login_path || '',
    slack_channel: p?.slack_channel || '',
    release_build: p?.release_build_name || '',
    epic_id: p?.epic_id || '',
  };
}
function themesFrom(p) {
  const vals = p?.audit_theme_ids?.length ? p.audit_theme_ids : (p?.audit_theme_id ? [p.audit_theme_id] : []);
  const names = p?.audit_theme_names ?? [];
  return vals.length
    ? vals.map((v, i) => ({ id: crypto.randomUUID(), value: v, name: names[i] || '' }))
    : [makeTheme()];
}
function tagsFrom(p) {
  return p?.product_tags?.length
    ? p.product_tags.map(t => ({ id: t.id || crypto.randomUUID(), tag_name: t.tag_name || '', tag_id: t.tag_id || '' }))
    : [makeTag()];
}
function scopeFrom(p) {
  return p?.scope_items?.length
    ? p.scope_items.map(s => ({ id: s.id || crypto.randomUUID(), page_name: s.page_name || '', url: s.url || '' }))
    : [makeScope()];
}
function auditorsFrom(p) {
  return p?.auditors?.length
    ? p.auditors.map(a => ({ id: a.id || crypto.randomUUID(), name: a.name || '', email: a.email || '' }))
    : [makeAuditor()];
}

// A collapsible form section. The heading is a real <h3> wrapping a toggle
// button (aria-expanded / aria-controls), and the panel is a labelled region
// that is hidden — not unmounted — when collapsed so form state is preserved.
function AccordionSection({ id, title, titleClassName, open, onToggle, children }) {
  const panelId = `${id}-panel`;
  return (
    <section className="accordion-section" aria-labelledby={id}>
      <h3 className="accordion-heading">
        <button
          type="button"
          id={id}
          className="accordion-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="accordion-chevron" aria-hidden="true">▸</span>
          <span className={titleClassName}>{title}</span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={id} className="accordion-panel" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export default function NewProject() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);
  const { user } = useAuth();

  // Locally-stored projects can hydrate the form synchronously; API-backed ones
  // are fetched in the effect below.
  const localProject = useMemo(() => (isEdit ? getStoredProject(editId) : null), [isEdit, editId]);
  const [loadingProject, setLoadingProject] = useState(isEdit && !localProject);

  // A new project defaults to a single ("No") engagement, so seed the auditor
  // name with the signed-in user — they're presumed to be the lone auditor.
  const [fields, setFields] = useState(() => {
    const f = fieldsFrom(localProject);
    if (!isEdit && !f.auditor_name) f.auditor_name = user?.name || '';
    return f;
  });

  // Audit themes are a repeatable list — an audit can roll up to more than one
  // GUS theme. The first is required.
  const [themes, setThemes] = useState(() => themesFrom(localProject));

  // Accordion open/closed state — every section starts expanded.
  const [openSections, setOpenSections] = useState({
    product: true, auditors: true, lead: true, scope: true, import: true,
  });
  const toggleSection = key => setOpenSections(s => ({ ...s, [key]: !s[key] }));
  const expandAll = () =>
    setOpenSections(s => Object.fromEntries(Object.keys(s).map(k => [k, true])));

  const [multipleAuditors, setMultipleAuditors] = useState(Boolean(localProject?.auditors?.length));
  const [auditors, setAuditors] = useState(() => auditorsFrom(localProject));
  const [tags, setTags] = useState(() => tagsFrom(localProject));
  const [scope, setScope] = useState(() => scopeFrom(localProject));

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [googleDocUrl, setGoogleDocUrl] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docError, setDocError] = useState('');

  // ── Edit mode ── Fetch the project from the API and hydrate the form when it
  // isn't already available from local storage. setState here runs inside the
  // async callbacks (not synchronously in the effect body), so form state stays
  // owned by React while the load is in flight.
  useEffect(() => {
    if (!isEdit || localProject) return;
    let cancelled = false;

    fetch(`/api/projects/${editId}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then(p => {
        if (cancelled) return;
        setFields(fieldsFrom(p));
        setThemes(themesFrom(p));
        setTags(tagsFrom(p));
        setScope(scopeFrom(p));
        if (p.auditors?.length) {
          setMultipleAuditors(true);
          setAuditors(auditorsFrom(p));
        }
      })
      .catch(() => { if (!cancelled) setSubmitError('Could not load this project for editing.'); })
      .finally(() => { if (!cancelled) setLoadingProject(false); });

    return () => { cancelled = true; };
  }, [isEdit, editId, localProject]);

  function setField(name, value) {
    setFields(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  async function loadFromGoogleDoc() {
    if (!googleDocUrl.trim()) {
      setDocError('Please enter a Google Doc URL');
      return;
    }

    setLoadingDoc(true);
    setDocError('');

    try {
      const res = await fetch('/api/google-doc/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: googleDocUrl }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load document');
      }

      const data = await res.json();

      // Auto-populate fields from parsed data
      if (data.product_name) setField('cloud_name', data.product_name);
      if (data.pm_name) setField('pm_name', data.pm_name);
      if (data.pm_email) setField('pm_email', data.pm_email);
      if (data.login_path) setField('login_path', data.login_path);
      if (data.slack_channel) setField('slack_channel', data.slack_channel);
      if (data.audit_theme_id) setThemes([{ id: crypto.randomUUID(), value: data.audit_theme_id }]);
      if (data.auditor_name) setField('auditor_name', data.auditor_name);

      // Populate scope items if found
      if (data.scope_items && data.scope_items.length > 0) {
        setScope(data.scope_items.map(s => ({ id: crypto.randomUUID(), page_name: s.page_name || s, url: s.url || '' })));
      }

      // Populate product tags if found
      if (data.product_tags && data.product_tags.length > 0) {
        setTags(data.product_tags.map(t => ({
          id: crypto.randomUUID(),
          tag_name: t.tag_name || t,
          tag_id: t.tag_id || ''
        })));
      }

      // Show success message
      setDocError(''); // Clear any previous errors

    } catch (err) {
      setDocError(err.message);
    } finally {
      setLoadingDoc(false);
    }
  }

  // ── Auditor helpers ──
  function updateAuditor(id, key, value) {
    setAuditors(list => list.map(a => a.id === id ? { ...a, [key]: value } : a));
  }
  // Patch several auditor fields at once (used when a GUS employee is picked so
  // name + email land together).
  function updateAuditorFields(id, patch) {
    setAuditors(list => list.map(a => a.id === id ? { ...a, ...patch } : a));
  }
  function addAuditor() { setAuditors(list => [...list, makeAuditor()]); }
  function removeAuditor(id) { setAuditors(list => list.filter(a => a.id !== id)); }

  // Switching to a single-auditor ("No") engagement auto-fills the auditor name
  // with the signed-in user, unless they've already typed one.
  function selectSingleAuditor() {
    setMultipleAuditors(false);
    setFields(f => (f.auditor_name.trim() ? f : { ...f, auditor_name: user?.name || '' }));
  }

  // ── Tag helpers ──
  // Patch one or more tag fields at once (used when a GUS tag is picked so name
  // + id land together).
  function updateTagFields(id, patch) {
    setTags(list => list.map(t => t.id === id ? { ...t, ...patch } : t));
  }
  function addTag() { setTags(list => [...list, makeTag()]); }
  function removeTag(id) {
    setTags(list => list.length > 1 ? list.filter(t => t.id !== id) : list);
  }

  // ── Theme helpers ──
  function updateTheme(rowId, value, name = '') {
    setThemes(list => list.map(t => t.id === rowId ? { ...t, value, name } : t));
    if (errors.audit_theme_id) setErrors(e => ({ ...e, audit_theme_id: '' }));
  }
  function addTheme() { setThemes(list => [...list, makeTheme()]); }
  function removeTheme(rowId) {
    setThemes(list => list.length > 1 ? list.filter(t => t.id !== rowId) : list);
  }

  // ── Scope helpers ──
  function updateScope(id, key, value) {
    setScope(list => list.map(s => s.id === id ? { ...s, [key]: value } : s));
  }
  function addScope() { setScope(list => [...list, makeScope()]); }
  function removeScope(id) { setScope(list => list.filter(s => s.id !== id)); }

  function validate() {
    const errs = {};

    // At least one audit theme ID is mandatory.
    if (!themes.some(t => t.value.trim())) errs.audit_theme_id = 'Select at least one audit theme from the GUS search results.';

    // At least one product tag is mandatory.
    if (tags.length === 0) {
      errs.tags = 'At least one product tag is required.';
    }
    tags.forEach((t, i) => {
      if (!t.tag_name.trim()) errs[`tag_name_${i}`] = 'Select a product tag from the GUS search results.';
      else if (!t.tag_id.trim()) errs[`tag_id_${i}`] = 'Select the tag from the list so its ID is filled in.';
    });

    // Everything else (cloud name, feature/epic, auditors, scope, etc.) is optional.
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // A collapsed section hides its fields, so expand everything before
      // focusing — otherwise the field is un-focusable. Focus after the
      // re-render so the target is visible in the DOM.
      expandAll();
      const firstKey = Object.keys(errs)[0];
      setTimeout(() => document.getElementById(firstKey)?.focus(), 0);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const build = BUILD_IDS.find(b => b.build_name === fields.release_build);
    // Keep ids and names index-aligned by filtering whole rows, not each list.
    const themeRows = themes.filter(t => t.value.trim());
    const themeValues = themeRows.map(t => t.value.trim());
    const themeNames = themeRows.map(t => (t.name || '').trim());

    const cloud = fields.cloud_name.trim();
    const feature = fields.feature_epic.trim();
    // Combine the two name parts into the product_name the rest of the app uses.
    const productName = [cloud, feature].filter(Boolean).join(' — ') || 'Untitled project';

    const body = {
      product_name: productName,
      cloud_name: cloud || null,
      feature_epic: feature || null,
      auditor_name: fields.auditor_name.trim() || null,
      pm_name: fields.pm_name.trim() || null,
      pm_email: fields.pm_email.trim() || null,
      login_path: fields.login_path.trim() || null,
      slack_channel: fields.slack_channel.trim() || null,
      release_build_name: build?.build_name || null,
      release_build_id: build?.build_id || null,
      audit_theme_id: themeValues[0] || '',
      audit_theme_ids: themeValues,
      audit_theme_names: themeNames,
      epic_id: fields.epic_id.trim() || null,
      auditors: multipleAuditors ? auditors.map(a => ({ id: a.id, name: a.name.trim(), email: a.email.trim() || null })) : [],
      product_tags: tags.map(t => ({ id: t.id, tag_name: t.tag_name.trim(), tag_id: t.tag_id.trim() })),
      // Keep the scope row's id so the server can reconcile on edit (POST ignores it).
      scope_items: scope.filter(s => s.page_name.trim()).map(s => ({ id: s.id, page_name: s.page_name.trim(), url: s.url.trim() || null })),
    };

    try {
      const res = await fetch(isEdit ? `/api/projects/${editId}` : '/api/projects', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const project = await res.json();
      navigate(`/projects/${isEdit ? editId : project.id}`);
    } catch {
      // API unavailable — persist locally so the change still shows up.
      if (isEdit) {
        updateStoredProject(editId, body);
        navigate(`/projects/${editId}`);
      } else {
        const project = addStoredProject(body);
        navigate(`/projects/${project.id}`);
      }
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
          {isEdit ? 'Edit Project' : 'New Project'}
        </h1>
        <p style={{
          color: '#ffffff',
          fontSize: '0.875rem',
          margin: 0,
          opacity: 0.9
        }}>
          {isEdit ? 'Update this accessibility audit project' : 'Create a new accessibility audit project'}
        </p>
      </div>

      {loadingProject && (
        <p className="field-hint" style={{ padding: '0 var(--space-8)' }}>Loading project…</p>
      )}

      <div className="page-section page-section-wide" hidden={loadingProject}>
      <p className="field-hint" style={{ marginBottom: 'var(--space-8)' }}>
        Fields marked <span aria-hidden="true">*</span><span className="visually-hidden">with an asterisk</span> are required.
      </p>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Product Info ── */}
        <AccordionSection
          id="section-product"
          title="Product information"
          open={openSections.product}
          onToggle={() => toggleSection('product')}
        >
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cloud_name">Cloud name</label>
              <input
                id="cloud_name"
                type="text"
                value={fields.cloud_name}
                onChange={e => setField('cloud_name', e.target.value)}
                placeholder="e.g. Sales Cloud"
                autoComplete="off"
              />
            </div>

            <div className="field">
              <label htmlFor="feature_epic">Feature or epic</label>
              <input
                id="feature_epic"
                type="text"
                value={fields.feature_epic}
                onChange={e => setField('feature_epic', e.target.value)}
                placeholder="e.g. Opportunity Kanban"
                autoComplete="off"
              />
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

            <div className="field field-full">
              <div className="theme-list" role="list" aria-label="Audit theme list">
                {themes.map((theme, i) => (
                  <div key={theme.id} className="theme-row" role="listitem">
                    <div className="field theme-picker">
                      <label
                        htmlFor={i === 0 ? 'audit_theme_id' : `audit_theme_id_${i}`}
                        className={i === 0 ? 'required' : undefined}
                      >
                        Audit Theme Name
                      </label>
                      <AuditThemePicker
                        id={i === 0 ? 'audit_theme_id' : `audit_theme_id_${i}`}
                        value={theme.value}
                        displayName={theme.name}
                        onChange={(value, name) => updateTheme(theme.id, value, name)}
                        aria-required={i === 0 ? 'true' : undefined}
                        aria-invalid={i === 0 ? !!errors.audit_theme_id : undefined}
                        aria-describedby={i === 0 && errors.audit_theme_id ? 'audit_theme_id_err' : undefined}
                      />
                      {i === 0 && errors.audit_theme_id && (
                        <span id="audit_theme_id_err" className="field-error" role="alert">{errors.audit_theme_id}</span>
                      )}
                    </div>
                    <div className="field theme-id-field">
                      <label htmlFor={`theme_id_${i}`}>Theme Id</label>
                      <input
                        id={`theme_id_${i}`}
                        type="text"
                        value={theme.value}
                        readOnly
                        tabIndex={-1}
                        placeholder="Auto-filled on select"
                        aria-label={`Resolved theme ID ${i + 1}`}
                      />
                    </div>
                    {themes.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeTheme(theme.id)}
                        aria-label={`Delete audit theme ${i + 1}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-secondary btn-sm add-item-btn" onClick={addTheme}>
                + Add theme
              </button>
              <span className="field-hint">Search GUS by audit or cloud name and select a theme from the list. Created by the ACR program.</span>
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

            {/* Product tags — required. Lives here rather than in its own section. */}
            <div className="field field-full">
              <fieldset>
                <legend className="required">Product tags</legend>
                <p className="field-hint" style={{ marginBottom: 'var(--space-4)' }}>
                  Required. Search GUS for at least one product tag by name — its ID is filled in automatically.
                </p>

                {errors.tags && (
                  <span className="field-error" role="alert" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>{errors.tags}</span>
                )}

                <div className="repeat-group" role="list" aria-label="Product tag list">
                  {tags.map((tag, i) => (
                    <div key={tag.id} className="repeat-item" role="listitem">
                      <div className="field">
                        <label htmlFor={`tag_name_${i}`} className="required">Tag name</label>
                        <ProductTagPicker
                          id={`tag_name_${i}`}
                          value={tag.tag_name}
                          onChange={name => updateTagFields(tag.id, { tag_name: name, tag_id: '' })}
                          onSelect={t => updateTagFields(tag.id, { tag_name: t.name, tag_id: t.id })}
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
                          readOnly
                          tabIndex={-1}
                          placeholder="Auto-filled on select"
                          aria-required="true"
                          aria-invalid={!!errors[`tag_id_${i}`]}
                          aria-describedby={errors[`tag_id_${i}`] ? `tag_id_${i}_err` : undefined}
                        />
                        {errors[`tag_id_${i}`] && (
                          <span id={`tag_id_${i}_err`} className="field-error" role="alert">{errors[`tag_id_${i}`]}</span>
                        )}
                      </div>
                      {tags.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => removeTag(tag.id)}
                          aria-label={`Delete product tag ${tag.tag_name || i + 1}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-secondary btn-sm add-item-btn" onClick={addTag}>
                  + Add tag
                </button>
              </fieldset>
            </div>
          </div>
        </AccordionSection>

        {/* ── Auditors ── */}
        <AccordionSection
          id="section-auditors"
          title="Auditors"
          open={openSections.auditors}
          onToggle={() => toggleSection('auditors')}
        >
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
                    onChange={selectSingleAuditor}
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

          {/* Auditor name is always shown — for a single-auditor ("No")
              engagement it's auto-filled with the signed-in user. */}
          <div className="form-grid" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="field field-full">
              <label htmlFor="auditor_name">Auditor name</label>
              <EmployeePicker
                id="auditor_name"
                value={fields.auditor_name}
                onChange={name => setField('auditor_name', name)}
                placeholder="Type a name or email to search GUS…"
              />
            </div>
          </div>

          {multipleAuditors && (
            <div className="repeat-group" role="list" aria-label="Auditor list">
              {auditors.map((auditor, i) => (
                <div key={auditor.id} className="repeat-item" role="listitem">
                  <div className="field">
                    <label htmlFor={`auditor_name_${i}`} className="required">Name</label>
                    <EmployeePicker
                      id={`auditor_name_${i}`}
                      value={auditor.name}
                      onChange={name => updateAuditor(auditor.id, 'name', name)}
                      onSelect={emp => updateAuditorFields(auditor.id, { name: emp.name, email: emp.email || auditor.email })}
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
        </AccordionSection>

        {/* ── Product Lead ── */}
        <AccordionSection
          id="section-lead"
          title="Product lead"
          open={openSections.lead}
          onToggle={() => toggleSection('lead')}
        >
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
        </AccordionSection>

        {/* ── Audit scope ── */}
        <AccordionSection
          id="section-scope"
          title="Audit scope"
          open={openSections.scope}
          onToggle={() => toggleSection('scope')}
        >
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
        </AccordionSection>

        {/* ── Google Doc Import ── */}
        <AccordionSection
          id="section-import"
          title="Import from Google Doc (Optional)"
          open={openSections.import}
          onToggle={() => toggleSection('import')}
        >
          <div className="form-grid">
            <div className="field field-full">
              <label htmlFor="google_doc_url">Google Doc URL</label>
              <input
                id="google_doc_url"
                type="url"
                value={googleDocUrl}
                onChange={e => setGoogleDocUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                disabled={loadingDoc}
              />
              <span className="field-hint">Paste a Google Doc URL to auto-populate project details from an audit planning document.</span>
              {docError && (
                <span className="field-error" role="alert" style={{ display: 'block', marginTop: 'var(--space-2)' }}>
                  {docError}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadFromGoogleDoc}
            disabled={loadingDoc || !googleDocUrl.trim()}
            style={{ marginTop: 'var(--space-3)' }}
          >
            {loadingDoc ? 'Loading...' : 'Load from Document'}
          </button>
        </AccordionSection>

        {submitError && (
          <div className="alert alert-error" role="alert" style={{ marginTop: 'var(--space-6)' }}>
            {submitError}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-disabled={submitting}>
            {isEdit
              ? (submitting ? 'Saving changes…' : 'Save changes')
              : (submitting ? 'Creating project…' : 'Create project')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(isEdit ? `/projects/${editId}` : '/audits')}>
            Cancel
          </button>
        </div>

      </form>
      </div>
    </div>
  );
}
