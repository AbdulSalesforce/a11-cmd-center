# 🎯 YOUR TODO CHECKLIST

I've done everything I can! Here's what **YOU** need to do to complete the setup.

---

## ✅ Already Done (By Me)

- [x] Installed dependencies (`node-cron` added)
- [x] Moved `sc-mapping.json` to project root
- [x] Created all fetch scripts
- [x] Updated `.gitignore` to protect credentials
- [x] Updated React components to use cached standards
- [x] Created comprehensive documentation

---

## 🔴 YOU NEED TO DO (3 Browser Steps)

### Step 1: Google Cloud Console Setup (5 minutes)

**Go to:** https://console.cloud.google.com

1. **Create a new project:**
   - Click "Select a project" dropdown (top bar)
   - Click "New Project"
   - Name: "A11y Audit Tool" (or whatever you want)
   - Click "Create"
   - Wait for it to create, then select it

2. **Enable Google Docs API:**
   - In the left menu: "APIs & Services" → "Library"
   - Search: "Google Docs API"
   - Click on it
   - Click "Enable" button

3. **Create OAuth 2.0 credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   
   - **If prompted to configure consent screen first:**
     - Click "Configure Consent Screen"
     - User Type: **Internal** (if available) or External
     - Click "Create"
     - App name: "A11y Audit Tool"
     - User support email: (your email)
     - Developer contact: (your email)
     - Click "Save and Continue"
     - Skip scopes (click "Save and Continue")
     - Skip test users (click "Save and Continue")
     - Click "Back to Dashboard"
     - Go back to "Credentials" tab
     - Click "Create Credentials" → "OAuth client ID" again
   
   - Application type: **Desktop app**
   - Name: "Standards Fetcher" (or whatever)
   - Click "Create"

4. **Download the credentials:**
   - You'll see a popup with Client ID and Client Secret
   - Click the **download icon** (⬇️) or "Download JSON"
   - Save the file

5. **Move the downloaded file:**
   - Rename it to: `google-credentials.json`
   - Move it to: `C:\Users\jonathan.bell\Desktop\a11y-audit-tool\server\google-credentials.json`

---

### Step 2: Authorize the App (1 minute)

Open Git Bash or your terminal:

```bash
cd /c/Users/jonathan.bell/Desktop/a11y-audit-tool/server
npm run setup-google
```

**What will happen:**
1. Your browser will open automatically
2. You'll see "A11y Audit Tool wants to access your Google Account"
3. Click **"Allow"** (or "Continue")
4. You'll see an authorization code (long string)
5. **Copy it**
6. Go back to your terminal
7. **Paste the code** and press Enter
8. You'll see: ✅ Token saved successfully!

**Done!** You now have `google-token.json` saved. This is permanent - you won't need to do this again.

---

### Step 3: Fetch the Standards (1-2 minutes)

Still in the terminal:

```bash
npm run fetch-standards
```

**What will happen:**
- It will fetch all 55 Google Docs
- Takes about 30-60 seconds
- You'll see progress messages for each document
- At the end: ✅ Success: 55

**Output file:** `client/src/data/standards-content.json` (will be populated with real data)

---

## 🎉 That's It!

After completing those 3 steps:

- ✅ Standards page will show full Salesforce content (click to expand each criterion)
- ✅ Failure forms will auto-populate with Salesforce remediation guidance
- ✅ Everything works offline

---

## 🔄 Optional: Weekly Auto-Refresh

If you want standards to update automatically every Sunday at 2 AM:

### Option A: pm2 (Easiest)

```bash
npm install -g pm2
cd /c/Users/jonathan.bell/Desktop/a11y-audit-tool/server
pm2 start scripts/schedule-standards-refresh.js --name standards
pm2 startup
pm2 save
```

Check it's running: `pm2 list`

### Option B: Manual Weekly Refresh

Just run this every Sunday (or whenever):

```bash
cd /c/Users/jonathan.bell/Desktop/a11y-audit-tool/server
npm run fetch-standards
```

Set a calendar reminder!

---

## 🆘 If Something Goes Wrong

**"Error loading credentials file"**
→ Make sure `google-credentials.json` is in `server/` folder

**"Permission denied" on some docs**
→ Your Google account needs access to those docs. Request access from the owner.

**"Authentication failed"**
→ Run `npm run setup-google` again

**"Module not found: node-cron"**
→ This shouldn't happen (I already installed it), but if it does: `npm install` in server/

---

## 📚 Full Documentation

- **Quick setup guide:** `QUICK-START.md`
- **Detailed docs:** `STANDARDS-SETUP.md`
- **Scripts reference:** `server/scripts/README.md`

---

## ✨ Summary

**What you're about to do:**
1. Create Google Cloud project + OAuth credentials (5 min, browser)
2. Run `npm run setup-google` to authorize (1 min, terminal + browser)
3. Run `npm run fetch-standards` to get the data (1 min, terminal)

**Total time:** ~7 minutes

**Result:** Full Salesforce WCAG standards integrated into your auditing tool!

---

Good luck! 🚀
