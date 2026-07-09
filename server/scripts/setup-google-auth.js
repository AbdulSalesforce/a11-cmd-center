/**
 * Google OAuth2 Setup Helper
 *
 * This script helps you complete the one-time OAuth setup for Google Docs API access.
 * You only need to run this once.
 *
 * Prerequisites:
 * 1. Create a project in Google Cloud Console: https://console.cloud.google.com
 * 2. Enable Google Docs API
 * 3. Create OAuth 2.0 credentials (Desktop app)
 * 4. Download credentials and save as server/google-credentials.json
 *
 * Run: node server/scripts/setup-google-auth.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const open = require('open');

const CREDENTIALS_PATH = path.join(__dirname, '../google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../google-token.json');
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

/**
 * Load OAuth2 credentials
 */
function loadCredentials() {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('\n❌ Error: google-credentials.json not found!\n');
    console.log('📋 Setup instructions:');
    console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
    console.log('   2. Create a new OAuth 2.0 Client ID (Desktop app)');
    console.log('   3. Download the JSON file');
    console.log(`   4. Save it as: ${CREDENTIALS_PATH}\n`);
    process.exit(1);
  }
}

/**
 * Get authorization URL and prompt user
 */
async function authorize() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if token already exists
  if (fs.existsSync(TOKEN_PATH)) {
    console.log('\n✅ Token already exists!');
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);

    console.log('\n🔄 Testing token...');
    try {
      const docs = google.docs({ version: 'v1', auth: oAuth2Client });
      // Test with a simple API call (this will fail if token is invalid)
      await docs.documents.get({ documentId: '1AmyKni9rksTLT2Ey5Z8ceK0SO-v-iADdxmT4zW4YB_o' });
      console.log('✅ Token is valid!\n');
      return;
    } catch (err) {
      console.log('⚠️  Token expired or invalid. Generating new one...\n');
      fs.unlinkSync(TOKEN_PATH);
    }
  }

  // Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 Authorization Required\n');
  console.log('Opening authorization URL in your browser...\n');

  // Open browser automatically
  await open(authUrl);

  console.log('If the browser didn\'t open, visit this URL manually:');
  console.log(authUrl);
  console.log('\n📝 After authorizing, paste the authorization code here:\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Authorization code: ', async (code) => {
    rl.close();

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      // Save the token
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log('\n✅ Token saved successfully!');
      console.log(`📁 Location: ${TOKEN_PATH}\n`);
      console.log('🎉 Setup complete! You can now run the fetch script.\n');
    } catch (err) {
      console.error('\n❌ Error retrieving access token:', err.message);
      process.exit(1);
    }
  });
}

// Run setup
console.log('🚀 Google OAuth2 Setup\n');
authorize().catch(console.error);
