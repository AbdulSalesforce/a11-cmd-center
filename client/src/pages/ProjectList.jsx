import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DUMMY_PROJECTS } from '../data/dummyProjects';
import { getStoredProjects } from '../data/projectStore';

function CheckIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7.5" stroke="#22863a"/>
      <path d="M4.5 8.5L6.5 10.5L11 6" stroke="#22863a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2h4a1 1 0 0 1 1 1v1H5V3a1 1 0 0 1 1-1Z" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M2 5h12v1H3.5l.9 8.1A1 1 0 0 0 5.4 15h5.2a1 1 0 0 0 .998-.9L12.5 6H14V5H2Zm3.506 1h4.988l-.778 7H6.284L5.506 6Z" fill="currentColor"/>
    </svg>
  );
}

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const stored = getStoredProjects().filter(p => !p.archived);
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        // Filter out archived projects
        const activeProjects = data.filter(p => !p.archived);
        // Fall back to dummy projects when there's nothing from the API
        const base = activeProjects.length > 0 ? activeProjects : DUMMY_PROJECTS;
        // Locally-created projects always show, on top
        setProjects([...stored, ...base]);
        setLoading(false);
      })
      .catch(() => { setProjects([...stored, ...DUMMY_PROJECTS]); setLoading(false); });
  }, []);

  function handleDeleteClick(id) {
    setConfirmingId(id);
  }

  function handleCancel() {
    setConfirmingId(null);
  }

  async function handleConfirmDelete(id) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProjects(prev => prev.filter(p => p.id !== id));
      setConfirmingId(null);
    } catch {
      setError('Could not delete project. Please try again.');
      setConfirmingId(null);
    } finally {
      setDeleting(false);
    }
  }

  // Filter projects by the search query (product name, auditor, or build)
  const query = search.trim().toLowerCase();
  const filteredProjects = query
    ? projects.filter(p =>
        [p.product_name, p.auditor_name, p.release_build_name]
          .some(field => (field || '').toLowerCase().includes(query))
      )
    : projects;

  // Group projects by auditor
  const auditorMap = new Map();
  filteredProjects.forEach(project => {
    const auditor = project.auditor_name || 'Unassigned';
    if (!auditorMap.has(auditor)) {
      auditorMap.set(auditor, []);
    }
    auditorMap.get(auditor).push(project);
  });

  // Convert to array and sort
  const auditorGroups = Array.from(auditorMap.entries()).sort((a, b) => {
    if (a[0] === 'Unassigned') return 1;
    if (b[0] === 'Unassigned') return -1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="slds-scope">
      <div style={{
        background: 'linear-gradient(to right, #1B5F9E, #2E70B8)',
        padding: '2rem 2rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            color: '#ffffff',
            fontSize: '2rem',
            fontWeight: '700',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            Active Projects
          </h1>
          <p style={{
            color: '#ffffff',
            fontSize: '0.875rem',
            margin: 0,
            marginBottom: '1.25rem',
            opacity: 0.9
          }}>
            All active accessibility audit projects
          </p>

          <div style={{ maxWidth: '420px' }}>
            <label htmlFor="project-search" className="slds-assistive-text">
              Search projects
            </label>
            <input
              id="project-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, auditor, or build…"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.25rem',
                border: '1px solid #ffffff',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      {loading && <p>Loading projects…</p>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!loading && !error && projects.length === 0 && (
        <div className="slds-illustration slds-illustration_large">
          <div className="slds-text-longform">
            <h3 className="slds-text-heading_medium">No active projects</h3>
            <p className="slds-text-body_regular">Get started by creating your first accessibility audit project.</p>
            <Link to="/projects/new" className="slds-button slds-button_brand slds-m-top_medium">
              Create Your First Project
            </Link>
          </div>
        </div>
      )}

      {!loading && projects.length > 0 && filteredProjects.length === 0 && (
        <div className="slds-illustration slds-illustration_large">
          <div className="slds-text-longform">
            <h3 className="slds-text-heading_medium">No projects match “{search}”</h3>
            <p className="slds-text-body_regular">Try a different product name, auditor, or build.</p>
          </div>
        </div>
      )}

      {!loading && filteredProjects.length > 0 && auditorGroups.map(([auditorName, auditorProjects]) => (
        <div key={auditorName} className="slds-m-bottom_x-large">
          <h2 className="slds-text-heading_medium slds-m-bottom_medium">{auditorName}</h2>
          <div className="slds-grid slds-wrap slds-gutters">
          {auditorProjects.map(project => {
            const progressPercent = project.scope_total > 0
              ? Math.round((project.scope_complete / project.scope_total) * 100)
              : 0;

            return (
              <div key={project.id} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">
                <article className="slds-card">
                  <div className="slds-card__header slds-grid">
                    <header className="slds-media slds-media_center slds-has-flexi-truncate">
                      <div className="slds-media__body">
                        <h2 className="slds-card__header-title">
                          <Link to={`/projects/${project.id}`} className="slds-card__header-link">
                            <span className="slds-truncate" title={project.product_name}>
                              {project.product_name}
                              {project.scope_total > 0 && project.scope_complete === project.scope_total && (
                                <span style={{ marginLeft: '0.5rem' }} title="All scope items complete"><CheckIcon /></span>
                              )}
                            </span>
                          </Link>
                        </h2>
                      </div>
                    </header>
                  </div>
                  <div className="slds-card__body slds-card__body_inner">
                    <div className="slds-m-bottom_small">
                      {project.release_build_name && (
                        <p className="slds-text-body_small slds-m-bottom_xx-small">
                          <strong>Build:</strong> {project.release_build_name}
                        </p>
                      )}
                      <p className="slds-text-body_small">
                        <strong>{project.failure_count}</strong> {project.failure_count === 1 ? 'failure' : 'failures'}
                      </p>
                    </div>
                    {project.scope_total > 0 && (
                      <div className="slds-m-top_medium">
                        <div className="slds-grid slds-grid_align-spread slds-text-body_small slds-m-bottom_xx-small">
                          <span><strong>{progressPercent}%</strong> complete</span>
                          <span><strong>{project.scope_complete}/{project.scope_total}</strong> scope</span>
                        </div>
                        <div className="slds-progress-bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent} role="progressbar">
                          <span className="slds-progress-bar__value" style={{ width: `${progressPercent}%` }}>
                            <span className="slds-assistive-text">{progressPercent}% Complete</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <footer className="slds-card__footer">
                    {confirmingId === project.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
                        <span className="slds-text-body_small">Delete this project?</span>
                        <button
                          className="slds-button slds-button_destructive slds-button_stretch"
                          onClick={() => handleConfirmDelete(project.id)}
                          disabled={deleting}
                        >
                          Delete
                        </button>
                        <button
                          className="slds-button slds-button_neutral slds-button_stretch"
                          onClick={handleCancel}
                          disabled={deleting}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/projects/${project.id}`} className="slds-card__footer-action" style={{ flex: 1 }}>
                          View Project
                          <svg className="slds-button__icon slds-button__icon_right" aria-hidden="true">
                            <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#forward"></use>
                          </svg>
                        </Link>
                        <button
                          className="slds-button slds-button_icon slds-button_icon-border"
                          onClick={() => handleDeleteClick(project.id)}
                          aria-label={`Delete ${project.product_name}`}
                          title="Delete project"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </footer>
                </article>
              </div>
            );
          })}
          </div>
        </div>
      ))
      }
    </div>
  );
}
