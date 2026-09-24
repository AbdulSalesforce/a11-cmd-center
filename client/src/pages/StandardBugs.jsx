import { useState } from 'react';
import { Link } from 'react-router-dom';
import ISSUE_LIBRARY from '../data/issue-library.json';

const SEVERITY_COLORS = {
  P0: '#8c0d13', P1: '#ba0517', P2: '#fe9339', P3: '#0176d3',
};

function SeverityPill({ severity }) {
  return (
    <span
      className="slds-badge"
      style={{ backgroundColor: SEVERITY_COLORS[severity] || '#747474', color: '#ffffff', fontWeight: 600 }}
    >
      {severity}
    </span>
  );
}

// A single expandable issue row: summary columns always visible, full detail
// (failing scenario + reference resources) shown when expanded.
function IssueRow({ issue }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="slds-hint-parent">
        <td>
          <button
            type="button"
            className="slds-button slds-button_icon slds-button_icon-x-small"
            aria-expanded={open}
            aria-label={open ? `Collapse issue ${issue.id}` : `Expand issue ${issue.id}`}
            onClick={() => setOpen(o => !o)}
            style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }}
          >
            ▸
          </button>
        </td>
        <th scope="row"><strong>{issue.id}</strong></th>
        <td>
          <Link to={`/standards/${issue.sc_code}`} className="slds-text-link" title={issue.wcag_criteria}>
            {issue.sc_code}
          </Link>
        </td>
        <td>{issue.criterion_name}</td>
        <td><SeverityPill severity={issue.severity} /></td>
        <td>{issue.impact_level}</td>
        <td>
          <button type="button" className="slds-button slds-button_link" onClick={() => setOpen(o => !o)} style={{ textAlign: 'left' }}>
            {issue.failing_scenario.length > 90 ? issue.failing_scenario.slice(0, 90) + '…' : issue.failing_scenario}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: '#f8f9fb', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <Detail label="WCAG success criterion">{issue.wcag_criteria}</Detail>
              <Detail label="Failing scenario">{issue.failing_scenario}</Detail>
              {issue.reference_resources?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#54698d', marginBottom: '0.25rem' }}>
                    Reference resources
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {issue.reference_resources.map((ref, i) => (
                      <li key={i}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#54698d', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

const PRIORITIES = ['all', 'P0', 'P1', 'P2', 'P3'];

export default function StandardBugs() {
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');

  const query = search.trim().toLowerCase();
  const issues = ISSUE_LIBRARY.filter(i => {
    if (priority !== 'all' && i.severity !== priority) return false;
    if (!query) return true;
    return [
      i.id, i.sc_code, i.wcag_criteria, i.criterion_name, i.severity,
      i.impact_level, i.failing_scenario, ...(i.reference_resources || []),
    ].some(field => (field || '').toLowerCase().includes(query));
  });

  return (
    <div className="slds-scope">
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(to right, #1B5F9E, #2E70B8)',
        padding: '2rem 2rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <Link
          to="/standards"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            color: '#ffffff', fontSize: '0.875rem', textDecoration: 'none',
            marginBottom: '1rem', opacity: 0.9
          }}
        >
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Standards
        </Link>
        <h1 style={{ color: '#ffffff', fontSize: '2rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>
          Issue Library
        </h1>
        <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: 0, marginBottom: '1.25rem', opacity: 0.9 }}>
          Standard accessibility issues mapped to WCAG success criteria — reference these when logging a new bug.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 320px', maxWidth: '420px' }}>
            <label htmlFor="issue-search" className="slds-assistive-text">Search the issue library</label>
            <input
              id="issue-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SC code, criterion, priority, scenario…"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #ffffff', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label htmlFor="issue-priority" className="slds-assistive-text">Filter by priority</label>
            <select
              id="issue-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #ffffff', fontSize: '0.875rem' }}
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p === 'all' ? 'All priorities' : p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="slds-text-body_small slds-text-color_weak slds-m-bottom_small" aria-live="polite">
        Showing {issues.length} of {ISSUE_LIBRARY.length} issues
      </p>

      {/* Table */}
      <div className="slds-card">
        <table className="slds-table slds-table_cell-buffer slds-table_bordered">
          <thead>
            <tr className="slds-line-height_reset">
              <th scope="col" style={{ width: '2.5rem' }}><span className="slds-assistive-text">Expand</span></th>
              <th scope="col"><div className="slds-truncate" title="ID">ID</div></th>
              <th scope="col"><div className="slds-truncate" title="SC Code">SC Code</div></th>
              <th scope="col"><div className="slds-truncate" title="Criterion">Criterion</div></th>
              <th scope="col"><div className="slds-truncate" title="Priority">Priority</div></th>
              <th scope="col"><div className="slds-truncate" title="Impact Level">Impact Level</div></th>
              <th scope="col"><div className="slds-truncate" title="Failing Scenario">Failing Scenario</div></th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </tbody>
        </table>

        {issues.length === 0 && (
          <div className="slds-p-around_large slds-text-align_center slds-text-color_weak">
            No issues match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
