const express = require('express');
const { execFile } = require('child_process');
const router = express.Router();

// Path to the Salesforce CLI. Overridable via env for non-standard installs.
const SF_BIN = process.env.SF_BIN || 'sf';
const SF_TIMEOUT_MS = 20000;

// Escape a value for safe embedding inside a SOQL string literal so a search
// term containing quotes/backslashes can't break out of the WHERE clause.
function escapeSoql(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Run a SOQL query against the authenticated `gus` org via the sf CLI.
// Resolves with the parsed `result` object, rejects with a readable message.
function runSoql(query) {
  return new Promise((resolve, reject) => {
    execFile(
      SF_BIN,
      ['data', 'query', '--target-org', 'gus', '--query', query, '--json'],
      { timeout: SF_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout, stderr) => {
        // sf exits non-zero on query errors but still prints JSON on stdout,
        // so try to parse regardless of the exit code.
        let parsed = null;
        try { parsed = JSON.parse(stdout); } catch { /* not JSON */ }

        if (parsed && parsed.status === 0) return resolve(parsed.result || {});

        const message =
          (parsed && parsed.message) ||
          (stderr && stderr.trim()) ||
          (err && err.message) ||
          'sf query failed';
        reject(new Error(message));
      }
    );
  });
}

// GET /api/gus/themes?q=<search>
// Live-search active audit themes (ADM_Theme__c) in GUS by name.
router.get('/themes', async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  // Require a couple of characters so we don't pull the whole theme table.
  if (q.length < 2) {
    return res.json({ themes: [] });
  }

  const term = escapeSoql(q.slice(0, 80));
  const query =
    'SELECT Id, Name, Active__c, Scrum_Team__r.Name ' +
    'FROM ADM_Theme__c ' +
    `WHERE Name LIKE '%${term}%' AND Active__c = true ` +
    'ORDER BY LastModifiedDate DESC LIMIT 25';

  try {
    const result = await runSoql(query);
    const themes = (result.records || []).map(r => ({
      id: r.Id,
      name: r.Name,
      team: r.Scrum_Team__r ? r.Scrum_Team__r.Name : null,
    }));
    res.json({ themes });
  } catch (err) {
    console.error('GUS theme lookup failed:', err.message);
    res.status(502).json({
      error: 'Unable to reach GUS. Ensure the sf CLI is authenticated to the "gus" org.',
    });
  }
});

// GET /api/gus/product-tags?q=<search>
// Live-search product tags (ADM_Product_Tag__c) in GUS by name.
router.get('/product-tags', async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  if (q.length < 2) {
    return res.json({ tags: [] });
  }

  const term = escapeSoql(q.slice(0, 80));
  const query =
    'SELECT Id, Name FROM ADM_Product_Tag__c ' +
    `WHERE Name LIKE '%${term}%' ` +
    'ORDER BY Name LIMIT 25';

  try {
    const result = await runSoql(query);
    const tags = (result.records || []).map(r => ({ id: r.Id, name: r.Name }));
    res.json({ tags });
  } catch (err) {
    console.error('GUS product tag lookup failed:', err.message);
    res.status(502).json({
      error: 'Unable to reach GUS. Ensure the sf CLI is authenticated to the "gus" org.',
    });
  }
});

// GET /api/gus/builds?q=<search>
// Live-search builds (ADM_Build__c) in GUS by name.
router.get('/builds', async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  if (q.length < 2) {
    return res.json({ builds: [] });
  }

  const term = escapeSoql(q.slice(0, 80));
  const query =
    'SELECT Id, Name FROM ADM_Build__c ' +
    `WHERE Name LIKE '%${term}%' ` +
    'ORDER BY Name DESC LIMIT 25';

  try {
    const result = await runSoql(query);
    const builds = (result.records || []).map(r => ({ id: r.Id, name: r.Name }));
    res.json({ builds });
  } catch (err) {
    console.error('GUS build lookup failed:', err.message);
    res.status(502).json({
      error: 'Unable to reach GUS. Ensure the sf CLI is authenticated to the "gus" org.',
    });
  }
});

// GET /api/gus/employees?q=<search>
// Live-search active Salesforce users (employees) by name or email in GUS.
router.get('/employees', async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  if (q.length < 2) {
    return res.json({ employees: [] });
  }

  const term = escapeSoql(q.slice(0, 80));
  const query =
    'SELECT Id, Name, Email FROM User ' +
    `WHERE (Name LIKE '%${term}%' OR Email LIKE '%${term}%') AND IsActive = true ` +
    'ORDER BY Name LIMIT 25';

  try {
    const result = await runSoql(query);
    const employees = (result.records || []).map(r => ({
      id: r.Id,
      name: r.Name,
      email: r.Email || '',
    }));
    res.json({ employees });
  } catch (err) {
    console.error('GUS employee lookup failed:', err.message);
    res.status(502).json({
      error: 'Unable to reach GUS. Ensure the sf CLI is authenticated to the "gus" org.',
    });
  }
});

module.exports = router;
