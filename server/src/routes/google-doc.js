const express = require('express');
const router = express.Router();

// Extract document ID from Google Docs URL
function extractDocId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Parse Google Doc content to extract project fields
function parseDocContent(content) {
  const data = {
    product_name: null,
    pm_name: null,
    pm_email: null,
    login_path: null,
    slack_channel: null,
    audit_theme_id: null,
    auditor_name: null,
    scope_items: [],
    product_tags: [],
  };

  // Extract Product Name
  // Look for patterns like "Product Name" or "Product:" followed by the value
  const productMatch = content.match(/Product\s*(?:Name)?[:\s]+([^\n]+)/i);
  if (productMatch) {
    data.product_name = productMatch[1].trim();
  }

  // Extract PM Name
  // Look in Contacts section for PM name
  const pmNameMatch = content.match(/Lead PM[^\n]*\n+([^\n(]+)/i) ||
                      content.match(/PM\s*(?:Name)?[:\s]+([^\n]+)/i);
  if (pmNameMatch) {
    data.pm_name = pmNameMatch[1].trim();
  }

  // Extract PM Email
  const emailMatch = content.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
  if (emailMatch) {
    data.pm_email = emailMatch[1].trim();
  }

  // Extract Login Path / Test Org URL
  const loginMatch = content.match(/(?:Test Org URL|Login[^\n]*)[:\s]+([^\n]+)/i);
  if (loginMatch) {
    const login = loginMatch[1].trim();
    if (login && login !== 'TBD' && !login.includes('provided by')) {
      data.login_path = login;
    }
  }

  // Extract Slack Channel
  const slackMatch = content.match(/(?:Slack Channel|Audit Slack Channel)[:\s]+([^\n]+)/i);
  if (slackMatch) {
    const slack = slackMatch[1].trim();
    if (slack && slack !== 'TBD' && !slack.includes('ACR')) {
      data.slack_channel = slack;
    }
  }

  // Extract Audit Theme ID
  const themeMatch = content.match(/Audit Theme[:\s]+([^\n]+)/i);
  if (themeMatch) {
    const theme = themeMatch[1].trim();
    if (theme && theme !== 'TBD') {
      data.audit_theme_id = theme;
    }
  }

  // Extract Auditor Name
  const auditorMatch = content.match(/Auditor[:\s]+([^\n]+)/i);
  if (auditorMatch) {
    const auditor = auditorMatch[1].trim();
    if (auditor && auditor !== 'TBD' && !auditor.includes('ACR Team')) {
      data.auditor_name = auditor;
    }
  }

  // Extract Scope Items (User Flows)
  // Look for "Flow ID" patterns like "RA1", "AO2", etc.
  const flowMatches = content.matchAll(/Flow\s+[A-Z]+\d+:\s*([^\n]+)/gi);
  for (const match of flowMatches) {
    const flowName = match[1].trim();
    if (flowName) {
      data.scope_items.push({ page_name: flowName, url: '' });
    }
  }

  // Extract Product Tags
  // Look for "Primary Product Tag:" or "Product Tag:" patterns
  const tagMatches = content.matchAll(/(?:Primary )?Product Tag[:\s]+([a-zA-Z0-9]+)\s*\(([^)]+)\)/gi);
  for (const match of tagMatches) {
    const tagId = match[1].trim();
    const tagName = match[2].trim();
    if (tagId && tagName) {
      data.product_tags.push({ tag_name: tagName, tag_id: tagId });
    }
  }

  return data;
}

// Endpoint to parse Google Doc
router.post('/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const docId = extractDocId(url);
    if (!docId) {
      return res.status(400).json({ error: 'Invalid Google Doc URL' });
    }

    // Fetch the document content using Google Docs API
    // For now, we'll use a simple fetch to get the public content
    // In production, you may need to use the Google Docs API with OAuth
    const publicUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(publicUrl);

    if (!response.ok) {
      // Try alternative approach: fetch as published document
      const altUrl = `https://docs.google.com/document/d/${docId}/pub`;
      const altResponse = await fetch(altUrl);

      if (!altResponse.ok) {
        return res.status(400).json({
          error: 'Unable to access document. Please ensure the document is publicly accessible or shared with appropriate permissions.'
        });
      }

      const htmlContent = await altResponse.text();
      // Basic HTML stripping to get text
      const textContent = htmlContent.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      const parsedData = parseDocContent(textContent);
      return res.json(parsedData);
    }

    const content = await response.text();
    const parsedData = parseDocContent(content);

    res.json(parsedData);
  } catch (err) {
    console.error('Error parsing Google Doc:', err);
    res.status(500).json({ error: 'Failed to parse document. Please check the URL and try again.' });
  }
});

module.exports = router;
