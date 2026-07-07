import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

export default function AuditorDetail() {
  const { auditorName } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const decodedName = decodeURIComponent(auditorName);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        const filtered = data.filter(p => p.auditor_name === decodedName);
        setProjects(filtered);
        setLoading(false);
      })
      .catch(() => { setError('Could not load projects.'); setLoading(false); });
  }, [decodedName]);

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

  // Calculate stats
  const totalFailures = projects.reduce((sum, p) => sum + (p.failure_count || 0), 0);
  const completedProjects = projects.filter(p => p.scope_complete === p.scope_total && p.scope_total > 0).length;
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + (p.scope_total > 0 ? (p.scope_complete / p.scope_total) * 100 : 0), 0) / projects.length)
    : 0;

  return (
    <div className="slds-scope">
      {/* Page Header */}
      <div className="slds-page-header">
        <div className="slds-page-header__row">
          <div className="slds-page-header__col-title">
            <div className="slds-media">
              <div className="slds-media__figure">
                <button
                  className="slds-button slds-button_icon slds-button_icon-border"
                  onClick={() => navigate('/')}
                  title="Back to Dashboard"
                >
                  <svg className="slds-button__icon" aria-hidden="true">
                    <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#back"></use>
                  </svg>
                  <span className="slds-assistive-text">Back to Dashboard</span>
                </button>
              </div>
              <div className="slds-media__body">
                <nav aria-label="Breadcrumb">
                  <ol className="slds-breadcrumb slds-list_horizontal slds-wrap">
                    <li className="slds-breadcrumb__item">
                      <Link to="/">Dashboard</Link>
                    </li>
                    <li className="slds-breadcrumb__item">
                      <span>{decodedName}</span>
                    </li>
                  </ol>
                </nav>
                <div className="slds-page-header__name">
                  <div className="slds-page-header__name-title">
                    <h1>
                      <span className="slds-page-header__title slds-truncate" title={decodedName}>{decodedName}</span>
                    </h1>
                  </div>
                </div>
                <p className="slds-page-header__name-meta">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
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
                <span className="slds-assistive-text">Loading projects...</span>
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
              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#ea001e', fontSize: '2rem' }}>
                        {totalFailures}
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Total Failures</div>
                    </div>
                  </div>
                </article>
              </div>

              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#04844b', fontSize: '2rem' }}>
                        {completedProjects}
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Completed Projects</div>
                    </div>
                  </div>
                </article>
              </div>

              <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3">
                <article className="slds-card">
                  <div className="slds-card__body slds-card__body_inner slds-p-around_medium">
                    <div className="slds-text-align_center">
                      <div className="slds-text-heading_large" style={{ color: '#0176d3', fontSize: '2rem' }}>
                        {avgCompletion}%
                      </div>
                      <div className="slds-text-body_regular slds-m-top_x-small">Average Completion</div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Projects */}
            {projects.length === 0 ? (
              <div className="slds-illustration slds-illustration_large">
                <div className="slds-text-longform">
                  <h3 className="slds-text-heading_medium">No projects assigned</h3>
                  <p className="slds-text-body_regular">This auditor doesn't have any projects yet.</p>
                </div>
              </div>
            ) : (
              <div className="slds-grid slds-wrap slds-gutters">
                {projects.map(project => {
                  const isComplete = project.scope_complete === project.scope_total && project.scope_total > 0;

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
                                    {isComplete && (
                                      <span className="slds-icon_container slds-icon-utility-check slds-current-color slds-m-left_x-small" style={{ color: '#04844b' }}>
                                        <svg className="slds-icon slds-icon_xx-small" aria-hidden="true">
                                          <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                                        </svg>
                                        <span className="slds-assistive-text">Complete</span>
                                      </span>
                                    )}
                                  </span>
                                </Link>
                              </h2>
                            </div>
                            <div className="slds-no-flex">
                              {confirmingId === project.id ? (
                                <div className="slds-button-group" role="group">
                                  <button
                                    className="slds-button slds-button_destructive slds-button_small"
                                    onClick={() => handleConfirmDelete(project.id)}
                                    disabled={deleting}
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    className="slds-button slds-button_neutral slds-button_small"
                                    onClick={() => setConfirmingId(null)}
                                    disabled={deleting}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="slds-button slds-button_icon slds-button_icon-border-filled"
                                  onClick={() => setConfirmingId(project.id)}
                                  title="Delete project"
                                >
                                  <svg className="slds-button__icon" aria-hidden="true">
                                    <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#delete"></use>
                                  </svg>
                                  <span className="slds-assistive-text">Delete project</span>
                                </button>
                              )}
                            </div>
                          </header>
                        </div>
                        <div className="slds-card__body slds-card__body_inner">
                          {project.pm_name && (
                            <p className="slds-text-body_small slds-m-bottom_x-small">
                              <strong>PM:</strong> {project.pm_name}
                            </p>
                          )}
                          {project.release_build_name && (
                            <p className="slds-text-body_small slds-m-bottom_x-small">
                              <strong>Build:</strong> {project.release_build_name}
                            </p>
                          )}

                          <div className="slds-m-top_medium">
                            <div className="slds-grid slds-grid_align-spread slds-text-body_small slds-m-bottom_xx-small">
                              <span><strong>{project.failure_count}</strong> failures</span>
                              <span><strong>{project.scope_complete}/{project.scope_total}</strong> complete</span>
                            </div>
                            <div className="slds-progress-bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={project.scope_total > 0 ? Math.round((project.scope_complete / project.scope_total) * 100) : 0} role="progressbar">
                              <span className="slds-progress-bar__value" style={{ width: project.scope_total > 0 ? `${Math.round((project.scope_complete / project.scope_total) * 100)}%` : '0%' }}>
                                <span className="slds-assistive-text">{project.scope_total > 0 ? Math.round((project.scope_complete / project.scope_total) * 100) : 0}% Complete</span>
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
