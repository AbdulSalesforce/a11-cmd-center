import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function CheckIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7.5" stroke="#22863a"/>
      <path d="M4.5 8.5L6.5 10.5L11 6" stroke="#22863a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function ArchivedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        // Filter only archived projects
        const archivedProjects = data.filter(p => p.archived);
        setProjects(archivedProjects);
        setLoading(false);
      })
      .catch(() => { setError('Could not load projects.'); setLoading(false); });
  }, []);

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
            Archived Projects
          </h1>
          <p style={{
            color: '#ffffff',
            fontSize: '0.875rem',
            margin: 0,
            opacity: 0.9
          }}>
            Completed accessibility audit projects
          </p>
        </div>
      </div>

      {loading && (
        <div className="slds-text-align_center slds-p-vertical_large">
          <div className="slds-spinner_container">
            <div role="status" className="slds-spinner slds-spinner_medium">
              <span className="slds-assistive-text">Loading archived projects...</span>
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

      {!loading && !error && projects.length === 0 && (
        <div className="slds-illustration slds-illustration_large">
          <div className="slds-text-longform">
            <h3 className="slds-text-heading_medium">No archived projects</h3>
            <p className="slds-text-body_regular">Completed projects will appear here.</p>
          </div>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="slds-card">
          <div className="slds-card__body slds-card__body_inner">
            <table className="slds-table slds-table_cell-buffer slds-table_bordered">
              <thead>
                <tr className="slds-line-height_reset">
                  <th scope="col">
                    <div className="slds-truncate" title="Product Name">Product Name</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Auditor">Auditor</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Build">Build</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Failures">Failures</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Scope">Scope</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Status">Status</div>
                  </th>
                  <th scope="col">
                    <div className="slds-truncate" title="Actions">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => {
                  const isComplete = project.scope_complete === project.scope_total && project.scope_total > 0;
                  const progressPercent = project.scope_total > 0
                    ? Math.round((project.scope_complete / project.scope_total) * 100)
                    : 0;

                  return (
                    <tr key={project.id}>
                      <th scope="row" data-label="Product Name">
                        <div className="slds-truncate" title={project.product_name}>
                          <Link to={`/projects/${project.id}`} className="slds-text-link">
                            {project.product_name}
                          </Link>
                        </div>
                      </th>
                      <td data-label="Auditor">
                        <div className="slds-truncate" title={project.auditor_name || 'Unassigned'}>
                          {project.auditor_name || 'Unassigned'}
                        </div>
                      </td>
                      <td data-label="Build">
                        <div className="slds-truncate" title={project.release_build_name || '—'}>
                          {project.release_build_name || '—'}
                        </div>
                      </td>
                      <td data-label="Failures">
                        <div className="slds-truncate">
                          {project.failure_count}
                        </div>
                      </td>
                      <td data-label="Scope">
                        <div className="slds-truncate">
                          {project.scope_complete}/{project.scope_total}
                        </div>
                      </td>
                      <td data-label="Status">
                        {isComplete ? (
                          <span className="slds-badge slds-theme_success">
                            <CheckIcon /> Complete
                          </span>
                        ) : (
                          <span className="slds-badge">
                            {progressPercent}%
                          </span>
                        )}
                      </td>
                      <td data-label="Actions">
                        <Link to={`/projects/${project.id}`} className="slds-button slds-button_neutral slds-button_stretch">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
