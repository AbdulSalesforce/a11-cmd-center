const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

// WCAG 2.2 Level A & AA criteria count (fixed)
const TOTAL_WCAG_AA_CRITERIA = 50;

// GET all scope items with derived status and checklist stats
router.get('/', (req, res) => {
  try {
    const { projectId } = req.params;
    const scopeItems = db.prepare('SELECT * FROM scope_items WHERE project_id = ?').all(projectId);

    const itemsWithStats = scopeItems.map(item => {
      const checklist = db.prepare('SELECT status FROM checklist_items WHERE scope_item_id = ?').all(item.id);
      const reviewed = checklist.filter(c => c.status !== 'unchecked').length;
      const failCount = checklist.filter(c => c.status === 'fail').length;

      // Derive status based on total WCAG criteria, not just items in DB
      let status = 'pending';
      if (reviewed > 0) {
        if (reviewed === TOTAL_WCAG_AA_CRITERIA) {
          status = 'complete';
        } else {
          status = 'in_progress';
        }
      }

      return {
        ...item,
        status,
        checklist_total: TOTAL_WCAG_AA_CRITERIA,
        checklist_reviewed: reviewed,
        checklist_fail: failCount,
      };
    });

    res.json(itemsWithStats);
  } catch (err) {
    console.error('Error fetching scope items:', err);
    return res.status(500).json({ error: 'Failed to fetch scope items' });
  }
});

module.exports = router;
