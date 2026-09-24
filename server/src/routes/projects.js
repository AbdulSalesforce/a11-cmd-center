const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');

const router = express.Router();

const TOTAL_WCAG_AA_CRITERIA = 50;

// audit_theme_ids / audit_theme_names are stored as JSON arrays in TEXT columns.
// Parse them back into arrays for the client, tolerating null/legacy values.
function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Coerce an incoming theme-list field (array from the client, or legacy string)
// into a JSON string for storage. Returns null when empty so the column stays tidy.
function themeListToJson(value) {
  const arr = Array.isArray(value) ? value.map(v => String(v).trim()).filter(Boolean) : [];
  return arr.length ? JSON.stringify(arr) : null;
}

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

    res.json({
      ...project,
      audit_theme_ids: parseJsonArray(project.audit_theme_ids),
      audit_theme_names: parseJsonArray(project.audit_theme_names),
      auditors,
      product_tags,
      scope_items,
    });
  } catch (err) {
    console.error('Error fetching project:', err);
    return res.status(500).json({ error: 'Failed to fetch project' });
  }
});

router.post('/', async (req, res) => {
  const {
    product_name, auditor_name, pm_name, pm_email, login_path, slack_channel,
    release_build_name, release_build_id, audit_theme_id, audit_theme_ids, audit_theme_names, epic_id,
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

  try {
    await db.transaction(async (txDb) => {
      const insertProject = txDb.prepare(`
        INSERT INTO projects (id, product_name, auditor_name, pm_name, pm_email, login_path, slack_channel,
          release_build_name, release_build_id, audit_theme_id, audit_theme_ids, audit_theme_names, epic_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAuditor = txDb.prepare(
        'INSERT INTO auditors (id, project_id, name, email) VALUES (?, ?, ?, ?)'
      );
      const insertTag = txDb.prepare(
        'INSERT INTO product_tags (id, project_id, tag_name, tag_id) VALUES (?, ?, ?, ?)'
      );
      const insertScope = txDb.prepare(
        'INSERT INTO scope_items (id, project_id, page_name, url) VALUES (?, ?, ?, ?)'
      );

      await insertProject.run(id, product_name, auditor_name || null, pm_name || null, pm_email || null, login_path || null, slack_channel || null,
        release_build_name || null, release_build_id || null, audit_theme_id || null,
        themeListToJson(audit_theme_ids), themeListToJson(audit_theme_names), epic_id || null);

      for (const a of auditors) {
        if (!a.name || typeof a.name !== 'string' || a.name.length > 200) {
          throw new Error('Invalid auditor name');
        }
        await insertAuditor.run(randomUUID(), id, a.name, a.email || null);
      }

      for (const t of product_tags) {
        if (!t.tag_name || typeof t.tag_name !== 'string' || t.tag_name.length > 200) {
          throw new Error('Invalid product tag name');
        }
        await insertTag.run(randomUUID(), id, t.tag_name, t.tag_id || null);
      }

      for (const s of scope_items) {
        if (!s.page_name || typeof s.page_name !== 'string' || s.page_name.length > 200) {
          throw new Error('Invalid scope item page name');
        }
        await insertScope.run(randomUUID(), id, s.page_name, s.url || null);
      }
    })();

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    product_name, auditor_name, pm_name, pm_email, login_path, slack_channel,
    release_build_name, release_build_id, audit_theme_id, audit_theme_ids, audit_theme_names, epic_id,
    auditors = [], product_tags = [], scope_items = []
  } = req.body;

  const existing = await db.prepare('SELECT id FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Project not found' });

  // Same validation surface as POST.
  if (!product_name) return res.status(400).json({ error: 'product_name is required' });
  if (typeof product_name !== 'string' || product_name.length > 200) {
    return res.status(400).json({ error: 'product_name must be a string (max 200 characters)' });
  }
  if (pm_name && (typeof pm_name !== 'string' || pm_name.length > 200)) {
    return res.status(400).json({ error: 'pm_name must be a string (max 200 characters)' });
  }
  if (pm_email && (typeof pm_email !== 'string' || pm_email.length > 200)) {
    return res.status(400).json({ error: 'pm_email must be a string (max 200 characters)' });
  }
  if (!Array.isArray(auditors)) return res.status(400).json({ error: 'auditors must be an array' });
  if (!Array.isArray(product_tags)) return res.status(400).json({ error: 'product_tags must be an array' });
  if (!Array.isArray(scope_items)) return res.status(400).json({ error: 'scope_items must be an array' });
  if (auditors.length > 50 || product_tags.length > 50 || scope_items.length > 100) {
    return res.status(400).json({ error: 'Array sizes exceed limits' });
  }

  // Read current child-row ids up front so we can reconcile by id inside the
  // transaction — updating rows that survive and only deleting ones the user
  // removed. This preserves referential integrity: scope items keep their
  // checklist progress, and auditors / product tags keep the ids that logged
  // failures reference (deleting a referenced row would violate a foreign key).
  const [currentScope, currentAuditors, currentTags] = await Promise.all([
    db.prepare('SELECT id FROM scope_items WHERE project_id = ?').all(id),
    db.prepare('SELECT id FROM auditors WHERE project_id = ?').all(id),
    db.prepare('SELECT id FROM product_tags WHERE project_id = ?').all(id),
  ]);
  const currentScopeIds = new Set(currentScope.map(s => s.id));
  const keptScopeIds = new Set(scope_items.filter(s => s.id && currentScopeIds.has(s.id)).map(s => s.id));
  const currentAuditorIds = new Set(currentAuditors.map(a => a.id));
  const keptAuditorIds = new Set(auditors.filter(a => a.id && currentAuditorIds.has(a.id)).map(a => a.id));
  const currentTagIds = new Set(currentTags.map(t => t.id));
  const keptTagIds = new Set(product_tags.filter(t => t.id && currentTagIds.has(t.id)).map(t => t.id));

  try {
    await db.transaction(async (txDb) => {
      const updateProject = txDb.prepare(`
        UPDATE projects SET
          product_name = ?, auditor_name = ?, pm_name = ?, pm_email = ?, login_path = ?, slack_channel = ?,
          release_build_name = ?, release_build_id = ?, audit_theme_id = ?,
          audit_theme_ids = ?, audit_theme_names = ?, epic_id = ?
        WHERE id = ?
      `);
      await updateProject.run(product_name, auditor_name || null, pm_name || null, pm_email || null,
        login_path || null, slack_channel || null, release_build_name || null, release_build_id || null,
        audit_theme_id || null, themeListToJson(audit_theme_ids), themeListToJson(audit_theme_names),
        epic_id || null, id);

      // Auditors: delete removed, update kept, insert new.
      const insertAuditor = txDb.prepare('INSERT INTO auditors (id, project_id, name, email) VALUES (?, ?, ?, ?)');
      const updateAuditor = txDb.prepare('UPDATE auditors SET name = ?, email = ? WHERE id = ? AND project_id = ?');
      const deleteAuditor = txDb.prepare('DELETE FROM auditors WHERE id = ? AND project_id = ?');
      for (const oldId of currentAuditorIds) {
        if (!keptAuditorIds.has(oldId)) await deleteAuditor.run(oldId, id);
      }
      for (const a of auditors) {
        if (!a.name || typeof a.name !== 'string' || a.name.length > 200) throw new Error('Invalid auditor name');
        if (a.id && keptAuditorIds.has(a.id)) await updateAuditor.run(a.name, a.email || null, a.id, id);
        else await insertAuditor.run(randomUUID(), id, a.name, a.email || null);
      }

      // Product tags: delete removed, update kept, insert new.
      const insertTag = txDb.prepare('INSERT INTO product_tags (id, project_id, tag_name, tag_id) VALUES (?, ?, ?, ?)');
      const updateTag = txDb.prepare('UPDATE product_tags SET tag_name = ?, tag_id = ? WHERE id = ? AND project_id = ?');
      const deleteTag = txDb.prepare('DELETE FROM product_tags WHERE id = ? AND project_id = ?');
      for (const oldId of currentTagIds) {
        if (!keptTagIds.has(oldId)) await deleteTag.run(oldId, id);
      }
      for (const t of product_tags) {
        if (!t.tag_name || typeof t.tag_name !== 'string' || t.tag_name.length > 200) throw new Error('Invalid product tag name');
        if (t.id && keptTagIds.has(t.id)) await updateTag.run(t.tag_name, t.tag_id || null, t.id, id);
        else await insertTag.run(randomUUID(), id, t.tag_name, t.tag_id || null);
      }

      // Scope items: delete removed, update kept, insert new — preserving checklists.
      const insertScope = txDb.prepare('INSERT INTO scope_items (id, project_id, page_name, url) VALUES (?, ?, ?, ?)');
      const updateScope = txDb.prepare('UPDATE scope_items SET page_name = ?, url = ? WHERE id = ? AND project_id = ?');
      const deleteScope = txDb.prepare('DELETE FROM scope_items WHERE id = ? AND project_id = ?');

      for (const oldId of currentScopeIds) {
        if (!keptScopeIds.has(oldId)) await deleteScope.run(oldId, id);
      }
      for (const s of scope_items) {
        if (!s.page_name || typeof s.page_name !== 'string' || s.page_name.length > 200) {
          throw new Error('Invalid scope item page name');
        }
        if (s.id && keptScopeIds.has(s.id)) {
          await updateScope.run(s.page_name, s.url || null, s.id, id);
        } else {
          await insertScope.run(randomUUID(), id, s.page_name, s.url || null);
        }
      }
    })();

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

router.patch('/:id/archive', async (req, res) => {
  try {
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { archived } = req.body;
    if (typeof archived !== 'boolean') {
      return res.status(400).json({ error: 'archived must be a boolean' });
    }

    await db.prepare('UPDATE projects SET archived = ? WHERE id = ?').run(archived ? 1 : 0, req.params.id);

    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Error updating project archive status:', err);
    return res.status(500).json({ error: 'Failed to update project' });
  }
});

// Update just the project's audit themes, without touching auditors, product
// tags, or scope items (unlike the full PUT). Used by the Log/Edit-failure
// panel so themes can be managed inline. audit_theme_id keeps the first id for
// legacy single-theme consumers.
router.patch('/:id/themes', async (req, res) => {
  try {
    const project = await db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { audit_theme_ids, audit_theme_names } = req.body;
    if (!Array.isArray(audit_theme_ids) || !Array.isArray(audit_theme_names)) {
      return res.status(400).json({ error: 'audit_theme_ids and audit_theme_names must be arrays' });
    }
    if (audit_theme_ids.length > 50) {
      return res.status(400).json({ error: 'Too many audit themes (max 50)' });
    }

    const firstId = audit_theme_ids.map(v => String(v).trim()).filter(Boolean)[0] || null;

    await db.prepare(
      'UPDATE projects SET audit_theme_id = ?, audit_theme_ids = ?, audit_theme_names = ? WHERE id = ?'
    ).run(firstId, themeListToJson(audit_theme_ids), themeListToJson(audit_theme_names), req.params.id);

    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
    res.json({
      ...updated,
      audit_theme_ids: parseJsonArray(updated.audit_theme_ids),
      audit_theme_names: parseJsonArray(updated.audit_theme_names),
    });
  } catch (err) {
    console.error('Error updating project themes:', err);
    return res.status(500).json({ error: 'Failed to update project themes' });
  }
});

router.delete('/:id', async (req, res) => {
  const project = await db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  await db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
