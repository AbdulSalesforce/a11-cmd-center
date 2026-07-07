import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => { setError('Could not load projects.'); setLoading(false); });
  }, []);

  // Calculate overall stats
  const totalProjects = projects.length;
  const totalFailures = projects.reduce((sum, p) => sum + (p.failure_count || 0), 0);
  const completedProjects = projects.filter(p => p.scope_complete === p.scope_total && p.scope_total > 0).length;
  const avgCompletion = totalProjects > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.scope_total > 0 ? (p.scope_complete / p.scope_total) * 100 : 0), 0) / totalProjects)
    : 0;

  // Group projects by auditor
  const auditorMap = new Map();
  projects.forEach(project => {
    const auditor = project.auditor_name || 'Unassigned';
    if (!auditorMap.has(auditor)) {
      auditorMap.set(auditor, {
        name: auditor,
        projects: [],
        totalFailures: 0,
        completedProjects: 0,
      });
    }
    const auditorData = auditorMap.get(auditor);
    auditorData.projects.push(project);
    auditorData.totalFailures += project.failure_count || 0;
    if (project.scope_complete === project.scope_total && project.scope_total > 0) {
      auditorData.completedProjects++;
    }
  });

  const auditors = Array.from(auditorMap.values()).map(auditor => {
    const totalCompletion = auditor.projects.reduce((sum, p) => {
      return sum + (p.scope_total > 0 ? (p.scope_complete / p.scope_total) * 100 : 0);
    }, 0);
    return {
      ...auditor,
      avgCompletion: auditor.projects.length > 0 ? Math.round(totalCompletion / auditor.projects.length) : 0,
    };
  });

  // Sort auditors by name
  auditors.sort((a, b) => {
    if (a.name === 'Unassigned') return 1;
    if (b.name === 'Unassigned') return -1;
    return a.name.localeCompare(b.name);
  });

  // Get recent/in-progress projects (limit to 6)
  const recentProjects = projects
    .filter(p => p.scope_complete < p.scope_total)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <div className="slds-scope">
      {/* Page Header */}
      <div className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__body">
                <div className="slds-page-header__name">
                  <div className="slds-page-header__name-title">
                    <h1>
                      <span className="slds-page-header__title slds-truncate" title="Dashboard">Dashboard</span>
                    </h1>
                  </div>
                </div>
                <p className="slds-page-header__name-meta">Overview of all accessibility audits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="slds-m-top_large">
        {loading && (
          <div className="slds-text-align_center slds-p-vertical_large">
            <div className="slds-spinner_container">
              <div role="status" className="slds-spinner slds-spinner_medium">
                <span className="slds-assistive-text">Loading dashboard...</span>
                <div className="slds-spinner__dot-a"></div>
                <div className="slds-spinner__dot-b"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="slds-notify slds-notify_alert slds-alert_error" role="alert">
            <span className="slds-assistive-text">Error</span>
            <h2>{error}</h2>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <div className="slds-grid slds-wrap slds-gutters slds-m-bottom_large">
              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#0176d3', fontSize: '2.5rem' }}>
                        {totalProjects}
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Total Projects</div>
                    </div>
                  </div>
                </article>
              </div>

              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#ea001e', fontSize: '2.5rem' }}>
                        {totalFailures}
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Total Failures</div>
                    </div>
                  </div>
                </article>
              </div>

              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#04844b', fontSize: '2.5rem' }}>
                        {completedProjects}
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Completed Projects</div>
                    </div>
                  </div>
                </article>
              </div>

              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-4">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#0176d3', fontSize: '2.5rem' }}>
                        {avgCompletion}%
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Average Completion</div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Auditors Section */}
            <div className="slds-m-bottom_large">
              <div className="slds-text-heading_medium slds-m-bottom_medium">Auditors</div>
              {auditors.length === 0 ? (
                <div className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <p className="slds-text-body_regular">No auditors assigned yet.</p>
                  </div>
                </div>
              ) : (
                <div className="slds-grid slds-wrap slds-gutters">
                  {auditors.map(auditor => (
                    <div key={auditor.name} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">
                      <article className="slds-card">
                        <div className="slds-card__header slds-grid">
                          <header className="slds-media slds-media_center slds-has-flexi-truncate">
                            <div className="slds-media__body">
                              <h2 className="slds-card__header-title">
                                {auditor.name === 'Unassigned' ? (
                                  <span className="slds-truncate" title={auditor.name}>{auditor.name}</span>
                                ) : (
                                  <Link to={`/auditors/${encodeURIComponent(auditor.name)}`} className="slds-card__header-link">
                                    <span className="slds-truncate" title={auditor.name}>{auditor.name}</span>
                                  </Link>
                                )}
                              </h2>
                            </div>
                          </header>
                        </div>
                        <div className="slds-card__body slds-card__body_inner">
                          <div className="slds-grid slds-grid_vertical-align-center slds-m-bottom_small">
                            <div className="slds-col">
                              <p className="slds-text-body_small"><strong>{auditor.projects.length}</strong> project{auditor.projects.length !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="slds-col">
                              <p className="slds-text-body_small"><strong>{auditor.completedProjects}</strong> complete</p>
                            </div>
                          </div>
                          <div className="slds-grid slds-grid_vertical-align-center slds-m-bottom_small">
                            <div className="slds-col">
                              <p className="slds-text-body_small"><strong>{auditor.totalFailures}</strong> failure{auditor.totalFailures !== 1 ? 's' : ''}</p>
                            </div>
                            <div className="slds-col">
                              <p className="slds-text-body_small"><strong>{auditor.avgCompletion}%</strong> avg. complete</p>
                            </div>
                          </div>
                        </div>
                        {auditor.name !== 'Unassigned' && (
                          <footer className="slds-card__footer">
                            <Link to={`/auditors/${encodeURIComponent(auditor.name)}`} className="slds-card__footer-action">
                              View Projects
                              <svg className="slds-button__icon slds-button__icon_right" aria-hidden="true">
                                <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#forward"></use>
                              </svg>
                            </Link>
                          </footer>
                        )}
                      </article>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent/In-Progress Projects */}
            {recentProjects.length > 0 && (
              <div>
                <div className="slds-grid slds-grid_align-spread slds-m-bottom_medium">
                  <div className="slds-text-heading_medium">In Progress</div>
                  <Link to="/projects" className="slds-text-link">View all projects</Link>
                </div>
                <div className="slds-grid slds-wrap slds-gutters">
                  {recentProjects.map(project => {
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
                                    <span className="slds-truncate" title={project.product_name}>{project.product_name}</span>
                                  </Link>
                                </h2>
                              </div>
                            </header>
                          </div>
                          <div className="slds-card__body slds-card__body_inner">
                            {project.auditor_name && (
                              <p className="slds-text-body_small slds-m-bottom_x-small">
                                <strong>Auditor:</strong> {project.auditor_name}
                              </p>
                            )}
                            <div className="slds-m-top_medium">
                              <div className="slds-grid slds-grid_align-spread slds-text-body_small slds-m-bottom_xx-small">
                                <span><strong>{project.failure_count}</strong> failures</span>
                                <span><strong>{progressPercent}%</strong> complete</span>
                              </div>
                              <div className="slds-progress-bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent} role="progressbar">
                                <span className="slds-progress-bar__value" style={{ width: `${progressPercent}%` }}>
                                  <span className="slds-assistive-text">{progressPercent}% Complete</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <footer className="slds-card__footer">
                            <Link to={`/projects/${project.id}`} className="slds-card__footer-action">
                              View Project
                              <svg className="slds-button__icon slds-button__icon_right" aria-hidden="true">
                                <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#forward"></use>
                              </svg>
                            </Link>
                          </footer>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {totalProjects === 0 && (
              <div className="slds-illustration slds-illustration_large">
                <div className="slds-text-longform">
                  <h3 className="slds-text-heading_medium">No projects yet</h3>
                  <p className="slds-text-body_regular">Get started by creating your first accessibility audit project.</p>
                  <Link to="/projects/new" className="slds-button slds-button_brand slds-m-top_medium">
                    Create Your First Project
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
