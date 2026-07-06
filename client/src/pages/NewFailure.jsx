import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import WcagPicker from '../components/WcagPicker';
import { getSuggestedSeverity, WCAG_CRITERIA } from '../data/wcag';

function buildStepsBoilerplate(loginPath) {
  if (!loginPath) return '';
  return `1. Navigate to ${loginPath}\n2. `;
}

function getScRemediation(criterionFull) {
  const c = WCAG_CRITERIA.find(c => c.full === criterionFull);
  return c?.remediation ?? '';
}
import '../styles/failure-form.css';

const PLATFORMS = ['Desktop', 'Mobile', 'Web Mobile'];
const MOBILE_OS = ['Android', 'iOS', 'Both'];

export default function NewFailure() {
  const { id: projectId, failureId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledSc = searchParams.get('sc') || '';
  const scopeItemId = searchParams.get('scopeItemId') || '';
  const returnToChecklist = searchParams.get('returnTo') === 'checklist';
  const isEditing = !!failureId;

  const [project, setProject] = useState(null);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(isEditing);

  const [fields, setFields] = useState(() => {
    const sc = searchParams.get('sc') || '';
    const page = searchParams.get('page') || '';
    const severity = sc ? (getSuggestedSeverity(WCAG_CRITERIA.find(c => c.full === sc)?.id || '') || '') : '';
    const recommendations = sc ? getScRemediation(sc) : '';
    return {
      subject: '',
      details: '',
      steps: '',
      impact: '',
      recommendations,
      html_code: '',
      auditor_comments: '',
      page_name: page,
      sub_page_name: '',
      wcag_criterion: sc,
      mobile_os: '',
      severity,
      known_work_id: '',
      agency_ref_id: '',
      auditor_id: '',
      product_tag_id: '',
    };
  });

  const [platforms, setPlatforms] = useState([]);
  const [additionalPages, setAdditionalPages] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [logAnother, setLogAnother] = useState(false);

  const isMobile = platforms.some(p => p === 'Mobile' || p === 'Web Mobile');

  // Duplicate detection
  const duplicate = fields.wcag_criterion && fields.page_name
    ? failures.find(f =>
        f.wcag_criterion === fields.wcag_criterion &&
        f.page_name === fields.page_name
      )
    : null;

  useEffect(() => {
    const fetches = [
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/failures`).then(r => r.json()),
    ];

    if (isEditing) {
      fetches.push(fetch(`/api/projects/${projectId}/failures/${failureId}`).then(r => r.json()));
    }

    Promise.all(fetches).then((results) => {
      const [proj, fails, existingFailure] = results;
      setProject(proj);
      setFailures(fails);

      if (isEditing && existingFailure) {
        // Populate form with existing failure data
        setFields({
          subject: existingFailure.subject || '',
          details: existingFailure.details || '',
          steps: existingFailure.steps || '',
          impact: existingFailure.impact || '',
          recommendations: existingFailure.recommendations || '',
          html_code: existingFailure.html_code || '',
          auditor_comments: existingFailure.auditor_comments || '',
          page_name: existingFailure.page_name || '',
          sub_page_name: existingFailure.sub_page_name || '',
          wcag_criterion: existingFailure.wcag_criterion || '',
          mobile_os: existingFailure.mobile_os || '',
          severity: existingFailure.severity || '',
          known_work_id: existingFailure.known_work_id || '',
          agency_ref_id: existingFailure.agency_ref_id || '',
          auditor_id: existingFailure.auditor_id || '',
          product_tag_id: existingFailure.product_tag_id || '',
        });
        // Set platforms from platform_type string
        const platformList = existingFailure.platform_type ? existingFailure.platform_type.split(',').map(p => p.trim()) : [];
        setPlatforms(platformList);
        setLoading(false);
      } else if (proj.login_path) {
        setFields(f => ({ ...f, steps: f.steps || buildStepsBoilerplate(proj.login_path) }));
      }
    });
  }, [projectId, failureId, isEditing]);

  function setField(name, value) {
    setFields(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  }

  function handleWcagChange(criterion) {
    setField('wcag_criterion', criterion);
    if (criterion) {
      const c = WCAG_CRITERIA.find(c => c.full === criterion);
      if (c) {
        if (!fields.severity) setField('severity', getSuggestedSeverity(c.id));
        setField('recommendations', c.remediation ?? '');
      }
    }
  }

  function togglePlatform(platform) {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
    if (errors.platforms) setErrors(e => ({ ...e, platforms: '' }));
  }

  function toggleAdditionalPage(pageName) {
    setAdditionalPages(prev =>
      prev.includes(pageName)
        ? prev.filter(p => p !== pageName)
        : [...prev, pageName]
    );
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
      const firstKey = Object.keys(errs)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    const body = {
      ...fields,
      platform_type: platforms.join(', '),
      auditor_id: fields.auditor_id || null,
      product_tag_id: fields.product_tag_id || null,
      additional_pages: additionalPages,
    };

    try {
      const url = isEditing
        ? `/api/projects/${projectId}/failures/${failureId}`
        : `/api/projects/${projectId}/failures`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      if (isEditing) {
        // Navigate back to the failure detail page
        navigate(`/projects/${projectId}/failures/${failureId}`);
      } else if (logAnother) {
        // Keep page_name, platform, and SC (when pre-filled from checklist)
        setFields(f => ({
          ...f,
          subject: '',
          details: '',
          steps: buildStepsBoilerplate(project?.login_path),
          impact: '',
          recommendations: prefilledSc ? getScRemediation(prefilledSc) : '',
          html_code: '',
          auditor_comments: '',
          sub_page_name: '',
          wcag_criterion: prefilledSc || '',
          mobile_os: '',
          severity: prefilledSc ? (getSuggestedSeverity(WCAG_CRITERIA.find(c => c.full === prefilledSc)?.id || '') || '') : '',
          known_work_id: '',
          agency_ref_id: '',
          // page_name kept (f.page_name preserved by spread)
        }));
        setErrors({});
        setSubmitting(false);
        // Refresh failures list for duplicate detection
        fetch(`/api/projects/${projectId}/failures`).then(r => r.json()).then(setFailures);
        document.getElementById('subject')?.focus();
      } else {
        // Return to checklist if came from there, otherwise go to project
        if (returnToChecklist && scopeItemId) {
          navigate(`/projects/${projectId}/scope/${scopeItemId}/checklist`);
        } else {
          navigate(`/projects/${projectId}?tab=failures`);
        }
      }
    } catch {
      setSubmitError('Failed to save failure. Please try again.');
      setSubmitting(false);
    }
  }

  if (!project || (isEditing && loading)) return <p>Loading…</p>;

  const scopeOptions = project.scope_items ?? [];
  const auditorOptions = project.auditors ?? [];
  const tagOptions = project.product_tags ?? [];

  return (
    <div className="page-section">
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-4)' }}>
        <ol style={{ listStyle: 'none', display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          <li><a href={`/projects/${projectId}`}>{project.product_name}</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{isEditing ? 'Edit failure' : 'Log failure'}</li>
        </ol>
      </nav>

      <h2 style={{ marginBottom: 'var(--space-2)' }}>{isEditing ? 'Edit failure' : 'Log failure'}</h2>
      <p className="field-hint" style={{ marginBottom: 'var(--space-8)' }}>
        Fields marked <span aria-hidden="true">*</span><span className="visually-hidden">with an asterisk</span> are required.
      </p>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Classification ── */}
        <section className="failure-form-section" aria-labelledby="section-classification">
          <h3 id="section-classification">Classification</h3>
          <div className="form-grid">

            {/* WCAG criterion */}
            <div className="field field-full">
              <label htmlFor="wcag_criterion" className="required">WCAG success criterion</label>
              <WcagPicker
                value={fields.wcag_criterion}
                onChange={handleWcagChange}
                error={errors.wcag_criterion}
              />
              {errors.wcag_criterion && (
                <span id="wcag_criterion_err" className="field-error" role="alert">{errors.wcag_criterion}</span>
              )}
              {duplicate && (
                <div className="alert alert-warning duplicate-warning" role="alert" id="duplicate-warning">
                  This criterion has already been logged for this page (issue #{duplicate.sf_issue_id}: {duplicate.subject}).
                </div>
              )}
            </div>

            {/* Severity */}
            <div className="field field-full">
              <fieldset>
                <legend className="required">Severity</legend>
                <div className="severity-group" style={{ marginTop: 'var(--space-3)' }} id="severity">
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
                {fields.wcag_criterion && fields.severity && (
                  <p className="field-hint" style={{ marginTop: 'var(--space-2)' }}>
                    Suggested based on WCAG level. Override as needed.
                  </p>
                )}
              </fieldset>
              {errors.severity && (
                <span className="field-error" role="alert">{errors.severity}</span>
              )}
            </div>

            {/* Platform */}
            <div className="field field-full">
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
              {errors.platforms && (
                <span className="field-error" role="alert">{errors.platforms}</span>
              )}
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
                  aria-describedby={errors.mobile_os ? 'mobile_os_err' : undefined}
                >
                  <option value="">Select OS</option>
                  {MOBILE_OS.map(os => (
                    <option key={os} value={os}>{os}</option>
                  ))}
                </select>
                {errors.mobile_os && (
                  <span id="mobile_os_err" className="field-error" role="alert">{errors.mobile_os}</span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Location ── */}
        <section className="failure-form-section" aria-labelledby="section-location">
          <h3 id="section-location">Location</h3>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="page_name">Page or component</label>
              {scopeOptions.length > 0 ? (
                <select
                  id="page_name"
                  value={fields.page_name}
                  onChange={e => setField('page_name', e.target.value)}
                >
                  <option value="">Select or leave blank</option>
                  {scopeOptions.map(s => (
                    <option key={s.id} value={s.page_name}>{s.page_name}</option>
                  ))}
                  <option value="__other__">Other (type below)</option>
                </select>
              ) : (
                <input
                  id="page_name"
                  type="text"
                  value={fields.page_name}
                  onChange={e => setField('page_name', e.target.value)}
                  placeholder="e.g. Chat window"
                />
              )}
            </div>

            {fields.page_name === '__other__' && (
              <div className="field">
                <label htmlFor="page_name_custom">Custom page / component name</label>
                <input
                  id="page_name_custom"
                  type="text"
                  value={fields._page_name_custom || ''}
                  onChange={e => {
                    setField('_page_name_custom', e.target.value);
                    setField('page_name', e.target.value);
                  }}
                  autoFocus
                />
              </div>
            )}

            <div className="field">
              <label htmlFor="sub_page_name">Sub-page or sub-component</label>
              <input
                id="sub_page_name"
                type="text"
                value={fields.sub_page_name}
                onChange={e => setField('sub_page_name', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Additional pages checkboxes */}
          {scopeOptions.length > 0 && fields.page_name && fields.page_name !== '__other__' && (
            <fieldset style={{ marginTop: 'var(--space-4)' }}>
              <legend style={{ fontWeight: 'var(--font-medium)', marginBottom: 'var(--space-2)' }}>
                Also affects these pages <span className="field-hint">(optional)</span>
              </legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {scopeOptions
                  .filter(s => s.page_name !== fields.page_name)
                  .map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={additionalPages.includes(s.page_name)}
                        onChange={() => toggleAdditionalPage(s.page_name)}
                      />
                      <span>{s.page_name}</span>
                    </label>
                  ))}
              </div>
            </fieldset>
          )}
        </section>

        {/* ── Description ── */}
        <section className="failure-form-section" aria-labelledby="section-description">
          <h3 id="section-description">Description</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

            <div className="field">
              <label htmlFor="subject" className="required">Subject</label>
              <input
                id="subject"
                type="text"
                value={fields.subject}
                onChange={e => setField('subject', e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.subject}
                aria-describedby={errors.subject ? 'subject_err' : undefined}
                placeholder="Brief description of the issue"
              />
              {errors.subject && (
                <span id="subject_err" className="field-error" role="alert">{errors.subject}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="details">What is the issue?</label>
              <textarea
                id="details"
                value={fields.details}
                onChange={e => setField('details', e.target.value)}
                rows={4}
                placeholder="Describe the accessibility problem in detail."
              />
            </div>

            <div className="field">
              <label htmlFor="steps">Steps to reproduce</label>
              <textarea
                id="steps"
                value={fields.steps}
                onChange={e => setField('steps', e.target.value)}
                rows={3}
                placeholder="1. Navigate to... 2. Use keyboard to..."
              />
            </div>

            <div className="field">
              <label htmlFor="impact">Impact</label>
              <textarea
                id="impact"
                value={fields.impact}
                onChange={e => setField('impact', e.target.value)}
                rows={2}
                placeholder="Who is affected and how?"
              />
            </div>

            <div className="field">
              <label htmlFor="recommendations">How to fix</label>
              <textarea
                id="recommendations"
                value={fields.recommendations}
                onChange={e => setField('recommendations', e.target.value)}
                rows={3}
                placeholder="Recommended remediation steps."
              />
            </div>

            <div className="field">
              <label htmlFor="html_code">HTML code snippet</label>
              <textarea
                id="html_code"
                value={fields.html_code}
                onChange={e => setField('html_code', e.target.value)}
                rows={3}
                placeholder="Optional — paste relevant HTML here."
                style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
              />
            </div>

            <div className="field">
              <label htmlFor="auditor_comments">Auditor comments</label>
              <textarea
                id="auditor_comments"
                value={fields.auditor_comments}
                onChange={e => setField('auditor_comments', e.target.value)}
                rows={2}
                placeholder="Optional internal notes."
              />
            </div>
          </div>
        </section>

        {/* ── Metadata ── */}
        <section className="failure-form-section" aria-labelledby="section-meta">
          <h3 id="section-meta">Additional details</h3>
          <div className="form-grid">

            {auditorOptions.length > 0 && (
              <div className="field">
                <label htmlFor="auditor_id">Auditor</label>
                <select
                  id="auditor_id"
                  value={fields.auditor_id}
                  onChange={e => setField('auditor_id', e.target.value)}
                >
                  <option value="">Select auditor</option>
                  {auditorOptions.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

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

            <div className="field">
              <label htmlFor="known_work_id">Known issues work ID</label>
              <input
                id="known_work_id"
                type="text"
                value={fields.known_work_id}
                onChange={e => setField('known_work_id', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="field">
              <label htmlFor="agency_ref_id">Agency reference ID</label>
              <input
                id="agency_ref_id"
                type="text"
                value={fields.agency_ref_id}
                onChange={e => setField('agency_ref_id', e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </section>

        {submitError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            {submitError}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            aria-disabled={submitting}
            onClick={() => setLogAnother(false)}
          >
            {submitting && !logAnother ? 'Saving…' : (isEditing ? 'Save changes' : 'Save failure')}
          </button>
          {!isEditing && (
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={submitting}
              aria-disabled={submitting}
              onClick={() => setLogAnother(true)}
            >
              {submitting && logAnother ? 'Saving…' : 'Save and log another'}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (isEditing) {
                navigate(`/projects/${projectId}/failures/${failureId}`);
              } else if (returnToChecklist && scopeItemId) {
                navigate(`/projects/${projectId}/scope/${scopeItemId}/checklist`);
              } else {
                navigate(`/projects/${projectId}?tab=failures`);
              }
            }}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
