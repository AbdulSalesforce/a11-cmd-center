const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { randomUUID } = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

const SCRIPT_PATH = path.join(__dirname, '..', '..', 'scripts', 'generate_acr.py');

router.get('/acr', async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Sanitize product_name for security (max 100 chars, alphanumeric + spaces/hyphens only)
    const sanitizedProductName = project.product_name
      .slice(0, 100)
      .replace(/[^a-zA-Z0-9\s\-]/g, '')
      .trim() || 'Unnamed_Project';

  // Only allow export when all scope items are complete (derived from checklist)
  const scopeItems = await db.prepare('SELECT id FROM scope_items WHERE project_id = ?').all(projectId);
  if (scopeItems.length === 0) {
    return res.status(400).json({ error: 'No scope items defined for this project.' });
  }

  // Check if all scope items have complete checklists (all 50 WCAG A/AA criteria reviewed)
  const TOTAL_WCAG_AA_CRITERIA = 50;
  let allComplete = true;
  for (const item of scopeItems) {
    const checklist = await db.prepare('SELECT status FROM checklist_items WHERE scope_item_id = ?').all(item.id);
    const reviewed = checklist.filter(c => c.status !== 'unchecked').length;
    if (reviewed !== TOTAL_WCAG_AA_CRITERIA) {
      allComplete = false;
      break;
    }
  }

  if (!allComplete) {
    return res.status(400).json({ error: 'All scope items must be marked complete before generating the ACR.' });
  }

  // Build findings list for the Python script: {page, wcag, description}
  const failures = await db.prepare(`
    SELECT page_name, wcag_criterion, subject, details
    FROM failures
    WHERE project_id = ?
    ORDER BY sf_issue_id ASC
  `).all(projectId);

  const findings = failures.map(f => ({
    page: f.page_name || 'General',
    wcag: f.wcag_criterion,
    description: [f.subject, f.details].filter(Boolean).join('. '),
  }));

  // Write findings to a temp file the Python script will read
  const tmpDir      = os.tmpdir();
  const tmpId       = randomUUID();
  const findingsPath = path.join(tmpDir, `acr-findings-${tmpId}.json`);
  const outputPath   = path.join(tmpDir, `ACR-${sanitizedProductName.replace(/\s+/g, '_')}-${tmpId}.docx`);

  fs.writeFileSync(findingsPath, JSON.stringify(findings), 'utf8');

  const proc = spawn('python', [SCRIPT_PATH, findingsPath, outputPath, sanitizedProductName], {
    timeout: 60000,
  });

  let stderr = '';
  proc.stderr.on('data', d => { stderr += d.toString(); });

  proc.on('close', code => {
    // Clean up findings temp file regardless of outcome
    try { fs.unlinkSync(findingsPath); } catch (_) {}

    if (code !== 0) {
      console.error('ACR generation failed:\n', stderr);
      try { fs.unlinkSync(outputPath); } catch (_) {}
      return res.status(500).json({ error: 'ACR generation failed. Check server logs.' });
    }

    // Use sanitized name for Content-Disposition to prevent header injection
    const filename = `ACR - ${sanitizedProductName}.docx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    stream.on('close', () => {
      try { fs.unlinkSync(outputPath); } catch (_) {}
    });
  });

  proc.on('error', err => {
    console.error('Failed to spawn Python process:', err);
    try { fs.unlinkSync(findingsPath); } catch (_) {}
    try { fs.unlinkSync(outputPath); } catch (_) {}
    res.status(500).json({ error: 'Could not start ACR generator. Is Python installed?' });
  });
  } catch (err) {
    console.error('Error in ACR generation:', err);
    return res.status(500).json({ error: 'Failed to generate ACR' });
  }
});

module.exports = router;
