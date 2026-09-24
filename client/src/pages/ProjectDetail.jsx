import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getDummyProject } from '../data/dummyProjects';
import { getStoredProject } from '../data/projectStore';
import { getStoredFailures, addStoredFailure, updateStoredFailure, removeStoredFailure, replaceStoredFailures } from '../data/failureStore';
import LogFailurePanel from '../components/LogFailurePanel';
import '../styles/project.css';

const STATUS_LABELS = { pending: 'Not started', in_progress: 'In progress', complete: 'Complete' };

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'failures',  label: 'Failures' },
  { id: 'details',   label: 'Details' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [acrGenerating, setAcrGenerating] = useState(false);
  const [acrError, setAcrError] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  // Failures filters
  const [filterPage, setFilterPage] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  // Log-failure side panel. editingFailure holds the row being edited, or null
  // when logging a new failure.
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingFailure, setEditingFailure] = useState(null);

  // Failure deletion — inline confirm on the row being removed.
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [deletingFailure, setDeletingFailure] = useState(false);

  // Row selection for the Overview "Logged failures" table.
  const [selectedFailureIds, setSelectedFailureIds] = useState([]);

  const toggleFailureSelected = (failureId) => {
    setSelectedFailureIds(prev =>
      prev.includes(failureId)
        ? prev.filter(fid => fid !== failureId)
        : [...prev, failureId]
    );
  };

  const allFailuresSelected = failures.length > 0 && selectedFailureIds.length === failures.length;

  const toggleAllFailuresSelected = () => {
    setSelectedFailureIds(allFailuresSelected ? [] : failures.map(f => f.id));
  };

  // Push selected failures to Salesforce GUS. Feedback is shown inline above
  // the table via gusStatus.
  const [pushingGus, setPushingGus] = useState(false);
  const [gusStatus, setGusStatus] = useState(null);

  const pushSelectedToGus = async () => {
    if (selectedFailureIds.length === 0) return;
    setPushingGus(true);
    setGusStatus(null);
    try {
      const res = await fetch(`/api/projects/${id}/failures/push-to-gus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failure_ids: selectedFailureIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to push failures to GUS.');
      }
      const count = data.pushed ?? selectedFailureIds.length;
      const ids = (data.bugs || []).map(b => b.gusId).filter(Boolean);
      const warned = (data.warnings || []).length
        ? ` (${data.warnings.length} warning${data.warnings.length === 1 ? '' : 's'})`
        : '';
      setGusStatus({
        type: 'success',
        message: `Created ${count} GUS bug${count === 1 ? '' : 's'}${ids.length ? `: ${ids.join(', ')}` : ''}.${warned}`,
      });
      setSelectedFailureIds([]);
    } catch (err) {
      setGusStatus({ type: 'error', message: err.message });
    } finally {
      setPushingGus(false);
    }
  };


  useEffect(() => {
    // Failures logged locally (when the API is down) are always merged in, so
    // they appear in the table alongside anything the backend returns.
    const stored = getStoredFailures(id);

    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/failures`).then(r => r.json()),
    ])
      .then(([proj, fails]) => {
        if (proj && proj.id) {
          setProject(proj);
          const serverFailures = Array.isArray(fails) ? fails : [];
          // Prune any locally-stored failure the server already has. Older
          // builds wrote each saved failure to BOTH the API and localStorage,
          // so those rows rendered twice. Match on subject + criterion + page
          // and keep only true local-only rows (logged while the API was down);
          // persist the pruned list so the duplicates don't come back.
          const keyOf = f => `${f.subject}|${f.wcag_criterion}|${f.page_name || ''}`;
          const serverKeys = new Set(serverFailures.map(keyOf));
          const localOnly = stored.filter(f => !serverKeys.has(keyOf(f)));
          if (localOnly.length !== stored.length) replaceStoredFailures(id, localOnly);
          setFailures([...serverFailures, ...localOnly]);
        } else {
          loadFallback();
        }
        setLoading(false);
      })
      .catch(() => {
        // API unavailable — fall back to a locally-created or demo project
        loadFallback();
        setLoading(false);
      });

    // Look up the project in the local store first, then the demo set.
    function loadFallback() {
      const local = getStoredProject(id);
      if (local) { setProject({ scope_items: [], ...local }); setFailures(stored); return; }
      const demo = getDummyProject(id);
      if (demo) { setProject({ ...demo, scope_items: [] }); setFailures(stored); return; }
      setError('Could not load project.');
    }
  }, [id]);

  // Open the panel to log a new failure.
  function openCreatePanel() {
    setEditingFailure(null);
    setPanelOpen(true);
  }

  // Open the panel to edit an existing failure row.
  function openEditPanel(failure) {
    setEditingFailure(failure);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingFailure(null);
  }

  // Save a failure from the panel. The DB is the source of truth: when the API
  // call succeeds we do NOT also write to localStorage (writing to both is what
  // produced duplicate rows). localStorage is only a fallback for when the
  // backend isn't running. Updates the row in place when editing, otherwise
  // appends a new one.
  async function handleSaveFailure(failure) {
    if (editingFailure) {
      const failureId = editingFailure.id;
      // Local-only rows have a `local-` id and never exist server-side.
      const isLocalOnly = String(failureId).startsWith('local-');
      let serverOk = false;
      if (!isLocalOnly) {
        try {
          const res = await fetch(`/api/projects/${id}/failures/${failureId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(failure),
          });
          serverOk = res.ok;
        } catch {
          serverOk = false;
        }
      }
      // Only touch localStorage for local-only rows or when the API save failed
      // — never mirror a server-backed row into localStorage.
      if (isLocalOnly || !serverOk) {
        updateStoredFailure(id, failureId, failure);
      }
      setFailures(prev => prev.map(f =>
        f.id === failureId ? { ...f, ...failure, id: f.id, sf_issue_id: f.sf_issue_id } : f));
    } else {
      let serverFailure = null;
      try {
        const res = await fetch(`/api/projects/${id}/failures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(failure),
        });
        if (res.ok) serverFailure = await res.json().catch(() => null);
      } catch {
        serverFailure = null;
      }
      if (serverFailure?.id) {
        // Persisted server-side: adopt the server's id and sf_issue_id, keeping
        // the panel's display-only fields (product_tag_name, screenshot_link).
        setFailures(prev => [...prev, { ...failure, ...serverFailure }]);
      } else {
        // API unavailable: fall back to localStorage so the row still shows.
        const saved = addStoredFailure(id, failure, failures.length);
        setFailures(prev => [...prev, saved]);
      }
    }
    closePanel();
    setActiveTab('failures');
  }

  // Persist the panel's audit-theme edits to the project. Updates local project
  // state so the Details tab and failure table reflect the change immediately;
  // tolerates the API being down (demo/offline mode).
  async function handleSaveThemes({ audit_theme_ids, audit_theme_names }) {
    try {
      const res = await fetch(`/api/projects/${id}/themes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audit_theme_ids, audit_theme_names }),
      });
      if (res.ok) {
        const updated = await res.json().catch(() => null);
        if (updated) { setProject(updated); return; }
      }
    } catch {
      // ignore — fall through to optimistic local update
    }
    setProject(prev => prev && {
      ...prev,
      audit_theme_id: audit_theme_ids[0] || null,
      audit_theme_ids,
      audit_theme_names,
    });
  }

  // Delete a failure: try the API, always remove locally and from the table so
  // it disappears even when the backend isn't running.
  async function handleDeleteFailure(failureId) {
    setDeletingFailure(true);
    try {
      await fetch(`/api/projects/${id}/failures/${failureId}`, { method: 'DELETE' });
    } catch {
      // ignore — still remove locally
    }
    removeStoredFailure(id, failureId);
    setFailures(prev => prev.filter(f => f.id !== failureId));
    setConfirmingDeleteId(null);
    setDeletingFailure(false);
  }




  async function generateAcr() {
    setAcrGenerating(true);
    setAcrError('');
    try {
      const res = await fetch(`/api/projects/${id}/export/acr`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ACR - ${project.product_name}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setAcrError(err.message);
    } finally {
      setAcrGenerating(false);
    }
  }

  async function archiveProject() {
    setArchiving(true);
    setArchiveError('');
    try {
      const res = await fetch(`/api/projects/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }
      // Refresh project data
      const updatedProject = await fetch(`/api/projects/${id}`).then(r => r.json());
      setProject(updatedProject);
    } catch (err) {
      setArchiveError(err.message);
    } finally {
      setArchiving(false);
    }
  }


  if (loading) return <p>Loading project…</p>;
  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!project) return null;

  const scopeTotal = project.scope_items?.length ?? 0;
  const scopeComplete = project.scope_items?.filter(s => s.status === 'complete').length ?? 0;
  const progressPct = scopeTotal > 0 ? Math.round((scopeComplete / scopeTotal) * 100) : 0;

  const p1Count = failures.filter(f => f.severity === 'P1').length;
  const p2Count = failures.filter(f => f.severity === 'P2').length;
  const p3Count = failures.filter(f => f.severity === 'P3').length;


  // Filtered failures
  const visibleFailures = failures.filter(f => {
    if (filterPage !== 'all' && f.page_name !== filterPage) return false;
    if (filterSeverity !== 'all' && f.severity !== filterSeverity) return false;
    return true;
  });

  const uniquePages = [...new Set(failures.map(f => f.page_name).filter(Boolean))];

  // Human-readable audit theme name(s), comma-separated. Falls back to the
  // stored id only for legacy projects saved before names were persisted.
  const themeNames = project.audit_theme_names?.length
    ? project.audit_theme_names.join(', ')
    : (project.audit_theme_id || '');


  // Tab label with counts
  function tabLabel(tab) {
    if (tab.id === 'failures') return `Failures (${failures.length})`;
    return tab.label;
  }

  return (
    <div className="slds-scope">
      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(to right, #1B5F9E, #2E70B8)',
        padding: '2rem 2rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: '#ffffff',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '1rem',
            opacity: 0.9
          }}
        >
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Projects
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{
              color: '#ffffff',
              fontSize: '2rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              {project.product_name}
            </h1>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {project.pm_name && (
                <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
                  <strong>PM:</strong> {project.pm_name}
                </p>
              )}
              {project.release_build_name && (
                <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
                  <strong>Build:</strong> {project.release_build_name}
                </p>
              )}
              {project.slack_channel && (
                <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
                  <strong>Slack:</strong> {project.slack_channel}
                </p>
              )}
            </div>
          </div>
          <button type="button" className="slds-button slds-button_brand" onClick={openCreatePanel}>
            Log failure
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" aria-label="Project sections" className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className="tab-btn"
            onClick={() => setActiveTab(tab.id)}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════ */}
      <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" hidden={activeTab !== 'overview'}>

        {/* Stat cards */}
        <div className="stat-cards">
          <div className="stat-card">
            <span className="stat-card-value">{failures.length}</span>
            <span className="stat-card-label">Total failures</span>
          </div>
          <div className="stat-card stat-card-p1">
            <span className="stat-card-value">{p1Count}</span>
            <span className="stat-card-label">P1 — Critical</span>
          </div>
          <div className="stat-card stat-card-p2">
            <span className="stat-card-value">{p2Count}</span>
            <span className="stat-card-label">P2 — Major</span>
          </div>
          <div className="stat-card stat-card-p3">
            <span className="stat-card-value">{p3Count}</span>
            <span className="stat-card-label">P3 — Minor</span>
          </div>
        </div>

        {/* Scope progress */}
        {scopeTotal > 0 && (
          <div className="overview-section">
            <div className="overview-section-header">
              <h3>Audit scope</h3>
              <span className="progress-label">{scopeComplete}/{scopeTotal} complete</span>
            </div>
            <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Audit scope progress" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <ul className="scope-list">
              {project.scope_items.map(item => {
                const itemFailures = failures.filter(f => f.page_name === item.page_name);
                const statusLabel = STATUS_LABELS[item.status] || item.status;
                const statusClass = `scope-status scope-status--${item.status}`;
                return (
                  <li key={item.id} className="scope-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        to={`/projects/${id}/scope/${item.id}/checklist`}
                        className="scope-item-name"
                        style={{ textDecoration: 'none', color: 'var(--color-text)', fontWeight: 500 }}
                      >
                        {item.page_name}
                      </Link>
                      {item.url && (
                        <div className="scope-item-url">
                          <a href={item.url} target="_blank" rel="noreferrer">{item.url}</a>
                        </div>
                      )}
                      {item.checklist_total > 0 && (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                          {item.checklist_reviewed}/{item.checklist_total} reviewed
                          {item.checklist_fail > 0 && <span> · {item.checklist_fail} fail</span>}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                      {itemFailures.length > 0 && (
                        <button
                          type="button"
                          className="scope-failure-badge"
                          onClick={() => { setFilterPage(item.page_name); setActiveTab('failures'); }}
                        >
                          {itemFailures.length} {itemFailures.length === 1 ? 'failure' : 'failures'}
                        </button>
                      )}
                      <span className={statusClass}>{statusLabel}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}


        {/* Logged failures */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h3>Logged failures</h3>
            <div className="overview-section-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={pushSelectedToGus}
                disabled={selectedFailureIds.length === 0 || pushingGus}
                aria-disabled={selectedFailureIds.length === 0 || pushingGus}
              >
                {pushingGus
                  ? 'Pushing…'
                  : `Push to GUS${selectedFailureIds.length ? ` (${selectedFailureIds.length})` : ''}`}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={openCreatePanel}>
                + Log failure
              </button>
            </div>
          </div>
          {gusStatus && (
            <div
              className={`alert alert-${gusStatus.type}`}
              role="alert"
              style={{ marginBottom: 'var(--space-3)' }}
            >
              {gusStatus.message}
            </div>
          )}
          {failures.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No failures logged yet. Use “Log failure” to add one.
            </p>
          ) : (
            <div className="failure-table-wrap">
              <table className="failure-table">
                <thead>
                  <tr>
                    <th scope="col" className="failure-select-col">
                      <input
                        type="checkbox"
                        checked={allFailuresSelected}
                        onChange={toggleAllFailuresSelected}
                        aria-label="Select all failures"
                      />
                    </th>
                    <th scope="col">#</th>
                    <th scope="col">Subject</th>
                    <th scope="col">WCAG criterion</th>
                    <th scope="col">Theme name</th>
                    <th scope="col">Product tag</th>
                    <th scope="col">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map(f => (
                    <tr key={f.id}>
                      <td className="failure-select-col">
                        <input
                          type="checkbox"
                          checked={selectedFailureIds.includes(f.id)}
                          onChange={() => toggleFailureSelected(f.id)}
                          aria-label={`Select failure ${f.subject}`}
                        />
                      </td>
                      <td>{f.sf_issue_id}</td>
                      <td><div className="failure-subject">{f.subject}</div></td>
                      <td className="failure-criterion">{f.wcag_criterion}</td>
                      <td>{themeNames || '—'}</td>
                      <td>{f.product_tag_name || f.tag_name || '—'}</td>
                      <td><span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generate reports and Archive */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h3>Project actions</h3>
          </div>
          {scopeTotal > 0 && scopeComplete < scopeTotal && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              All scope items must be marked complete before reports can be generated and project can be archived.
              ({scopeComplete}/{scopeTotal} complete)
            </p>
          )}
          {acrError && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              {acrError}
            </div>
          )}
          {archiveError && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              {archiveError}
            </div>
          )}
          {project.archived && (
            <div className="alert alert-info" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              This project is archived.
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={scopeComplete < scopeTotal || acrGenerating}
              onClick={generateAcr}
              aria-disabled={scopeComplete < scopeTotal || acrGenerating}
            >
              {acrGenerating ? 'Generating…' : 'Generate ACR (.docx)'}
            </button>
            {!project.archived && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={scopeComplete < scopeTotal || archiving}
                onClick={archiveProject}
                aria-disabled={scopeComplete < scopeTotal || archiving}
              >
                {archiving ? 'Archiving…' : 'Archive Project'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════
          FAILURES TAB
      ══════════════════════════════════════════ */}
      <div role="tabpanel" id="panel-failures" aria-labelledby="tab-failures" hidden={activeTab !== 'failures'}>

        <div className="failure-toolbar">
          <div className="failure-filters" role="group" aria-label="Filter failures">
            {/* Page filter */}
            {uniquePages.length > 0 && (
              <select
                value={filterPage}
                onChange={e => setFilterPage(e.target.value)}
                aria-label="Filter by page"
                className="scope-status-select"
              >
                <option value="all">All pages</option>
                {uniquePages.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              aria-label="Filter by severity"
              className="scope-status-select"
            >
              <option value="all">All severities</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
            {(filterPage !== 'all' || filterSeverity !== 'all') && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setFilterPage('all'); setFilterSeverity('all'); }}
              >
                Clear filters
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreatePanel}>
            + Log failure
          </button>
        </div>

        {failures.length === 0 ? (
          <div className="empty-state">
            <p>No failures logged yet.</p>
            <button type="button" className="btn btn-primary" onClick={openCreatePanel}>Log first failure</button>
          </div>
        ) : visibleFailures.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>No failures match the current filters.</p>
        ) : (
          <div className="failure-table-wrap">
            <table className="failure-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Subject</th>
                  <th scope="col">WCAG criterion</th>
                  <th scope="col">Theme name</th>
                  <th scope="col">Product tag</th>
                  <th scope="col">Severity</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {visibleFailures.map(f => (
                  <tr key={f.id}>
                    <td>{f.sf_issue_id}</td>
                    <td><div className="failure-subject">{f.subject}</div></td>
                    <td className="failure-criterion">{f.wcag_criterion}</td>
                    <td>{project.audit_theme_id || '—'}</td>
                    <td>{f.product_tag_name || f.tag_name || '—'}</td>
                    <td><span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditPanel(f)}
                          aria-label={`View and edit failure ${f.sf_issue_id}`}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmingDeleteId(f.id)}
                          aria-label={`Delete failure ${f.sf_issue_id}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* ══════════════════════════════════════════
          DETAILS TAB
      ══════════════════════════════════════════ */}
      <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={activeTab !== 'details'}>
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--space-3) var(--space-6)', fontSize: 'var(--text-sm)' }}>
          {[
            ['Product name', project.product_name],
            ['PM name', project.pm_name],
            ['PM email', project.pm_email],
            ['Login path', project.login_path],
            ['Release build', project.release_build_name],
            ['Slack channel', project.slack_channel],
            ['Audit theme(s)', themeNames],
            ['Epic ID', project.epic_id],
          ].filter(([, val]) => val).map(([label, val]) => (
            <div key={label} style={{ display: 'contents' }}>
              <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-medium)' }}>{label}</dt>
              <dd>{val}</dd>
            </div>
          ))}
        </dl>

        {project.auditors?.length > 0 && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>Auditors</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {project.auditors.map(a => (
                <li key={a.id} style={{ fontSize: 'var(--text-sm)' }}>
                  {a.name}{a.email && <span style={{ color: 'var(--color-text-secondary)' }}> — {a.email}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {project.product_tags?.length > 0 && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-3)' }}>Product tags</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {project.product_tags.map(t => (
                <li key={t.id} style={{ fontSize: 'var(--text-sm)' }}>
                  {t.tag_name} <span style={{ color: 'var(--color-text-secondary)' }}>— ID: {t.tag_id}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {panelOpen && (
        <LogFailurePanel
          onClose={closePanel}
          onSave={handleSaveFailure}
          onSaveThemes={handleSaveThemes}
          project={project}
          initialFailure={editingFailure}
          existingFailures={editingFailure
            ? failures.filter(f => f.id !== editingFailure.id)
            : failures}
        />
      )}

      {confirmingDeleteId && (() => {
        const target = failures.find(f => f.id === confirmingDeleteId);
        const cancel = () => { if (!deletingFailure) setConfirmingDeleteId(null); };
        return (
          <div className="confirm-overlay" onMouseDown={cancel}>
            <div
              className="confirm-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-title"
              onMouseDown={e => e.stopPropagation()}
            >
              <h2 id="confirm-delete-title" className="confirm-modal-title">Delete this bug?</h2>
              <p className="confirm-modal-body">
                This will permanently delete the bug:
                <strong className="confirm-modal-subject">{target?.subject || 'this failure'}</strong>
              </p>
              <div className="confirm-modal-actions">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteFailure(confirmingDeleteId)}
                  disabled={deletingFailure}
                >
                  {deletingFailure ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cancel}
                  disabled={deletingFailure}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
