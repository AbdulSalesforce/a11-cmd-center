const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');

const router = express.Router();

const TOTAL_WCAG_AA_CRITERIA = 50;

router.get('/', async (req, res) => {
  try {
    const projects = await db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM failures WHERE project_id = p.id) AS failure_count,
        (SELECT COUNT(*) FROM scope_items WHERE project_id = p.id) AS scope_total
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();

    // Compute scope_complete by deriving status from checklists
    const enriched = await Promise.all(projects.map(async proj => {
      const scopeItems = await db.prepare('SELECT id FROM scope_items WHERE project_id = ?').all(proj.id);
      let completeCount = 0;

      for (const item of scopeItems) {
        const checklist = await db.prepare('SELECT status FROM checklist_items WHERE scope_item_id = ?').all(item.id);
        const reviewed = checklist.filter(c => c.status !== 'unchecked').length;
        if (reviewed === TOTAL_WCAG_AA_CRITERIA) {
          completeCount++;
        }
      }

      return { ...proj, scope_complete: completeCount };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching projects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const auditors = await db.prepare('SELECT * FROM auditors WHERE project_id = ?').all(req.params.id);
    const product_tags = await db.prepare('SELECT * FROM product_tags WHERE project_id = ?').all(req.params.id);
    const scopeItems = await db.prepare('SELECT * FROM scope_items WHERE project_id = ?').all(req.params.id);

    // Derive status and checklist stats for each scope item
    const scope_items = await Promise.all(scopeItems.map(async item => {
      const checklist = await db.prepare('SELECT status FROM checklist_items WHERE scope_item_id = ?').all(item.id);
      const reviewed = checklist.filter(c => c.status !== 'unchecked').length;
      const failCount = checklist.filter(c => c.status === 'fail').length;

      let status = 'pending';
      if (reviewed > 0) {
        if (reviewed === TOTAL_WCAG_AA_CRITERIA) status = 'complete';
        else status = 'in_progress';
      }

      return {
        ...item,
        status,
        checklist_total: TOTAL_WCAG_AA_CRITERIA,
        checklist_reviewed: reviewed,
        checklist_fail: failCount,
      };
    }));

    res.json({ ...project, auditors, product_tags, scope_items });
  } catch (err) {
    console.error('Error fetching project:', err);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', async (req, res) => {
  const {
    product_name, auditor_name, pm_name, pm_email, login_path, slack_channel,
    release_build_name, release_build_id, audit_theme_id, epic_id,
    auditors = [], product_tags = [], scope_items = []
  } = req.body;

  // Required field validation
  if (!product_name) return res.status(400).json({ error: 'product_name is required' });

  // Input validation
  if (typeof product_name !== 'string' || product_name.length > 200) {
    return res.status(400).json({ error: 'product_name must be a string (max 200 characters)' });
  }
  if (pm_name && (typeof pm_name !== 'string' || pm_name.length > 200)) {
    return res.status(400).json({ error: 'pm_name must be a string (max 200 characters)' });
  }
  if (pm_email && (typeof pm_email !== 'string' || pm_email.length > 200)) {
    return res.status(400).json({ error: 'pm_email must be a string (max 200 characters)' });
  }
  if (!Array.isArray(auditors)) {
    return res.status(400).json({ error: 'auditors must be an array' });
  }
  if (!Array.isArray(product_tags)) {
    return res.status(400).json({ error: 'product_tags must be an array' });
  }
  if (!Array.isArray(scope_items)) {
    return res.status(400).json({ error: 'scope_items must be an array' });
  }
  if (auditors.length > 50 || product_tags.length > 50 || scope_items.length > 100) {
    return res.status(400).json({ error: 'Array sizes exceed limits' });
  }

  const id = randomUUID();

  const insertProject = db.prepare(`
    INSERT INTO projects (id, product_name, auditor_name, pm_name, pm_email, login_path, slack_channel,
      release_build_name, release_build_id, audit_theme_id, epic_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAuditor = db.prepare(
    'INSERT INTO auditors (id, project_id, name, email) VALUES (?, ?, ?, ?)'
  );
  const insertTag = db.prepare(
    'INSERT INTO product_tags (id, project_id, tag_name, tag_id) VALUES (?, ?, ?, ?)'
  );
  const insertScope = db.prepare(
    'INSERT INTO scope_items (id, project_id, page_name, url) VALUES (?, ?, ?, ?)'
  );

  try {
    await db.transaction(() => {
      insertProject.run(id, product_name, auditor_name || null, pm_name || null, pm_email || null, login_path || null, slack_channel || null,
        release_build_name || null, release_build_id || null, audit_theme_id || null, epic_id || null);

      auditors.forEach(a => {
        if (!a.name || typeof a.name !== 'string' || a.name.length > 200) {
          throw new Error('Invalid auditor name');
        }
        insertAuditor.run(randomUUID(), id, a.name, a.email || null);
      });

      product_tags.forEach(t => {
        if (!t.tag_name || typeof t.tag_name !== 'string' || t.tag_name.length > 200) {
          throw new Error('Invalid product tag name');
        }
        insertTag.run(randomUUID(), id, t.tag_name, t.tag_id || null);
      });

      scope_items.forEach(s => {
        if (!s.page_name || typeof s.page_name !== 'string' || s.page_name.length > 200) {
          throw new Error('Invalid scope item page name');
        }
        insertScope.run(randomUUID(), id, s.page_name, s.url || null);
      });
    })();

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

router.delete('/:id', async (req, res) => {
  const project = await db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  await db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
