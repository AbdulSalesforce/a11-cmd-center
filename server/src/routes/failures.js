const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db/schema');

const router = express.Router({ mergeParams: true });

router.get('/', (req, res) => {
  try {
    const failures = db.prepare(`
      SELECT f.*, a.name AS auditor_name, pt.tag_name, pt.tag_id
      FROM failures f
      LEFT JOIN auditors a ON f.auditor_id = a.id
      LEFT JOIN product_tags pt ON f.product_tag_id = pt.id
      WHERE f.project_id = ?
      ORDER BY f.sf_issue_id ASC
    `).all(req.params.projectId);

    const withScreenshots = failures.map(f => ({
      ...f,
      screenshots: db.prepare('SELECT * FROM screenshots WHERE failure_id = ?').all(f.id)
    }));

    res.json(withScreenshots);
  } catch (err) {
    console.error('Error fetching failures:', err);
    return res.status(500).json({ error: 'Failed to fetch failures' });
  }
});

router.post('/', (req, res) => {
  const { projectId } = req.params;

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const {
    auditor_id, agency_ref_id, subject, details, steps, impact,
    recommendations, html_code, auditor_comments, page_name, sub_page_name,
    wcag_criterion, platform_type, mobile_os, severity, known_work_id,
    product_tag_id, screenshots = [], additional_pages = []
  } = req.body;

  // Required field validation
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  if (!wcag_criterion) return res.status(400).json({ error: 'wcag_criterion is required' });
  if (!platform_type) return res.status(400).json({ error: 'platform_type is required' });
  if (!severity) return res.status(400).json({ error: 'severity is required' });

  // Input validation
  if (typeof subject !== 'string' || subject.length > 500) {
    return res.status(400).json({ error: 'subject must be a string (max 500 characters)' });
  }
  if (typeof wcag_criterion !== 'string' || wcag_criterion.length > 50) {
    return res.status(400).json({ error: 'wcag_criterion must be a string (max 50 characters)' });
  }
  if (typeof platform_type !== 'string' || platform_type.trim().length === 0) {
    return res.status(400).json({ error: 'platform_type must be a non-empty string' });
  }
  if (!['P1', 'P2', 'P3'].includes(severity)) {
    return res.status(400).json({ error: 'severity must be P1, P2, or P3' });
  }

  // Optional text field length limits
  if (details && (typeof details !== 'string' || details.length > 10000)) {
    return res.status(400).json({ error: 'details must be a string (max 10000 characters)' });
  }
  if (steps && (typeof steps !== 'string' || steps.length > 10000)) {
    return res.status(400).json({ error: 'steps must be a string (max 10000 characters)' });
  }
  if (impact && (typeof impact !== 'string' || impact.length > 10000)) {
    return res.status(400).json({ error: 'impact must be a string (max 10000 characters)' });
  }
  if (recommendations && (typeof recommendations !== 'string' || recommendations.length > 10000)) {
    return res.status(400).json({ error: 'recommendations must be a string (max 10000 characters)' });
  }
  if (html_code && (typeof html_code !== 'string' || html_code.length > 50000)) {
    return res.status(400).json({ error: 'html_code must be a string (max 50000 characters)' });
  }
  if (auditor_comments && (typeof auditor_comments !== 'string' || auditor_comments.length > 10000)) {
    return res.status(400).json({ error: 'auditor_comments must be a string (max 10000 characters)' });
  }

  // Array validation
  if (!Array.isArray(screenshots)) {
    return res.status(400).json({ error: 'screenshots must be an array' });
  }
  if (screenshots.length > 20) {
    return res.status(400).json({ error: 'screenshots array cannot exceed 20 items' });
  }
  if (!Array.isArray(additional_pages)) {
    return res.status(400).json({ error: 'additional_pages must be an array' });
  }
  if (additional_pages.length > 50) {
    return res.status(400).json({ error: 'additional_pages array cannot exceed 50 items' });
  }

  try {
    const next = db.prepare(
      'SELECT COALESCE(MAX(sf_issue_id), 0) + 1 AS next_id FROM failures WHERE project_id = ?'
    ).get(projectId);
    const sf_issue_id = next.next_id;

    const id = randomUUID();

    db.prepare(`
      INSERT INTO failures (
        id, project_id, auditor_id, sf_issue_id, agency_ref_id, subject,
        details, steps, impact, recommendations, html_code, auditor_comments,
        page_name, sub_page_name, wcag_criterion, platform_type, mobile_os,
        severity, known_work_id, product_tag_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, projectId, auditor_id || null, sf_issue_id, agency_ref_id || null,
      subject, details || null, steps || null, impact || null,
      recommendations || null, html_code || null, auditor_comments || null,
      page_name || null, sub_page_name || null, wcag_criterion, platform_type,
      mobile_os || null, severity, known_work_id || null, product_tag_id || null
    );

    // Validate and insert screenshots
    screenshots.forEach(s => {
      if (!s.drive_url || typeof s.drive_url !== 'string' || s.drive_url.length > 500) {
        throw new Error('Invalid screenshot drive_url');
      }
      if (!s.filename || typeof s.filename !== 'string' || s.filename.length > 255) {
        throw new Error('Invalid screenshot filename');
      }
      // Prevent path traversal in filename
      if (s.filename.includes('/') || s.filename.includes('\\') || s.filename.includes('\0')) {
        throw new Error('Invalid characters in screenshot filename');
      }
      db.prepare('INSERT INTO screenshots (id, failure_id, drive_url, filename) VALUES (?, ?, ?, ?)')
        .run(randomUUID(), id, s.drive_url, s.filename);
    });

    // Auto-mark the corresponding SC as "fail" in the checklist for matching scope items
    if (wcag_criterion) {
      const allPages = [page_name, ...additional_pages].filter(Boolean);

      allPages.forEach(pageName => {
        if (typeof pageName !== 'string' || pageName.length > 200) {
          throw new Error('Invalid page name');
        }
        const scopeItems = db.prepare('SELECT id FROM scope_items WHERE project_id = ? AND page_name = ?')
          .all(projectId, pageName);

        scopeItems.forEach(item => {
          db.prepare(`
            INSERT INTO checklist_items (id, scope_item_id, sc_id, status, updated_at)
            VALUES (?, ?, ?, 'fail', datetime('now'))
            ON CONFLICT(scope_item_id, sc_id) DO UPDATE SET
              status = CASE WHEN status = 'unchecked' THEN 'fail' ELSE status END,
              updated_at = datetime('now')
          `).run(randomUUID(), item.id, wcag_criterion);
        });
      });
    }

    const failure = db.prepare('SELECT * FROM failures WHERE id = ?').get(id);
    res.status(201).json(failure);
  } catch (err) {
    console.error('Error creating failure:', err);
    return res.status(500).json({ error: 'Failed to create failure' });
  }
});

router.get('/:failureId', (req, res) => {
  try {
    const failure = db.prepare(`
      SELECT f.*, a.name AS auditor_name, pt.tag_name, pt.tag_id
      FROM failures f
      LEFT JOIN auditors a ON f.auditor_id = a.id
      LEFT JOIN product_tags pt ON f.product_tag_id = pt.id
      WHERE f.id = ? AND f.project_id = ?
    `).get(req.params.failureId, req.params.projectId);

    if (!failure) return res.status(404).json({ error: 'Failure not found' });

    const screenshots = db.prepare('SELECT * FROM screenshots WHERE failure_id = ?').all(failure.id);
    res.json({ ...failure, screenshots });
  } catch (err) {
    console.error('Error fetching failure:', err);
    return res.status(500).json({ error: 'Failed to fetch failure' });
  }
});

router.put('/:failureId', (req, res) => {
  const { projectId, failureId } = req.params;

  const failure = db.prepare('SELECT id FROM failures WHERE id = ? AND project_id = ?')
    .get(failureId, projectId);

  if (!failure) return res.status(404).json({ error: 'Failure not found' });

  const {
    auditor_id, agency_ref_id, subject, details, steps, impact,
    recommendations, html_code, auditor_comments, page_name, sub_page_name,
    wcag_criterion, platform_type, mobile_os, severity, known_work_id,
    product_tag_id
  } = req.body;

  // Required field validation
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  if (!wcag_criterion) return res.status(400).json({ error: 'wcag_criterion is required' });
  if (!platform_type) return res.status(400).json({ error: 'platform_type is required' });
  if (!severity) return res.status(400).json({ error: 'severity is required' });

  // Input validation
  if (typeof subject !== 'string' || subject.length > 500) {
    return res.status(400).json({ error: 'subject must be a string (max 500 characters)' });
  }
  if (typeof wcag_criterion !== 'string' || wcag_criterion.length > 50) {
    return res.status(400).json({ error: 'wcag_criterion must be a string (max 50 characters)' });
  }
  if (typeof platform_type !== 'string' || platform_type.trim().length === 0) {
    return res.status(400).json({ error: 'platform_type must be a non-empty string' });
  }
  if (!['P1', 'P2', 'P3'].includes(severity)) {
    return res.status(400).json({ error: 'severity must be P1, P2, or P3' });
  }

  // Optional text field length limits
  if (details && (typeof details !== 'string' || details.length > 10000)) {
    return res.status(400).json({ error: 'details must be a string (max 10000 characters)' });
  }
  if (steps && (typeof steps !== 'string' || steps.length > 10000)) {
    return res.status(400).json({ error: 'steps must be a string (max 10000 characters)' });
  }
  if (impact && (typeof impact !== 'string' || impact.length > 10000)) {
    return res.status(400).json({ error: 'impact must be a string (max 10000 characters)' });
  }
  if (recommendations && (typeof recommendations !== 'string' || recommendations.length > 10000)) {
    return res.status(400).json({ error: 'recommendations must be a string (max 10000 characters)' });
  }
  if (html_code && (typeof html_code !== 'string' || html_code.length > 50000)) {
    return res.status(400).json({ error: 'html_code must be a string (max 50000 characters)' });
  }
  if (auditor_comments && (typeof auditor_comments !== 'string' || auditor_comments.length > 10000)) {
    return res.status(400).json({ error: 'auditor_comments must be a string (max 10000 characters)' });
  }

  try {
    db.prepare(`
      UPDATE failures SET
        auditor_id = ?,
        agency_ref_id = ?,
        subject = ?,
        details = ?,
        steps = ?,
        impact = ?,
        recommendations = ?,
        html_code = ?,
        auditor_comments = ?,
        page_name = ?,
        sub_page_name = ?,
        wcag_criterion = ?,
        platform_type = ?,
        mobile_os = ?,
        severity = ?,
        known_work_id = ?,
        product_tag_id = ?
      WHERE id = ? AND project_id = ?
    `).run(
      auditor_id || null, agency_ref_id || null, subject, details || null,
      steps || null, impact || null, recommendations || null, html_code || null,
      auditor_comments || null, page_name || null, sub_page_name || null,
      wcag_criterion, platform_type, mobile_os || null, severity,
      known_work_id || null, product_tag_id || null, failureId, projectId
    );

    const updated = db.prepare('SELECT * FROM failures WHERE id = ?').get(failureId);
    res.json(updated);
  } catch (err) {
    console.error('Error updating failure:', err);
    return res.status(500).json({ error: 'Failed to update failure' });
  }
});

router.delete('/:failureId', (req, res) => {
  try {
    const failure = db.prepare('SELECT id FROM failures WHERE id = ? AND project_id = ?')
      .get(req.params.failureId, req.params.projectId);

    if (!failure) return res.status(404).json({ error: 'Failure not found' });

    db.prepare('DELETE FROM failures WHERE id = ?').run(req.params.failureId);
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting failure:', err);
    return res.status(500).json({ error: 'Failed to delete failure' });
  }
});

module.exports = router;
