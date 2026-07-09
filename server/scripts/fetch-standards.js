/**
 * Fetch Salesforce WCAG Standards from Google Docs
 *
 * This script:
 * 1. Reads the SC mapping JSON (criterion ID -> Google Doc URL)
 * 2. Authenticates with Google Docs API
 * 3. Fetches content from each document
 * 4. Extracts remediation guidance and full HTML content
 * 5. Saves to client/src/data/standards-content.json
 *
 * Run manually: node server/scripts/fetch-standards.js
 * Or schedule to run weekly
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Path to the SC mapping file
const SC_MAPPING_PATH = path.join(__dirname, '../../sc-mapping.json');
const OUTPUT_PATH = path.join(__dirname, '../../client/src/data/standards-content.json');
const CREDENTIALS_PATH = path.join(__dirname, '../google-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../google-token.json');

// OAuth2 scopes needed
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];

/**
 * Extract document ID from Google Docs URL
 */
function extractDocId(url) {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Load OAuth2 client from stored credentials
 */
async function authorize() {
  let credentials, token;

  try {
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  } catch (err) {
    console.error('❌ Error loading credentials file. Please ensure google-credentials.json exists in server/');
    console.error('   Download it from Google Cloud Console: https://console.cloud.google.com/apis/credentials');
    throw err;
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have a stored token
  try {
    token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (err) {
    // No token found, need to authorize
    return getNewToken(oAuth2Client);
  }
}

/**
 * Get new OAuth2 token (first-time setup)
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n🔐 First-time authorization required!');
  console.log('📋 Visit this URL to authorize the app:\n');
  console.log(authUrl);
  console.log('\n📝 After authorizing, paste the authorization code here:');

  // In a real implementation, you'd use readline or a callback server
  // For now, this is a placeholder - you'll need to handle this interactively
  throw new Error('Please set up OAuth token manually. See documentation.');
}

/**
 * Convert Google Docs content to HTML
 */
function convertDocToHtml(doc) {
  if (!doc.body || !doc.body.content) {
    return { html: '', remediation: '' };
  }

  let html = '';
  let remediationText = '';
  let inRemediationSection = false;

  for (const element of doc.body.content) {
    if (element.paragraph) {
      const paragraph = element.paragraph;
      let text = '';

      if (paragraph.elements) {
        for (const el of paragraph.elements) {
          if (el.textRun && el.textRun.content) {
            text += el.textRun.content;
          }
        }
      }

      text = text.trim();
      if (!text) continue;

      // Detect headings by style
      const style = paragraph.paragraphStyle?.namedStyleType;

      if (style === 'HEADING_1') {
        html += `<h2>${escapeHtml(text)}</h2>\n`;
        // Check if this is the remediation section
        if (text.toLowerCase().includes('remediation') || text.toLowerCase().includes('how to fix')) {
          inRemediationSection = true;
        } else {
          inRemediationSection = false;
        }
      } else if (style === 'HEADING_2') {
        html += `<h3>${escapeHtml(text)}</h3>\n`;
      } else if (style === 'HEADING_3') {
        html += `<h4>${escapeHtml(text)}</h4>\n`;
      } else {
        // Regular paragraph
        html += `<p>${escapeHtml(text)}</p>\n`;

        // Capture remediation text
        if (inRemediationSection && text.length > 20) {
          remediationText += text + ' ';
        }
      }
    } else if (element.table) {
      // Handle tables if needed
      html += '<table>\n';
      for (const row of element.table.tableRows || []) {
        html += '<tr>\n';
        for (const cell of row.tableCells || []) {
          let cellText = '';
          for (const content of cell.content || []) {
            if (content.paragraph) {
              for (const el of content.paragraph.elements || []) {
                if (el.textRun) cellText += el.textRun.content;
              }
            }
          }
          html += `<td>${escapeHtml(cellText.trim())}</td>\n`;
        }
        html += '</tr>\n';
      }
      html += '</table>\n';
    }
  }

  return {
    html: html.trim(),
    remediation: remediationText.trim() || 'No remediation guidance found in document.'
  };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Fetch a single Google Doc
 */
async function fetchDocument(auth, docId, scId) {
  const docs = google.docs({ version: 'v1', auth });

  try {
    console.log(`  📄 Fetching ${scId}...`);
    const response = await docs.documents.get({
      documentId: docId,
    });

    const { html, remediation } = convertDocToHtml(response.data);

    return {
      scId,
      docId,
      title: response.data.title,
      html,
      remediation,
      lastFetched: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`  ❌ Error fetching ${scId}:`, error.message);
    return {
      scId,
      docId,
      error: error.message,
      lastFetched: new Date().toISOString(),
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Salesforce WCAG Standards fetch...\n');

  // Load SC mapping
  let scMapping;
  try {
    scMapping = JSON.parse(fs.readFileSync(SC_MAPPING_PATH, 'utf8'));
    console.log(`✅ Loaded ${Object.keys(scMapping).length} success criteria mappings\n`);
  } catch (err) {
    console.error('❌ Error loading sc-mapping.json:', err.message);
    process.exit(1);
  }

  // Authorize with Google
  console.log('🔐 Authenticating with Google Docs API...');
  let auth;
  try {
    auth = await authorize();
    console.log('✅ Authentication successful\n');
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
    process.exit(1);
  }

  // Fetch all documents
  console.log('📚 Fetching documents...\n');
  const results = [];

  for (const [scId, url] of Object.entries(scMapping)) {
    const docId = extractDocId(url);
    if (!docId) {
      console.error(`  ⚠️  Invalid URL for ${scId}: ${url}`);
      continue;
    }

    const result = await fetchDocument(auth, docId, scId);
    results.push(result);

    // Rate limiting - be nice to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save results
  console.log('\n💾 Saving results...');
  const output = {
    metadata: {
      totalCriteria: results.length,
      lastUpdated: new Date().toISOString(),
      source: 'Google Docs API',
    },
    standards: results.reduce((acc, item) => {
      acc[item.scId] = item;
      return acc;
    }, {})
  };

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');

  const successCount = results.filter(r => !r.error).length;
  const errorCount = results.filter(r => r.error).length;

  console.log(`✅ Saved to ${OUTPUT_PATH}`);
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n✨ Done!\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
