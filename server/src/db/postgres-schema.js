const { Pool } = require('pg');

// Use Heroku's DATABASE_URL in production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Initialize database schema
async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        product_name TEXT NOT NULL,
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
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
        tag_id TEXT
      );

      CREATE TABLE IF NOT EXISTS scope_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        page_name TEXT NOT NULL,
        url TEXT
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
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
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(scope_item_id, sc_id)
      );

      CREATE INDEX IF NOT EXISTS idx_failures_project ON failures(project_id);
      CREATE INDEX IF NOT EXISTS idx_failures_page ON failures(page_name);
      CREATE INDEX IF NOT EXISTS idx_checklist_scope ON checklist_items(scope_item_id);
    `);
    console.log('✓ PostgreSQL schema initialized');
  } finally {
    client.release();
  }
}

// Wrapper to match better-sqlite3 API
const db = {
  prepare: (sql) => {
    return {
      get: async (...params) => {
        const result = await pool.query(sql, params);
        return result.rows[0];
      },
      all: async (...params) => {
        const result = await pool.query(sql, params);
        return result.rows;
      },
      run: async (...params) => {
        await pool.query(sql, params);
      },
    };
  },
  transaction: (fn) => {
    return async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create a transaction-scoped db object
        const txDb = {
          prepare: (sql) => ({
            run: async (...params) => {
              await client.query(sql, params);
            },
          }),
        };

        await fn(txDb);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    };
  },
};

module.exports = { db, initSchema };
