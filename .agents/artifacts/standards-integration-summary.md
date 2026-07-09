# Salesforce WCAG Standards Integration - Implementation Summary

## What Was Built

A complete system to fetch, cache, and automatically refresh Salesforce's internal WCAG standards from Google Docs.

## Files Created

### Scripts (server/scripts/)
1. **setup-google-auth.js** - One-time OAuth setup helper
2. **fetch-standards.js** - Fetches all 55 Google Docs and extracts content
3. **schedule-standards-refresh.js** - Weekly cron job (Sunday 2 AM)
4. **README.md** - Quick reference for scripts

### Documentation
1. **STANDARDS-SETUP.md** (project root) - Complete setup and usage guide
2. **standards-content.json** (client/src/data/) - Cached standards output

### Configuration Updates
1. **server/package.json** - Added node-cron dependency and npm scripts
2. **.gitignore** - Excluded OAuth credentials files
3. **sc-mapping.json** - Moved to project root

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Google Docs (55 Salesforce WCAG Standards)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Google Docs API
                         │ (OAuth authenticated)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  fetch-standards.js                                          │
│  • Reads sc-mapping.json                                     │
│  • Fetches each document                                     │
│  • Extracts HTML + remediation text                          │
│  • Rate limits requests (500ms between)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Writes JSON
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  standards-content.json (cached locally)                     │
│  {                                                            │
│    "metadata": { ... },                                      │
│    "standards": {                                            │
│      "1.1.1": {                                              │
│        "html": "<h2>Overview</h2>...",                       │
│        "remediation": "Provide text alternatives..."         │
│      },                                                      │
│      ...                                                     │
│    }                                                         │
│  }                                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌──────────────────────┐    ┌───────────────────────┐
│  Standards.jsx       │    │  NewFailure.jsx       │
│  Displays full HTML  │    │  Auto-populates       │
│  content for reference│    │  "How to fix" field   │
└──────────────────────┘    └───────────────────────┘
```

## Next Steps to Complete Integration

### 1. Install Dependencies
```bash
cd /c/Users/jonathan.bell/Desktop/a11y-audit-tool/server
npm install
```

This installs `node-cron` which is needed for the scheduler.

### 2. Set Up Google OAuth (One-Time)

**A. Create Google Cloud Project:**
1. Go to https://console.cloud.google.com
2. Create new project: "A11y Audit Tool"
3. Enable "Google Docs API"
4. Create OAuth 2.0 credentials (Desktop app)
5. Download JSON → save as `server/google-credentials.json`

**B. Authorize:**
```bash
cd server
npm run setup-google
```
- Opens browser to authorize
- Saves token to `server/google-token.json`
- Only need to do this once!

### 3. Run Initial Fetch
```bash
cd server
npm run fetch-standards
```

Expected output:
```
🚀 Starting Salesforce WCAG Standards fetch...
✅ Loaded 55 success criteria mappings
🔐 Authenticating with Google Docs API...
✅ Authentication successful
📚 Fetching documents...
  📄 Fetching 1.1.1...
  📄 Fetching 1.2.1...
  ...
💾 Saving results...
✅ Saved to client/src/data/standards-content.json
📊 Summary:
   ✅ Success: 55
   ❌ Errors: 0
✨ Done!
```

### 4. Update React Components

**A. Update Standards.jsx to use cached content:**

```javascript
import standardsContent from '../data/standards-content.json';

// Inside component:
const standard = standardsContent.standards[scId];
return (
  <div>
    <h2>{standard.title}</h2>
    <div dangerouslySetInnerHTML={{ __html: standard.html }} />
  </div>
);
```

**B. Update NewFailure.jsx to auto-populate remediation:**

```javascript
import standardsContent from '../data/standards-content.json';

// When WCAG SC is selected:
const handleCriterionChange = (scId) => {
  const standard = standardsContent.standards[scId.replace('SC ', '')];
  if (standard) {
    setFormData({
      ...formData,
      wcagCriterion: scId,
      howToFix: standard.remediation // Auto-populate!
    });
  }
};
```

### 5. Set Up Weekly Refresh (Optional but Recommended)

**Option A: pm2 (easiest)**
```bash
npm install -g pm2
cd /c/Users/jonathan.bell/Desktop/a11y-audit-tool/server
pm2 start scripts/schedule-standards-refresh.js --name standards-refresh
pm2 startup
pm2 save
```

**Option B: Windows Task Scheduler**
- Create task that runs on startup
- Program: `node`
- Arguments: `C:\Users\jonathan.bell\Desktop\a11y-audit-tool\server\scripts\schedule-standards-refresh.js`

**Option C: Manual weekly refresh**
- Set calendar reminder
- Run `npm run fetch-standards` every Sunday

## Benefits of This Approach

✅ **Fast** - No API calls at runtime, instant access to standards
✅ **Reliable** - Works offline, no dependency on Google API availability
✅ **Current** - Automatic weekly updates keep standards fresh
✅ **Simple** - Auditors don't need Google access, everything is cached
✅ **Pre-populated** - Failure forms get remediation text automatically
✅ **Comprehensive** - Full HTML content available for reference

## Security Notes

**DO NOT COMMIT:**
- `server/google-credentials.json` (OAuth client secret)
- `server/google-token.json` (Access token)

These are already in `.gitignore`.

**SAFE TO COMMIT:**
- `client/src/data/standards-content.json` (public standards content)
- `sc-mapping.json` (just URLs, no secrets)

## Maintenance

**When standards change:**
- Just run `npm run fetch-standards` manually
- Or wait for next Sunday's automatic refresh

**If Google Docs API token expires:**
- Run `npm run setup-google` to re-authorize
- Tokens should be valid indefinitely with "offline" access type

**If new WCAG criteria are added:**
1. Update `sc-mapping.json` with new criterion → URL mapping
2. Run `npm run fetch-standards`
3. Update `wcag.js` in client to include new criterion

## Testing Checklist

- [ ] `npm install` in server/ completes successfully
- [ ] `npm run setup-google` authorizes and saves token
- [ ] `npm run fetch-standards` creates standards-content.json
- [ ] standards-content.json contains 55 standards with HTML and remediation
- [ ] Standards.jsx can read and display cached content
- [ ] NewFailure.jsx can pre-populate "How to fix" from cache
- [ ] Weekly scheduler runs in background (optional)

## Questions or Issues?

Refer to `STANDARDS-SETUP.md` for detailed troubleshooting and documentation.
