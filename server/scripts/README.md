# Scripts Directory

## Quick Reference

### 🔐 First-Time Setup
```bash
npm run setup-google
```
Run once to authorize Google Docs API access. Opens browser, saves token.

### 📥 Fetch Standards Manually
```bash
npm run fetch-standards
```
Fetches all 55 WCAG standards from Google Docs. Takes ~30-60 seconds.

### ⏰ Start Weekly Auto-Refresh
```bash
npm run schedule-refresh
```
Runs in background, automatically fetches standards every Sunday at 2 AM.

### 🔄 Weekly Refresh with pm2
```bash
npm install -g pm2
pm2 start scripts/schedule-standards-refresh.js --name standards
pm2 startup
pm2 save
```
Recommended for production. Survives system reboots.

---

## Scripts

### setup-google-auth.js
- One-time OAuth setup
- Opens browser for authorization
- Saves token to `server/google-token.json`
- Token valid indefinitely (no expiration for offline access)

### fetch-standards.js
- Fetches all 55 Google Docs
- Extracts HTML content and remediation guidance
- Saves to `client/src/data/standards-content.json`
- Includes rate limiting (500ms between requests)

### schedule-standards-refresh.js
- Cron job that runs weekly (Sunday 2 AM)
- Calls `fetch-standards.js` automatically
- Keeps standards up-to-date with latest Google Doc changes

### generate_acr.py
- Legacy Python script (existing)
- Unrelated to standards fetching

---

## File Paths

**Input:**
- `sc-mapping.json` (project root) - Maps WCAG SC → Google Doc URLs

**Credentials:**
- `server/google-credentials.json` - OAuth client credentials (don't commit)
- `server/google-token.json` - Access token (don't commit)

**Output:**
- `client/src/data/standards-content.json` - Cached standards (safe to commit)

---

## Troubleshooting

**Script fails with "credentials not found":**
→ Download OAuth credentials from Google Cloud Console, save as `server/google-credentials.json`

**Script fails with "authentication failed":**
→ Run `npm run setup-google` to refresh token

**Script fails with "permission denied" on specific docs:**
→ Request access to those Google Docs with your Salesforce account

**Want to change refresh schedule:**
→ Edit cron expression in `schedule-standards-refresh.js` (line 16)

---

## Cron Expression Reference

Current: `'0 2 * * 0'` = Every Sunday at 2:00 AM

Examples:
- `'0 2 * * 0'` - Every Sunday at 2 AM
- `'0 0 * * 0'` - Every Sunday at midnight
- `'0 2 * * 1'` - Every Monday at 2 AM
- `'0 2 * * *'` - Every day at 2 AM
- `'0 */6 * * *'` - Every 6 hours

Format: `minute hour day-of-month month day-of-week`

---

See `STANDARDS-SETUP.md` in project root for detailed documentation.
