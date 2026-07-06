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

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => { setError('Could not load projects.'); setLoading(false); });
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
        <h2>Projects</h2>
        <Link to="/projects/new" className="btn btn-primary">New project</Link>
      </div>

      {loading && <p>Loading projects…</p>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {!loading && !error && projects.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            No projects yet.
          </p>
          <Link to="/projects/new" className="btn btn-primary">Create your first project</Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {projects.map(project => (
            <li key={project.id}>
              <article className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Link to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
                      {project.product_name}
                    </Link>
                    {project.scope_total > 0 && project.scope_complete === project.scope_total && (
                      <span title="All scope items complete"><CheckIcon /></span>
                    )}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    {project.release_build_name && <span>Build {project.release_build_name} · </span>}
                    {project.failure_count} {project.failure_count === 1 ? 'failure' : 'failures'}
                    {project.scope_total > 0 && (
                      <span> · {project.scope_complete}/{project.scope_total} scope items complete</span>
                    )}
                  </p>
                </div>

                {confirmingId === project.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      Delete this project?
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleConfirmDelete(project.id)}
                      disabled={deleting}
                    >
                      Delete
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleCancel}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm">
                      Open
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteClick(project.id)}
                      aria-label={`Delete ${project.product_name}`}
                      style={{ color: 'var(--color-text-secondary)', padding: 'var(--space-1)' }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
