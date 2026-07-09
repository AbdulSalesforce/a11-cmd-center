import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

export default function FailureDetail() {
  const { id: projectId, failureId } = useParams();
  const navigate = useNavigate();
  const [failure, setFailure] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/failures/${failureId}`).then(r => r.json()),
    ])
      .then(([proj, fail]) => {
        setProject(proj);
        setFailure(fail);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load failure.');
        setLoading(false);
      });
  }, [projectId, failureId]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/failures/${failureId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      navigate(`/projects/${projectId}?tab=failures`);
    } catch {
      setError('Could not delete failure. Please try again.');
      setDeleting(false);
    }
  }

  if (loading) return <p>Loading failure…</p>;
  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!failure || !project) return <p>Failure not found.</p>;

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
          <Link to={`/projects/${projectId}?tab=failures`} style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.875rem', textDecoration: 'none' }}>
            Failures
          </Link>
          <span style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.875rem' }}>/</span>
          <span style={{ color: '#ffffff', opacity: 0.9, fontSize: '0.875rem' }}>SF-{failure.sf_issue_id}</span>
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
              <span style={{ fontWeight: 'normal', opacity: 0.9 }}>SF-{failure.sf_issue_id}</span>
              {' '}
              {failure.subject}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className={`badge badge-${failure.severity.toLowerCase()}`}>{failure.severity}</span>
              {failure.page_name && (
                <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
                  <strong>Page:</strong> {failure.page_name}
                </p>
              )}
              <p style={{ color: '#ffffff', fontSize: '0.875rem', margin: 0, opacity: 0.9 }}>
                <strong>Criterion:</strong> {failure.wcag_criterion}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <Link to={`/projects/${projectId}?tab=failures`} className="slds-button slds-button_neutral">
              Back to failures
            </Link>
            <Link to={`/projects/${projectId}/failures/${failureId}/edit`} className="slds-button slds-button_brand">
              Edit
            </Link>
            {!confirmDelete ? (
              <button className="slds-button slds-button_destructive" onClick={() => setConfirmDelete(true)}>
                Delete
              </button>
            ) : (
              <>
                <button
                  className="slds-button slds-button_destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  Confirm delete
                </button>
                <button
                  className="slds-button slds-button_neutral"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Details</h3>

        <dl style={{ display: 'grid', gap: 'var(--space-4)' }}>
          {failure.details && (
            <>
              <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>What is the issue?</dt>
              <dd style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{failure.details}</dd>
            </>
          )}

          {failure.steps && (
            <>
              <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>Steps to reproduce</dt>
              <dd style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{failure.steps}</dd>
            </>
          )}

          {failure.impact && (
            <>
              <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>Impact</dt>
              <dd style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{failure.impact}</dd>
            </>
          )}

          {failure.recommendations && (
            <>
              <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>How to fix</dt>
              <dd style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{failure.recommendations}</dd>
            </>
          )}

          {failure.html_code && (
            <>
              <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>HTML Code</dt>
              <dd>
                <pre style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', overflow: 'auto', fontSize: 'var(--text-sm)' }}>
                  {failure.html_code}
                </pre>
              </dd>
            </>
          )}

          {failure.auditor_comments && (
            <>
              <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>Auditor comments</dt>
              <dd style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{failure.auditor_comments}</dd>
            </>
          )}

          <dt style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>Metadata</dt>
          <dd style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Platform:</span>
            <span>{failure.platform_type}{failure.mobile_os && ` (${failure.mobile_os})`}</span>

            {failure.auditor_name && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>Auditor:</span>
                <span>{failure.auditor_name}</span>
              </>
            )}

            {failure.known_work_id && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>Known work ID:</span>
                <span>{failure.known_work_id}</span>
              </>
            )}

            {failure.tag_name && (
              <>
                <span style={{ color: 'var(--color-text-secondary)' }}>Product tag:</span>
                <span>{failure.tag_name} ({failure.tag_id})</span>
              </>
            )}
          </dd>
        </dl>
      </div>
    </div>
  );
}
