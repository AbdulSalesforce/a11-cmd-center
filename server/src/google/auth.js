const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const os = require('os');
const open = require('open');
const http = require('http');

const DATA_DIR = path.join(os.homedir(), '.a11y-audit');
const TOKEN_PATH = path.join(DATA_DIR, 'google-token.json');
const CREDS_PATH = path.join(DATA_DIR, 'google-credentials.json');

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

function getCredentials() {
  if (!fs.existsSync(CREDS_PATH)) {
    throw new Error(
      `Google credentials not found at ${CREDS_PATH}. ` +
      'Please follow setup instructions to add your OAuth credentials.'
    );
  }
  return JSON.parse(fs.readFileSync(CREDS_PATH));
}

function createOAuthClient() {
  const { client_id, client_secret, redirect_uris } = getCredentials().installed;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

async function authorize() {
  const oAuth2Client = createOAuthClient();

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    // Refresh if expired
    if (token.expiry_date && token.expiry_date < Date.now()) {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      // Security: Write token with restrictive permissions (owner-only read/write)
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials), { mode: 0o600 });
      oAuth2Client.setCredentials(credentials);
    }
    return oAuth2Client;
  }

  return getNewToken(oAuth2Client);
}

function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3001');
      if (url.pathname !== '/oauth2callback') return;

      const code = url.searchParams.get('code');
      res.end('<h1>Authenticated! You can close this tab.</h1>');
      server.close();

      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        // Security: Write token with restrictive permissions (owner-only read/write)
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens), { mode: 0o600 });
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });

    server.listen(3001, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        redirect_uri: 'http://localhost:3001/oauth2callback',
      });
      console.log('Opening browser for Google authentication...');
      open(authUrl);
    });
  });
}

module.exports = { authorize };
