import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/project.css';

const STATUS_LABELS = { pending: 'Not started', in_progress: 'In progress', complete: 'Complete' };

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'failures',  label: 'Failures' },
  { id: 'details',   label: 'Details' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [acrGenerating, setAcrGenerating] = useState(false);
  const [acrError, setAcrError] = useState('');

  // Failures filters
  const [filterPage, setFilterPage] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');


  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/projects/${id}/failures`).then(r => r.json()),
    ])
      .then(([proj, fails]) => {
        setProject(proj);
        setFailures(fails);
        setLoading(false);
      })
      .catch(() => { setError('Could not load project.'); setLoading(false); });
  }, [id]);




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
          <Link to={`/projects/${id}/failures/new`} className="slds-button slds-button_brand">
            Log failure
          </Link>
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


        {/* Generate reports */}
        <div className="overview-section">
          <div className="overview-section-header">
            <h3>Generate reports</h3>
          </div>
          {scopeTotal > 0 && scopeComplete < scopeTotal && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              All scope items must be marked complete before reports can be generated.
              ({scopeComplete}/{scopeTotal} complete)
            </p>
          )}
          {acrError && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              {acrError}
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
          <Link to={`/projects/${id}/failures/new`} className="btn btn-primary btn-sm">
            + Log failure
          </Link>
        </div>

        {failures.length === 0 ? (
          <div className="empty-state">
            <p>No failures logged yet.</p>
            <Link to={`/projects/${id}/failures/new`} className="btn btn-primary">Log first failure</Link>
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
                  <th scope="col">Page</th>
                  <th scope="col">Platform</th>
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
                    <td>{f.page_name || '—'}</td>
                    <td>{f.platform_type}</td>
                    <td><span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span></td>
                    <td>
                      <Link
                        to={`/projects/${id}/failures/${f.id}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View
                      </Link>
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
            ['Audit theme ID', project.audit_theme_id],
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
    </div>
  );
}
