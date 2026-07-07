const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { scopeItemId } = req.params;

    const scopeItem = await db.prepare('SELECT * FROM scope_items WHERE id = ?').get(scopeItemId);
    if (!scopeItem) return res.status(404).json({ error: 'Scope item not found' });

    const items = await db.prepare(
      'SELECT * FROM checklist_items WHERE scope_item_id = ?'
    ).all(scopeItemId);
    res.json(items);
  } catch (err) {
    console.error('Error fetching checklist:', err);
    return res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

router.put('/:scId', async (req, res) => {
  try {
    const { scopeItemId, scId } = req.params;
    const { status, na_note } = req.body;

    // Input validation
    const valid = ['unchecked', 'pass', 'fail', 'na'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    if (typeof scId !== 'string' || scId.length > 50) {
      return res.status(400).json({ error: 'Invalid scId' });
    }

    if (na_note && (typeof na_note !== 'string' || na_note.length > 1000)) {
      return res.status(400).json({ error: 'na_note must be a string (max 1000 characters)' });
    }

    const scopeItem = await db.prepare('SELECT id FROM scope_items WHERE id = ?').get(scopeItemId);
    if (!scopeItem) return res.status(404).json({ error: 'Scope item not found' });

    await db.prepare(`
      INSERT INTO checklist_items (id, scope_item_id, sc_id, status, na_note, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(scope_item_id, sc_id) DO UPDATE SET
        status = excluded.status,
        na_note = excluded.na_note,
        updated_at = excluded.updated_at
    `).run(randomUUID(), scopeItemId, scId, status, na_note || null);

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating checklist item:', err);
    return res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

module.exports = router;
