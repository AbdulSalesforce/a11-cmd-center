import { useState } from 'react';
import { Link } from 'react-router-dom';
import ISSUE_LIBRARY from '../data/issue-library.json';

const SEVERITY_COLORS = {
  P1: '#ba0517', P2: '#fe9339', P3: '#0176d3', P4: '#747474',
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
// (failing scenario, recommendation, before/after code) shown when expanded.
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
        <td>{issue.category}</td>
        <td>{issue.level}</td>
        <td><SeverityPill severity={issue.severity} /></td>
        <td>{issue.impact_level}</td>
        <td>{issue.include_in_acr}</td>
        <td>
          <button type="button" className="slds-button slds-button_link" onClick={() => setOpen(o => !o)}>
            {issue.failing_scenario.length > 90 ? issue.failing_scenario.slice(0, 90) + '…' : issue.failing_scenario}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={9} style={{ background: '#f8f9fb', padding: '1rem 1.5rem' }}>
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              <Detail label="Failing scenario">{issue.failing_scenario}</Detail>
              <Detail label="Recommendation">{issue.recommendation}</Detail>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <CodeBlock label="Code — Before (failing)" code={issue.code_before} tone="bad" />
                <CodeBlock label="Code — After (fixed)" code={issue.code_after} tone="good" />
              </div>
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

function CodeBlock({ label, code, tone }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: tone === 'good' ? '#04844b' : '#ba0517', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <pre style={{
        margin: 0,
        background: '#0b1b2b',
        color: '#e6edf3',
        borderRadius: '0.25rem',
        padding: '0.75rem',
        overflowX: 'auto',
        fontSize: '0.8125rem',
        lineHeight: 1.45,
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function StandardBugs() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = ['all', ...new Set(ISSUE_LIBRARY.map(i => i.category))];

  const query = search.trim().toLowerCase();
  const issues = ISSUE_LIBRARY.filter(i => {
    if (category !== 'all' && i.category !== category) return false;
    if (!query) return true;
    return [
      i.id, i.sc_code, i.wcag_criteria, i.category, i.level, i.severity,
      i.impact_level, i.include_in_acr, i.failing_scenario, i.recommendation,
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
              placeholder="Search by SC code, category, severity, scenario…"
              style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #ffffff', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label htmlFor="issue-category" className="slds-assistive-text">Filter by category</label>
            <select
              id="issue-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #ffffff', fontSize: '0.875rem' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
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
              <th scope="col"><div className="slds-truncate" title="Category">Category</div></th>
              <th scope="col"><div className="slds-truncate" title="Level">Level</div></th>
              <th scope="col"><div className="slds-truncate" title="Severity">Severity</div></th>
              <th scope="col"><div className="slds-truncate" title="Impact Level">Impact Level</div></th>
              <th scope="col"><div className="slds-truncate" title="In ACR?">In ACR?</div></th>
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
