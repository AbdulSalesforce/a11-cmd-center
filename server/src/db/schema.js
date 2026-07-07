const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const DATA_DIR = path.join(os.homedir(), '.a11y-audit');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'audit.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migrate checklist_items from project-level to scope-item-level
const checklistCols = db.pragma('table_info(checklist_items)').map(c => c.name);
if (checklistCols.includes('project_id') && !checklistCols.includes('scope_item_id')) {
  // Old schema: project-level checklist. Drop and recreate.
  db.exec('DROP TABLE IF EXISTS checklist_items');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    auditor_name TEXT,
    pm_name TEXT,
    pm_email TEXT,
    login_path TEXT,
    slack_channel TEXT,
    release_build_name TEXT,
    release_build_id TEXT,
    audit_theme_id TEXT,
    epic_id TEXT,
    spreadsheet_id TEXT,
    drive_folder_id TEXT,
    evidence_folder_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS auditors (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT
  );

  CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    tag_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scope_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    page_name TEXT NOT NULL,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'complete'))
  );

  CREATE TABLE IF NOT EXISTS failures (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    auditor_id TEXT REFERENCES auditors(id),
    sf_issue_id INTEGER NOT NULL,
    agency_ref_id TEXT,
    subject TEXT NOT NULL,
    details TEXT,
    steps TEXT,
    impact TEXT,
    recommendations TEXT,
    html_code TEXT,
    auditor_comments TEXT,
    page_name TEXT,
    sub_page_name TEXT,
    wcag_criterion TEXT NOT NULL,
    platform_type TEXT NOT NULL,
    mobile_os TEXT,
    severity TEXT NOT NULL CHECK(severity IN ('P1', 'P2', 'P3')),
    known_work_id TEXT,
    product_tag_id TEXT REFERENCES product_tags(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'fixed', 'verified')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS screenshots (
    id TEXT PRIMARY KEY,
    failure_id TEXT NOT NULL REFERENCES failures(id) ON DELETE CASCADE,
    drive_url TEXT NOT NULL,
    filename TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    scope_item_id TEXT NOT NULL REFERENCES scope_items(id) ON DELETE CASCADE,
    sc_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unchecked' CHECK(status IN ('unchecked', 'pass', 'fail', 'na')),
    na_note TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(scope_item_id, sc_id)
  );
`);

// Wrap the database to make it async-compatible
const wrappedDb = {
  prepare: (sql) => {
    const stmt = db.prepare(sql);
    return {
      get: (...params) => Promise.resolve(stmt.get(...params)),
      all: (...params) => Promise.resolve(stmt.all(...params)),
      run: (...params) => Promise.resolve(stmt.run(...params)),
    };
  },
  transaction: (fn) => {
    // For SQLite, we need to handle async transaction functions
    // by running them outside the transaction and collecting statements
    return async () => {
      // Create a proxy that collects operations
      const operations = [];
      const txDb = {
        prepare: (sql) => {
          const stmt = db.prepare(sql);
          return {
            run: (...params) => {
              operations.push({ stmt, params });
              return Promise.resolve();
            },
          };
        },
      };

      // Call the async function to collect operations
      await fn(txDb);

      // Now execute all operations in a real transaction
      const realTx = db.transaction(() => {
        for (const { stmt, params } of operations) {
          stmt.run(...params);
        }
      });
      realTx();
    };
  },
};

module.exports = wrappedDb;
