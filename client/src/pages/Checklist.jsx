import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PRINCIPLES, WCAG_CRITERIA_WITH_PRINCIPLE } from '../data/wcag';
import '../styles/checklist.css';

export default function Checklist() {
  const { id: projectId, scopeItemId } = useParams();
  const [project, setProject] = useState(null);
  const [scopeItem, setScopeItem] = useState(null);
  const [failures, setFailures] = useState([]);
  const [checklist, setChecklist] = useState({});
  const [collapsed, setCollapsed] = useState({});
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/failures`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/scope/${scopeItemId}/checklist`).then(r => r.json()),
    ]).then(([proj, fails, items]) => {
      setProject(proj);
      const si = proj.scope_items?.find(s => s.id === scopeItemId);
      setScopeItem(si);
      setFailures(fails.filter(f => f.page_name === si?.page_name));
      const map = {};
      items.forEach(i => { map[i.sc_id] = i; });
      setChecklist(map);
      setLoading(false);
    });
  }, [projectId, scopeItemId]);

  const refreshFailures = useCallback(() => {
    fetch(`/api/projects/${projectId}/failures`).then(r => r.json()).then(all => {
      setFailures(all.filter(f => f.page_name === scopeItem?.page_name));
    });
  }, [projectId, scopeItem]);

  async function setStatus(scId, status) {
    setChecklist(prev => ({
      ...prev,
      [scId]: { ...(prev[scId] || {}), sc_id: scId, status },
    }));
    await fetch(`/api/projects/${projectId}/scope/${scopeItemId}/checklist/${encodeURIComponent(scId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  function toggleCollapse(principleId) {
    setCollapsed(prev => ({ ...prev, [principleId]: !prev[principleId] }));
  }

  if (loading) return <p>Loading checklist…</p>;
  if (!project || !scopeItem) return <p>Scope item not found.</p>;

  const reviewed = WCAG_CRITERIA_WITH_PRINCIPLE.filter(c => {
    const s = checklist[c.id]?.status;
    return s && s !== 'unchecked';
  }).length;
  const total = WCAG_CRITERIA_WITH_PRINCIPLE.length;
  const failureCount = failures.length;
  const progressPct = Math.round((reviewed / total) * 100);

  function visibleCriteria(principleId) {
    return WCAG_CRITERIA_WITH_PRINCIPLE.filter(c => {
      if (c.principle !== principleId) return false;
      if (levelFilter !== 'all' && c.level !== levelFilter) return false;
      const status = checklist[c.id]?.status || 'unchecked';
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      return true;
    });
  }

  return (
    <div className="slds-scope">
      <div style={{
        background: 'linear-gradient(to right, #1B5F9E, #2E70B8)',
        padding: '2rem 2rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Link to={`/projects/${projectId}`} style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.875rem', textDecoration: 'none' }}>
            {project.product_name}
          </Link>
          <span style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.875rem' }}>/</span>
          <span style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.875rem' }}>{scopeItem.page_name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{
              color: '#ffffff',
              fontSize: '2rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              {scopeItem.page_name}
            </h1>
            {scopeItem.url && (
              <a
                href={scopeItem.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#ffffff', fontSize: '0.875rem', opacity: 0.9, textDecoration: 'underline' }}
              >
                {scopeItem.url}
              </a>
            )}
          </div>
          <Link to={`/projects/${projectId}`} className="slds-button slds-button_neutral">
            Back to project
          </Link>
        </div>
      </div>

      {/* Progress */}
      <div className="checklist-progress-bar">
        <div
          className="checklist-progress-fill"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Checklist progress"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="checklist-progress-meta">
        <span><strong>{reviewed}</strong> of <strong>{total}</strong> SC reviewed</span>
        <span><strong>{failureCount}</strong> {failureCount === 1 ? 'failure' : 'failures'} logged on this page</span>
      </div>

      {/* Filters */}
      <div className="checklist-filters" role="group" aria-label="Checklist filters">
        <div className="filter-group">
          <span className="filter-label" id="level-filter-label">Level</span>
          <div className="filter-btns" role="group" aria-labelledby="level-filter-label">
            {['all', 'A', 'AA'].map(l => (
              <button
                key={l}
                type="button"
                className={`filter-btn${levelFilter === l ? ' active' : ''}`}
                aria-pressed={levelFilter === l}
                onClick={() => setLevelFilter(l)}
              >
                {l === 'all' ? 'All' : l}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label" id="status-filter-label">Status</span>
          <div className="filter-btns" role="group" aria-labelledby="status-filter-label">
            {[
              { value: 'all',       label: 'All' },
              { value: 'unchecked', label: 'Unchecked' },
              { value: 'pass',      label: 'Pass' },
              { value: 'fail',      label: 'Fail' },
              { value: 'na',        label: 'N/A' },
            ].map(o => (
              <button
                key={o.value}
                type="button"
                className={`filter-btn${statusFilter === o.value ? ' active' : ''}`}
                aria-pressed={statusFilter === o.value}
                onClick={() => setStatusFilter(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Principles */}
      {PRINCIPLES.map(principle => {
        const criteria = visibleCriteria(principle.id);
        if (criteria.length === 0) return null;
        const isCollapsed = collapsed[principle.id];
        const principleFailCount = criteria.filter(c => (checklist[c.id]?.status || 'unchecked') === 'fail').length;
        const principlePassCount = criteria.filter(c => (checklist[c.id]?.status || 'unchecked') === 'pass').length;

        return (
          <section key={principle.id} className="principle-section" aria-labelledby={`principle-${principle.id}`}>
            <button
              type="button"
              className="principle-toggle"
              aria-expanded={!isCollapsed}
              aria-controls={`principle-body-${principle.id}`}
              id={`principle-${principle.id}`}
              onClick={() => toggleCollapse(principle.id)}
            >
              <span className="principle-toggle-icon" aria-hidden="true">
                {isCollapsed ? '▶' : '▼'}
              </span>
              <span className="principle-name">{principle.label}</span>
              <span className="principle-stats" aria-label={`${principlePassCount} passed, ${principleFailCount} failed`}>
                {principlePassCount > 0 && <span className="stat-pass">{principlePassCount} pass</span>}
                {principleFailCount > 0 && <span className="stat-fail">{principleFailCount} fail</span>}
              </span>
            </button>

            <div id={`principle-body-${principle.id}`} hidden={isCollapsed}>
              <ul className="sc-list" aria-label={`${principle.label} success criteria`}>
                {criteria.map(c => (
                  <ScRow
                    key={c.id}
                    criterion={c}
                    status={checklist[c.id]?.status || 'unchecked'}
                    failures={failures.filter(f => f.wcag_criterion === c.full)}
                    projectId={projectId}
                    scopeItemId={scopeItemId}
                    scopeItemPageName={scopeItem.page_name}
                    onStatusChange={setStatus}
                    onFailureLogged={refreshFailures}
                  />
                ))}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ScRow({ criterion, status, failures, projectId, scopeItemId, scopeItemPageName, onStatusChange }) {
  const hasOpenIssues = failures.some(f => f.status === 'open');

  const logUrl = `/projects/${projectId}/failures/new?sc=${encodeURIComponent(criterion.full)}&page=${encodeURIComponent(scopeItemPageName)}&scopeItemId=${scopeItemId}&returnTo=checklist`;

  return (
    <li className={`sc-row sc-row--${status}`}>
      <div className="sc-row-main">
        <div className="sc-row-info">
          <span className="sc-id">{criterion.id}</span>
          <span className="sc-name">{criterion.label.replace(criterion.id + ' ', '')}</span>
          <span className={`sc-level level-${criterion.level.toLowerCase()}`}>{criterion.level}</span>
          {failures.length > 0 && (
            <span className="sc-issue-badge" aria-label={`${failures.length} issue${failures.length !== 1 ? 's' : ''} logged`}>
              {failures.length} issue{failures.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="sc-actions" role="group" aria-label={`${criterion.id} verdict`}>
          <button
            type="button"
            className={`verdict-btn verdict-pass${status === 'pass' ? ' active' : ''}`}
            aria-pressed={status === 'pass'}
            onClick={() => onStatusChange(criterion.id, status === 'pass' ? 'unchecked' : 'pass')}
          >
            Pass
          </button>
          <button
            type="button"
            className={`verdict-btn verdict-fail${status === 'fail' ? ' active' : ''}`}
            aria-pressed={status === 'fail'}
            onClick={() => onStatusChange(criterion.id, status === 'fail' ? 'unchecked' : 'fail')}
          >
            Fail
          </button>
          <button
            type="button"
            className={`verdict-btn verdict-na${status === 'na' ? ' active' : ''}`}
            aria-pressed={status === 'na'}
            onClick={() => onStatusChange(criterion.id, status === 'na' ? 'unchecked' : 'na')}
          >
            N/A
          </button>
        </div>
      </div>

      {status === 'pass' && hasOpenIssues && (
        <div className="sc-warn" role="alert">
          This SC has open issues logged against it. Consider reviewing before marking as Pass.
        </div>
      )}

      {(failures.length > 0 || status === 'fail') && status !== 'pass' && status !== 'na' && (
        <div className="sc-fail-panel">
          {failures.length > 0 && (
            <ul className="sc-issues-list" aria-label="Logged issues">
              {failures.map(f => (
                <li key={f.id} className="sc-issue-item">
                  <Link
                    to={`/projects/${projectId}/failures/${f.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none', color: 'inherit', flex: 1 }}
                  >
                    <span className={`badge badge-${f.severity.toLowerCase()}`}>{f.severity}</span>
                    <span className="sc-issue-subject" style={{ flex: 1 }}>{f.subject}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {status === 'fail' && (
            <Link to={logUrl} className="btn btn-secondary btn-sm">
              + Log issue for this SC
            </Link>
          )}
        </div>
      )}
    </li>
  );
}
