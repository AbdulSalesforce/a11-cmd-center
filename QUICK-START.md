# Quick Start - Standards Integration

Follow these steps to get Salesforce WCAG standards integrated into your auditing tool.

## Prerequisites

- [x] sc-mapping.json moved to project root ✓
- [ ] Google Cloud project created
- [ ] OAuth credentials downloaded
- [ ] Dependencies installed

---

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

```bash
cd /c/Users/jonathan.bell/Desktop/a11y-audit-tool/server
npm install
```

### 2. Google Cloud Setup (5 minutes)

1. **Go to Google Cloud Console:** https://console.cloud.google.com
2. **Create a project** (if you don't have one):
   - Click "Select a project" → "New Project"
   - Name: "A11y Audit Tool"
   - Click "Create"

3. **Enable Google Docs API:**
   - In left menu: "APIs & Services" → "Library"
   - Search: "Google Docs API"
   - Click "Enable"

4. **Create OAuth credentials:**
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "OAuth client ID"
   - If prompted, configure consent screen:
     - User Type: Internal (if available) or External
     - App name: "A11y Audit Tool"
     - Add your email as developer contact
     - Save and continue through the steps
   - Application type: **Desktop app**
   - Name: "Standards Fetcher"
   - Click "Create"

5. **Download credentials:**
   - Click the download icon (⬇️) next to your new OAuth client
   - Save file as: `server/google-credentials.json`

### 3. Authorize App (1 minute)

```bash
npm run setup-google
```

- Browser opens automatically
- Click "Allow" to grant read-only access to Google Docs
- Copy the authorization code
- Paste it in terminal
- Done! Token saved to `server/google-token.json`

### 4. Fetch Standards (1-2 minutes)

```bash
npm run fetch-standards
```

Watch as it fetches all 55 documents. This will take about 30-60 seconds.

**Success looks like:**
```
✅ Loaded 55 success criteria mappings
✅ Authentication successful
📚 Fetching documents...
  📄 Fetching 1.1.1...
  📄 Fetching 1.2.1...
  ...
✅ Saved to client/src/data/standards-content.json
📊 Summary:
   ✅ Success: 55
   ❌ Errors: 0
```

### 5. Verify Output

```bash
cat client/src/data/standards-content.json | head -30
```

You should see JSON with metadata and standards content.

---

## Start Weekly Auto-Refresh (Optional)

### Option A: pm2 (Recommended)

```bash
npm install -g pm2
pm2 start scripts/schedule-standards-refresh.js --name standards
pm2 startup
pm2 save
pm2 list
```

### Option B: Manual Weekly Refresh

Just run this every Sunday (or whenever):
```bash
cd server
npm run fetch-standards
```

Set a calendar reminder!

---

## Next: Update React Components

After fetching standards, you'll need to update your React components to use the cached content:

1. **Standards.jsx** - Display full standard details
2. **NewFailure.jsx** - Auto-populate remediation guidance

See `STANDARDS-SETUP.md` for code examples.

---

## Troubleshooting

### "credentials not found"
→ Make sure `server/google-credentials.json` exists

### "permission denied" on a doc
→ Your Google account needs access to those docs. Request access or skip for now.

### "Error: invalid_grant"
→ Run `npm run setup-google` again to refresh token

### "Module not found: node-cron"
→ Run `npm install` in the server directory

---

## Files Overview

```
a11y-audit-tool/
├── sc-mapping.json                        [✓] Moved from Downloads
├── STANDARDS-SETUP.md                     [✓] Full documentation
├── QUICK-START.md                         [✓] This file
│
├── server/
│   ├── package.json                       [✓] Updated with scripts
│   ├── google-credentials.json            [ ] You create (don't commit)
│   ├── google-token.json                  [ ] Created by setup-google
│   │
│   └── scripts/
│       ├── setup-google-auth.js           [✓] OAuth helper
│       ├── fetch-standards.js             [✓] Fetches Google Docs
│       ├── schedule-standards-refresh.js  [✓] Weekly cron
│       └── README.md                      [✓] Scripts reference
│
└── client/src/data/
    ├── wcag.js                            [✓] Existing WCAG data
    └── standards-content.json             [✓] Cached standards output
```

---

## Ready?

Run through steps 1-4 above and you'll have Salesforce standards integrated! 🎉
