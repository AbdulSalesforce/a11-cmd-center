/**
 * Schedule weekly refresh of Salesforce WCAG Standards
 *
 * This script runs as a background service and automatically fetches
 * updated standards content every Sunday at 2:00 AM.
 *
 * Run: node server/scripts/schedule-standards-refresh.js
 */

const cron = require('node-cron');
const { main: fetchStandards } = require('./fetch-standards');

console.log('📅 Standards Refresh Scheduler Started');
console.log('🔄 Scheduled: Every Sunday at 2:00 AM');
console.log('⏸️  Press Ctrl+C to stop\n');

// Run every Sunday at 2:00 AM
// Cron format: minute hour day-of-month month day-of-week
cron.schedule('0 2 * * 0', async () => {
  console.log(`\n⏰ [${new Date().toISOString()}] Starting scheduled standards refresh...`);

  try {
    await fetchStandards();
    console.log('✅ Scheduled refresh completed successfully\n');
  } catch (error) {
    console.error('❌ Scheduled refresh failed:', error);
  }
}, {
  scheduled: true,
  timezone: "America/Los_Angeles" // Adjust to your timezone
});

console.log('✅ Scheduler is running. Waiting for next scheduled time...\n');

// Optional: Run immediately on startup for testing
// Uncomment the following lines if you want to run a fetch when the scheduler starts:
// console.log('🚀 Running initial fetch...\n');
// fetchStandards().then(() => {
//   console.log('✅ Initial fetch completed\n');
// }).catch(console.error);
