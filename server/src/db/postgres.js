const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
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

    // Run migrations for existing tables
    try {
      // Check if column exists and add it if not
      const columnCheck = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'auditor_name'
      `);

      if (columnCheck.rows.length === 0) {
        await client.query('ALTER TABLE projects ADD COLUMN auditor_name TEXT');
        console.log('✓ Added auditor_name column to projects table');
      }
    } catch (migrationErr) {
      console.error('Migration error:', migrationErr.message);
      // Don't fail startup if migration fails
    }

    console.log('✓ PostgreSQL schema initialized');
  } finally {
    client.release();
  }
}

// Synchronous-style wrapper for PostgreSQL to match SQLite API
const db = {
  prepare: (sql) => {
    // Convert datetime('now') to NOW() for PostgreSQL
    // Convert ? placeholders to $1, $2, $3, etc for PostgreSQL
    let paramCount = 0;
    const pgSql = sql
      .replace(/datetime\('now'\)/g, 'NOW()')
      .replace(/\?/g, () => `$${++paramCount}`);

    return {
      get: (...params) => {
        return pool.query(pgSql, params).then(result => result.rows[0]);
      },
      all: (...params) => {
        return pool.query(pgSql, params).then(result => result.rows);
      },
      run: (...params) => {
        return pool.query(pgSql, params);
      },
    };
  },
  transaction: (fn) => {
    return async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Create transaction-scoped db that uses the same client
        const txPrepare = (sql) => {
          // Convert ? placeholders to $1, $2, $3, etc
          let paramCount = 0;
          const pgSql = sql
            .replace(/datetime\('now'\)/g, 'NOW()')
            .replace(/\?/g, () => `$${++paramCount}`);
          return {
            run: (...params) => client.query(pgSql, params),
          };
        };

        // Call the transaction function with prepare method
        // The function might be async, so await it
        await fn({ prepare: txPrepare });

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
