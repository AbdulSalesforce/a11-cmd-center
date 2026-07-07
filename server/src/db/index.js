// Database abstraction - uses PostgreSQL in production, SQLite locally
const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;

if (isProduction) {
  // Use PostgreSQL in production
  const { db, initSchema } = require('./postgres');

  // Initialize schema on startup
  initSchema().catch(err => {
    console.error('Failed to initialize PostgreSQL schema:', err);
    process.exit(1);
  });

  module.exports = db;
} else {
  // Use SQLite for local development
  module.exports = require('./schema');
}
