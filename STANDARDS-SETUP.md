# Salesforce WCAG Standards Integration

This document explains how to fetch and refresh Salesforce's internal WCAG standards from Google Docs.

## Overview

The auditing tool needs access to Salesforce's internal WCAG standards documentation to:
1. Display detailed standards in the Standards reference page
2. Pre-populate remediation guidance when logging failures
3. Provide auditors with quick access to standards without leaving the app

## Architecture

### Data Flow
```
Google Docs (55 documents)
    ↓
fetch-standards.js (Google Docs API)
    ↓
standards-content.json (cached locally)
    ↓
React App (displays standards + provides remediation text)
```

### Weekly Refresh
- Runs automatically every Sunday at 2:00 AM
- Updates cached content when Salesforce standards change
- Ensures offline availability and fast performance

---

## Initial Setup (One-Time)

### Step 1: Google Cloud Console Setup

1. **Create a Google Cloud Project**
   - Go to: https://console.cloud.google.com
   - Create a new project (e.g., "A11y Audit Tool")

2. **Enable Google Docs API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Docs API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Desktop app**
   - Name it (e.g., "A11y Standards Fetcher")
   - Click "Create"

4. **Download Credentials**
   - Click the download icon next to your newly created OAuth client
   - Save the file as: `server/google-credentials.json`

### Step 2: Move SC Mapping File

The `sc-mapping.json` file (mapping WCAG criterion IDs to Google Doc URLs) needs to be in the project root:

```bash
# Move it from Downloads to project root
mv ~/Downloads/sc-mapping.json /c/Users/jonathan.bell/Desktop/a11y-audit-tool/
```

### Step 3: Install Dependencies

```bash
cd server
npm install
```

This will install:
- `googleapis` - Google Docs API client
- `node-cron` - Weekly refresh scheduler
- `open` - Auto-open browser for OAuth

### Step 4: Run OAuth Setup

```bash
cd server
npm run setup-google
```

This will:
1. Open your browser to Google's authorization page
2. Ask you to grant read-only access to Google Docs
3. Save the access token locally (valid indefinitely for offline access)

**Important**: You only need to do this once. The token is saved and reused.

---

## Fetching Standards

### Manual Fetch

Run the fetch script manually anytime:

```bash
cd server
npm run fetch-standards
```

This will:
- Fetch all 55 Google Docs
- Extract remediation guidance and full HTML content
- Save to `client/src/data/standards-content.json`
- Take ~30-60 seconds (with rate limiting to be nice to Google's API)

### Automated Weekly Refresh

Start the scheduler to automatically refresh every Sunday at 2 AM:

```bash
cd server
npm run schedule-refresh
```

**To run as a background service:**

#### Option A: pm2 (Recommended for development)
```bash
npm install -g pm2
pm2 start server/scripts/schedule-standards-refresh.js --name "standards-refresh"
pm2 startup  # Auto-start on system boot
pm2 save
```

#### Option B: Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task that runs on startup
3. Action: Start a program
4. Program: `node`
5. Arguments: `C:\Users\jonathan.bell\Desktop\a11y-audit-tool\server\scripts\schedule-standards-refresh.js`
6. Start in: `C:\Users\jonathan.bell\Desktop\a11y-audit-tool`

#### Option C: Run manually weekly
Just run `npm run fetch-standards` once a week. Set a calendar reminder!

---

## Output Format

### standards-content.json

```json
{
  "metadata": {
    "totalCriteria": 55,
    "lastUpdated": "2026-07-08T10:00:00.000Z",
    "source": "Google Docs API"
  },
  "standards": {
    "1.1.1": {
      "scId": "1.1.1",
      "docId": "13-s2XTve8ntZe4Ont_CGXNsif406mDz3Ee9R8M9YfsU",
      "title": "SC 1.1.1 Non-text Content",
      "html": "<h2>Overview</h2><p>All non-text content...</p>",
      "remediation": "Provide text alternatives for all non-text content...",
      "lastFetched": "2026-07-08T10:00:00.000Z"
    },
    ...
  }
}
```

### How It's Used

**In the failure logging form:**
```javascript
// Auto-populate "How to fix" field
const standard = standardsContent.standards[selectedCriterion];
failureForm.howToFix = standard.remediation;
```

**In the Standards page:**
```javascript
// Display full standard documentation
<div dangerouslySetInnerHTML={{ __html: standard.html }} />
```

---

## Updating wcag.js with Fetched Content

After running the fetch script for the first time, you'll want to update `client/src/data/wcag.js` to use the Salesforce remediation guidance instead of the generic text currently there.

I can create a script to do this automatically, or you can manually replace the `remediation` field in each criterion with the fetched content.

---

## Troubleshooting

### "Error loading credentials file"
- Make sure `server/google-credentials.json` exists
- Re-download from Google Cloud Console if needed

### "Authentication failed"
- Run `npm run setup-google` again
- Check that you're logged into the correct Google account (one with access to the docs)

### "Error fetching SC X.X.X"
- Check that the URL in `sc-mapping.json` is correct
- Ensure your Google account has permission to view that document
- Some docs might be restricted - you'll need to request access

### "Token expired"
- Run `npm run setup-google` to refresh the token
- This should happen automatically, but you can manually fix it this way

### Rate Limiting
- The script includes 500ms delays between requests
- If you get rate limited, increase the delay in `fetch-standards.js`

---

## Files Created

```
server/
├── scripts/
│   ├── fetch-standards.js           # Fetches docs from Google
│   ├── schedule-standards-refresh.js # Weekly cron scheduler
│   └── setup-google-auth.js         # OAuth setup helper
├── google-credentials.json          # OAuth credentials (do not commit!)
└── google-token.json                # OAuth token (do not commit!)

client/src/data/
└── standards-content.json           # Cached standards (safe to commit)

sc-mapping.json                      # Criterion ID → Google Doc URL mapping
```

### .gitignore

Make sure these are in your `.gitignore`:

```
server/google-credentials.json
server/google-token.json
```

The cached `standards-content.json` **should be committed** so the app works offline for other developers.

---

## Next Steps

1. ✅ Run initial setup and fetch
2. ✅ Verify `standards-content.json` was created
3. ⬜ Update `wcag.js` to use fetched remediation (optional)
4. ⬜ Update `Standards.jsx` to display full content from cache
5. ⬜ Update `NewFailure.jsx` to auto-populate from cached remediation
6. ⬜ Start weekly scheduler (or set calendar reminder)

---

## Questions?

This is a living document. Update it as you learn more about the system!
