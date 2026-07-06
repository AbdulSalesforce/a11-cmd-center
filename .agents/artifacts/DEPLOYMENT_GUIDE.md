# A11y Audit Tool - Production Deployment Guide

**Document Version:** 1.0  
**Date:** June 18, 2026  
**Owner:** Jonathan Bell, Accessibility Engineer  
**Status:** Pre-deployment planning

---

## Executive Summary

This document outlines the requirements, dependencies, and steps needed to deploy the Accessibility Audit Tool to production at Salesforce. The tool replaces manual Google Sheets workflows with a structured web application that automates audit tracking, checklist management, and eventual GUS integration.

**Current State:** Local development environment (demo)  
**Target State:** Internal Salesforce deployment with SSO, GUS integration, and Google Drive provisioning

---

## Table of Contents

1. [Infrastructure Requirements](#1-infrastructure-requirements)
2. [Authentication & Access Control](#2-authentication--access-control)
3. [GUS Integration](#3-gus-integration)
4. [Google Drive Integration](#4-google-drive-integration)
5. [Database Migration](#5-database-migration)
6. [Security & Compliance](#6-security--compliance)
7. [Deployment Phases](#7-deployment-phases)
8. [Stakeholders & Approvals](#8-stakeholders--approvals)
9. [Pre-Deployment Checklist](#9-pre-deployment-checklist)
10. [Post-Deployment Monitoring](#10-post-deployment-monitoring)

---

## 1. Infrastructure Requirements

### Hosting Platform Options

#### **Option A: Heroku (Recommended)**
- **Pros:**
  - Salesforce-owned platform
  - Built-in PostgreSQL add-on
  - Automatic HTTPS
  - Simple deployment via Git push
  - Faster internal approval process
  
- **Cons:**
  - Monthly cost (~$25-50 for hobby/standard tier)
  - Less control over infrastructure

- **What you need:**
  - Heroku app provisioning request
  - Heroku Postgres add-on (Standard tier minimum)
  - Access to Heroku CLI for deployments

#### **Option B: Internal Salesforce Infrastructure**
- **Pros:**
  - No external costs
  - Follows existing Salesforce deployment patterns
  - May have faster network access to GUS APIs
  
- **Cons:**
  - Longer approval process
  - Need to navigate internal DevOps procedures
  - May require containerization (Docker)

- **What you need:**
  - Contact Engineering Tools / DevOps team
  - Request Node.js hosting + PostgreSQL database
  - Request internal subdomain (e.g., `a11y-audit.internal.salesforce.com`)

### Infrastructure Checklist

- [ ] Provision hosting environment (Heroku or internal)
- [ ] Set up PostgreSQL database
- [ ] Configure HTTPS/SSL certificate (automatic on Heroku)
- [ ] Set up environment variables / secrets management
- [ ] Configure automated backups for database
- [ ] Set up monitoring/logging (Heroku logs or Splunk)

**Estimated Time:** 1-2 weeks (includes approval process)

---

## 2. Authentication & Access Control

### Current State
The tool currently has **no authentication** — suitable only for local development.

### Required: Salesforce SSO Integration

**Why:** Cannot deploy any internal tool without authentication per Salesforce security policy.

**Implementation Options:**

#### **Option A: Okta SSO (Standard)**
- Integrate with Salesforce's Okta instance
- OAuth 2.0 / OIDC flow
- Restrict access to `accessibility-engineering@salesforce.com` group

#### **Option B: Salesforce Identity**
- Use Salesforce Login as the identity provider
- May be overkill for an internal tool

### What You Need

1. **OAuth Client Credentials**
   - Client ID and Client Secret from IT Security
   - Callback URL: `https://your-app.herokuapp.com/auth/callback`
   - Scopes: `openid`, `profile`, `email`

2. **Access Control Rules**
   - Create Okta group: `a11y-audit-tool-users`
   - Add all accessibility engineers
   - Configure app to check group membership

3. **User Roles** (future enhancement)
   - **Auditor** — Can create/edit failures, run checklists
   - **Admin** — Can create projects, manage users
   - **Read-only** — Can view audits (for PMs, stakeholders)

### Authentication Checklist

- [ ] Contact IT Security team for Okta integration request
- [ ] Submit security review form (if required)
- [ ] Receive OAuth client credentials
- [ ] Implement SSO middleware in backend (use `passport-oauth2` or similar)
- [ ] Add session management (use `express-session` + Redis or PostgreSQL)
- [ ] Test SSO login flow with test user
- [ ] Configure logout and token refresh
- [ ] Add `created_by` and `updated_by` fields to all audit records

**Estimated Time:** 2-4 weeks (depends on InfoSec queue)

**Contact:** IT Security / Identity & Access Management team

---

## 3. GUS Integration

### Purpose
Enable the tool to:
1. Query existing GUS work items to detect duplicates
2. Bulk-create GUS bugs from logged failures
3. Link audit failures to existing GUS work items
4. Generate ACRs with real GUS work IDs

### Required: GUS API Access

**What You Need:**

1. **Service Account or OAuth Token**
   - Request from GUS team / Engineering Tools
   - Requires manager approval + justification

2. **API Permissions:**
   - `work.read` — Query existing work items by product/epic
   - `work.create` — Create new bugs
   - `work.update` — Update work item fields (e.g., link related items)
   - **Scoped to:** Products audited by accessibility team only

3. **Data Mappings:**
   - **Product Tag ID → GUS Product ID** (e.g., "PT SCV Core" → GUS product object)
   - **Default assignment rules** (or leave unassigned for team triage)
   - **Epic/Theme linking** (audit bugs should link to a11y epic)
   - **Component mapping** (if failures need component tags)

4. **GUS API Endpoints:**
   - `GET /services/data/vXX.0/query` — SOQL queries for duplicate detection
   - `POST /services/data/vXX.0/sobjects/agf__ADM_Work__c` — Create work items
   - Documentation: Internal GUS API docs (request access if not available)

### Workflow: "Sync to GUS" Feature

**Trigger:** After audit is 100% complete (all scope items marked complete)

**Flow:**
1. Auditor clicks **"Sync to GUS"** button on project page
2. Tool queries GUS for potential duplicates:
   - Filter: Same product + same WCAG SC + open status
   - Match algorithm: Keyword similarity in subject + description
3. Show review screen for each failure:
   ```
   Your failure: "Focus not moved to call controls after accepting call"
   
   Possible duplicates in GUS:
   ☐ W-12345678 "Focus management broken in call flow" (80% match)
   ☐ W-12389012 "Keyboard trap in call controls" (55% match)
   
   Action:
   ○ Create new bug
   ○ Link to W-12345678 (mark as duplicate)
   ○ Skip (tracked elsewhere)
   ```
4. Auditor reviews all matches, makes decisions
5. Tool bulk-creates GUS bugs (or links existing)
6. Updates local `failures` table with `gus_work_id` field
7. **"Generate ACR"** button now includes real GUS IDs in the report

### GUS Integration Checklist

- [ ] Contact GUS team for API access request
- [ ] Submit justification: "Automate a11y bug creation from audit tool"
- [ ] Get manager approval for service account
- [ ] Receive API credentials (store in environment variables)
- [ ] Map Product Tags → GUS Product IDs (build lookup table)
- [ ] Define default bug template (priority, severity, assignee rules)
- [ ] Build duplicate detection algorithm (keyword matching + fuzzy search)
- [ ] Implement "Sync to GUS" workflow UI
- [ ] Add `gus_work_id` column to `failures` table
- [ ] Update ACR generation script to include GUS IDs
- [ ] Test with pilot product (small audit, ~5 bugs)
- [ ] Document GUS error handling (rate limits, auth failures)

**Estimated Time:** 4-6 weeks (longest pole — approvals + integration work)

**Contact:** GUS Team / Engineering Tools, your manager for approval

---

## 4. Google Drive Integration

### Purpose
Auto-provision Google Drive folders and Sheets for each audit project:
- `[Client] — [Product] Accessibility Audit/` folder
- `Audit Spreadsheet.gsheet` (structured template)
- `Report.gdoc` (pre-filled with project info)
- `Evidence/` subfolder (organized by WCAG criterion)

### Required: Google Workspace Service Account

**Option A: Service Account with Domain-Wide Delegation (Recommended)**

**What You Need:**

1. **Google Cloud Project**
   - Create project under Salesforce Google Workspace org
   - Enable APIs: Google Drive API, Google Sheets API, Google Docs API

2. **Service Account**
   - Create service account in GCP
   - Enable domain-wide delegation
   - Generate JSON key file (store securely in environment variables)

3. **Permissions:**
   - `https://www.googleapis.com/auth/drive.file` — Create/manage files
   - `https://www.googleapis.com/auth/spreadsheets` — Read/write sheets
   - `https://www.googleapis.com/auth/documents` — Create/edit docs

4. **Designated Parent Folder:**
   - Create shared folder: `Salesforce A11y Audits/` in Google Drive
   - Share with service account (editor access)
   - All project folders created as subfolders here

5. **Template Files:**
   - Master audit spreadsheet template (with all tabs: Issues, Dashboard, etc.)
   - Master report doc template
   - Store template IDs in app config

**Option B: User OAuth (Alternative)**
- Each auditor authorizes the app with their Google account
- More friction, but no shared service account
- Better audit trail (files owned by individual auditors)

### Google Drive Checklist

- [ ] Contact Google Workspace admin
- [ ] Request service account creation for "A11y Audit Tool"
- [ ] Enable Drive, Sheets, Docs APIs in GCP project
- [ ] Generate service account JSON key
- [ ] Store JSON key securely (Heroku config var: `GOOGLE_SERVICE_ACCOUNT_KEY`)
- [ ] Create shared parent folder: `Salesforce A11y Audits/`
- [ ] Share folder with service account email
- [ ] Upload master template spreadsheet
- [ ] Upload master template doc
- [ ] Store template file IDs in environment variables
- [ ] Test: Create a project and verify folder/files are created
- [ ] Document: How to update templates if audit format changes

**Estimated Time:** 1 week

**Contact:** Google Workspace Admin team

---

## 5. Database Migration

### Current State: SQLite (local file)
- **Why it works locally:** Simple, file-based, no server needed
- **Why it won't work in production:** No concurrent access, no backups, Heroku ephemeral filesystem

### Target State: PostgreSQL

**Migration Steps:**

1. **Update Dependencies**
   - Remove: `better-sqlite3`
   - Add: `pg` (PostgreSQL driver)

2. **Update Schema Code**
   - File: `server/src/db/schema.js`
   - Replace SQLite syntax with Postgres:
     - `datetime('now')` → `NOW()`
     - `AUTOINCREMENT` → `SERIAL`
     - SQLite pragmas → Postgres configuration

3. **Environment Variables**
   - Add `DATABASE_URL` (Heroku provides automatically)
   - Format: `postgres://user:pass@host:5432/dbname`

4. **Migrate Existing Data** (if pilot data exists)
   - Export current SQLite database to JSON
   - Write import script to populate Postgres
   - Or start fresh (recommended for MVP)

5. **Connection Pooling**
   - Use `pg.Pool` for concurrent connections
   - Set max connections: 20-50 (adjust based on load)

### Database Checklist

- [ ] Provision PostgreSQL database (Heroku add-on or internal)
- [ ] Update `package.json` dependencies (`pg` instead of `better-sqlite3`)
- [ ] Rewrite `server/src/db/schema.js` for PostgreSQL
- [ ] Test schema creation locally with Postgres
- [ ] Add `DATABASE_URL` environment variable
- [ ] Implement connection pooling
- [ ] Set up automated daily backups
- [ ] Document database restore procedure

**Estimated Time:** 1-2 days

---

## 6. Security & Compliance

### Pre-Deployment Security Review

Before deploying any internal tool, Salesforce InfoSec requires:

1. **Data Classification**
   - **Question:** Does the audit data contain PII, customer data, or confidential info?
   - **Answer:** Audit failures describe product bugs — typically non-sensitive. Screenshots may contain UI text but not customer data.
   - **Classification:** Internal Use Only (likely)

2. **Access Controls**
   - Tool restricted to accessibility engineering team only (via Okta group)
   - No public internet access
   - Internal network only (VPN required if off-campus)

3. **Audit Logging**
   - Track who created/edited each failure
   - Add fields: `created_by`, `created_at`, `updated_by`, `updated_at`
   - Store user email from SSO session

4. **Secrets Management**
   - No hardcoded credentials in code
   - Use environment variables for:
     - Database URL
     - Google service account key
     - GUS API token
     - Okta client secret
   - Heroku config vars or internal secrets manager

5. **HTTPS Enforcement**
   - All traffic over HTTPS (automatic on Heroku)
   - No HTTP fallback

6. **Input Validation**
   - Sanitize all user inputs (prevent SQL injection, XSS)
   - Already using parameterized queries (SQLite/Postgres) ✅
   - **COMPLETED (2026-06-19):** Comprehensive input validation on all fields ✅
   - **COMPLETED (2026-06-19):** Field length limits enforced ✅
   - **COMPLETED (2026-06-19):** Enum validation for severity, status fields ✅
   - **COMPLETED (2026-06-19):** Array size limits enforced ✅
   - Add CSRF protection if using cookie-based sessions (planned for auth)

7. **Session Management**
   - Secure session cookies (`httpOnly`, `secure`, `sameSite`)
   - Session timeout: 8 hours (standard for internal tools)
   - Token refresh on activity

### Security Checklist

- [ ] Submit security review request to InfoSec
- [ ] Complete data classification questionnaire
- [ ] Implement audit logging (`created_by`, `updated_by` fields)
- [ ] Add HTTPS enforcement middleware
- [ ] Configure secure session cookies
- [x] **Add rate limiting on API endpoints** (COMPLETED 2026-06-19)
- [x] **Add input validation and sanitization** (COMPLETED 2026-06-19)
- [x] **Add error handling to prevent stack trace leakage** (COMPLETED 2026-06-19)
- [x] **Set secure file permissions on OAuth tokens** (COMPLETED 2026-06-19)
- [x] **Add request body size limits** (COMPLETED 2026-06-19)
- [ ] Implement CSRF protection
- [ ] Run security scan (if required by InfoSec)
- [x] **Document security controls** (see SECURITY_FIXES.md)
- [ ] Add security incident response plan (who to contact if breach)

**Estimated Time:** 2-3 weeks (depends on InfoSec review queue)

**Contact:** InfoSec / Security Review Team

### Security Improvements Already Implemented

**Date Completed:** 2026-06-19  
**Documentation:** See `.agents/artifacts/SECURITY_FIXES.md` for full details

The following security hardening has been completed and is active in the current codebase:

1. **Rate Limiting** ✅
   - General API: 100 requests per 15 minutes per IP
   - Export endpoint: 5 requests per 15 minutes per IP
   - Prevents DoS attacks and resource exhaustion

2. **Comprehensive Input Validation** ✅
   - All text fields have length limits (500-50,000 chars depending on field)
   - Severity field validated against enum: P1, P2, P3 only
   - Status fields validated against defined enums
   - Array size limits enforced (screenshots max 20, pages max 50)
   - Path traversal prevention in filenames

3. **Command Injection Prevention** ✅
   - Product names sanitized before subprocess execution
   - Max 100 chars, alphanumeric + spaces/hyphens only
   - Applied to both Python subprocess args and file paths

4. **HTTP Header Injection Prevention** ✅
   - Content-Disposition headers use sanitized values
   - Prevents response splitting and cache poisoning

5. **Error Handling & Stack Trace Protection** ✅
   - Global error handler prevents internal details leakage
   - All database operations wrapped in try-catch
   - Production mode hides stack traces completely

6. **Request Body Size Limits** ✅
   - JSON payloads limited to 1MB
   - Prevents memory exhaustion attacks

7. **File Permission Hardening** ✅
   - Google OAuth tokens saved with mode 0600 (owner-only)
   - Prevents token theft by other users/processes

**Security features already present (no changes needed):**
- SQL injection protection via parameterized queries
- XSS protection via React auto-escaping
- UUID primary keys (prevents enumeration)
- Foreign key constraints enabled
- CORS restricted to frontend origin

**Still required for production (unchanged):**
- Authentication/SSO integration
- CSRF protection (when auth is added)
- HTTPS enforcement (automatic on hosting platform)
- Session management with secure cookies
- Audit logging (created_by/updated_by fields)

---

## 7. Deployment Phases

### Phase 1: MVP Deployment (Internal Beta)

**Goal:** Get the tool live for the accessibility team with core features

**Scope:**
- ✅ Project creation
- ✅ Failure logging
- ✅ Checklist management
- ✅ Google Drive integration
- ✅ ACR generation (without GUS IDs)
- ✅ Salesforce SSO

**Out of Scope:**
- GUS integration (Phase 2)
- Duplicate detection (Phase 2)
- Auto-severity suggestions (Phase 3)

**Timeline:** 6-8 weeks

**Success Metrics:**
- 3 completed audits using the tool
- 90% user satisfaction (survey)
- Zero data loss incidents

---

### Phase 2: GUS Integration

**Goal:** Automate bug creation and reduce manual GUS data entry

**Scope:**
- ✅ "Sync to GUS" workflow
- ✅ Duplicate detection UI
- ✅ Bulk GUS bug creation
- ✅ ACR generation includes GUS work IDs

**Prerequisites:**
- Phase 1 deployed and stable
- GUS API access approved
- Product Tag → GUS Product mapping completed

**Timeline:** 4-6 weeks after Phase 1

**Success Metrics:**
- 50% reduction in time spent on GUS data entry
- <5% duplicate bug creation rate

---

### Phase 3: Enhancements

**Goal:** Add "nice to have" features based on user feedback

**Scope:**
- ✅ Auto-severity suggestions (keyword-based rules)
- ✅ Analytics dashboard (audit stats, trend analysis)
- ✅ Multi-project comparison
- ✅ Export to CSV/Excel
- ✅ User roles (admin, auditor, read-only)
- ✅ Notification system (Slack integration?)

**Timeline:** Ongoing, post-Phase 2

---

## 8. Stakeholders & Approvals

### Key Contacts

| Role | Name | Purpose | Timeline |
|------|------|---------|----------|
| **Your Manager** | [Name] | Approval to deploy, budget for Heroku | Week 1 |
| **IT Security / InfoSec** | [Team/Contact] | Security review, SSO setup | Weeks 2-4 |
| **Google Workspace Admin** | [Team/Contact] | Service account for Drive API | Week 3 |
| **GUS Team / Eng Tools** | [Team/Contact] | API credentials, product mappings | Weeks 4-8 |
| **DevOps / Hosting Team** | [Team/Contact] | Infrastructure provisioning (if not Heroku) | Week 2 |
| **Accessibility Team** | [Team members] | Beta testing, feedback | Weeks 6-8 |

### Approval Workflow

1. **Manager Approval** → Justify business need, cost (if Heroku)
2. **InfoSec Review** → Security questionnaire, data classification
3. **Google Workspace** → Service account creation request
4. **GUS API Access** → Justification + manager sign-off
5. **Deploy to Beta** → Accessibility team only
6. **Pilot Audit** → Run 1-2 audits, gather feedback
7. **General Availability** → Open to all auditors

---

## 9. Pre-Deployment Checklist

### Infrastructure ✅

- [ ] Hosting environment provisioned (Heroku or internal)
- [ ] PostgreSQL database created and accessible
- [ ] HTTPS configured
- [ ] Environment variables set (DATABASE_URL, secrets)
- [ ] Automated backups enabled
- [ ] Monitoring/logging configured

### Authentication ✅

- [ ] Salesforce SSO integrated (Okta OAuth)
- [ ] User session management implemented
- [ ] Access restricted to a11y team (Okta group)
- [ ] Logout flow tested
- [ ] Token refresh working

### Database ✅

- [ ] Migrated from SQLite to PostgreSQL
- [ ] Schema deployed to production database
- [ ] Connection pooling configured
- [ ] Seed data (WCAG criteria, demo projects) loaded

### Google Drive ✅

- [ ] Service account created and authorized
- [ ] Drive, Sheets, Docs APIs enabled
- [ ] Parent folder created and shared
- [ ] Template files uploaded
- [ ] Template IDs stored in config
- [ ] Test project folder creation works

### GUS Integration (Phase 2) ✅

- [ ] GUS API access granted
- [ ] Service account credentials stored securely
- [ ] Product Tag → GUS Product mappings documented
- [ ] Duplicate detection algorithm implemented
- [ ] "Sync to GUS" UI built
- [ ] Test: Create a bug in GUS from the tool

### Security ✅

- [ ] InfoSec security review completed
- [ ] Audit logging implemented (`created_by`, `updated_by`)
- [x] **Input validation and sanitization** (COMPLETED 2026-06-19)
- [ ] CSRF protection enabled (required when auth is added)
- [x] **Rate limiting on API endpoints** (COMPLETED 2026-06-19)
- [x] **Request body size limits** (COMPLETED 2026-06-19)
- [x] **Error handling prevents stack trace leakage** (COMPLETED 2026-06-19)
- [x] **File permissions hardened for OAuth tokens** (COMPLETED 2026-06-19)
- [ ] Secrets stored in environment variables (not code)

### Testing ✅

- [ ] All features tested locally with production-like setup
- [ ] SSO login flow tested with 3+ users
- [ ] Google Drive folder creation tested
- [ ] ACR generation tested
- [ ] Checklist auto-marking tested
- [ ] Multi-page failure logging tested
- [ ] Database backup/restore tested

### Documentation ✅

- [ ] Deployment guide (this document)
- [ ] User guide for auditors (how to use the tool)
- [ ] Admin guide (how to manage projects, users)
- [ ] API documentation (GUS integration)
- [ ] Troubleshooting guide (common errors)
- [ ] Rollback procedure (if deployment fails)

---

## 10. Post-Deployment Monitoring

### Week 1: Close Monitoring

- [ ] Check server logs daily for errors
- [ ] Monitor database performance (query times, connection pool)
- [ ] Track authentication failures (SSO issues)
- [ ] Watch for Google Drive API rate limits
- [ ] Collect user feedback (daily standup check-ins)

### Week 2-4: Stability Period

- [ ] Review error logs weekly
- [ ] Track key metrics:
  - Number of projects created
  - Number of failures logged
  - ACR generation success rate
  - Average audit completion time
- [ ] User survey: What's working? What's not?

### Ongoing: Maintenance

- [ ] Monthly database backups verification
- [ ] Quarterly security review
- [ ] Update dependencies (npm audit, security patches)
- [ ] Monitor Heroku dyno performance (scale up if needed)
- [ ] Rotate API credentials annually

---

## Estimated Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Manager Approval** | 1 week | Business justification, budget |
| **Infrastructure Setup** | 1-2 weeks | Heroku provisioning or internal hosting |
| **Database Migration** | 1-2 days | Postgres access |
| **SSO Integration** | 2-4 weeks | InfoSec approval, Okta credentials |
| **Google Drive Setup** | 1 week | Workspace admin approval |
| **Security Review** | 2-3 weeks | InfoSec queue time |
| **Phase 1 Deployment** | **6-8 weeks total** | All of the above |
| **GUS Integration** | 4-6 weeks | GUS API access (long pole) |
| **Phase 2 Deployment** | **10-14 weeks total** | Phase 1 stable |

**Critical Path:** GUS API access approval (4-6 weeks)

---

## Cost Estimate

### Heroku Option

- **Dyno (Standard tier):** $25/month
- **PostgreSQL (Standard 0):** $50/month
- **Redis (for sessions, optional):** $15/month
- **Total:** ~$90/month (~$1,080/year)

### Internal Hosting Option

- **Cost:** Typically $0 (absorbed by existing infrastructure)
- **Trade-off:** Longer approval process, more complexity

---

## Next Steps

1. **Share this document** with your manager for approval
2. **Schedule kickoff meeting** with stakeholders (InfoSec, Google admin, GUS team)
3. **Create project tracker** (Jira/GUS epic) for deployment tasks
4. **Assign owners** for each checklist item
5. **Set target launch date** (recommend 8-10 weeks from kickoff)

---

## Appendix A: Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User (Accessibility Engineer)                              │
│  - Authenticated via Salesforce SSO/Okta                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite)                                    │
│  - Hosted on Heroku or internal server                      │
│  - HTTPS only                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend (Node.js + Express)                                │
│  - Session management                                       │
│  - API endpoints for projects, failures, checklists         │
│  - Business logic (auto-marking, ACR generation)            │
└──┬──────────────┬──────────────┬──────────────┬────────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Postgres │  │ Google   │  │   GUS    │  │  Python  │
│Database │  │  Drive   │  │   API    │  │  Script  │
│         │  │   API    │  │          │  │ (ACR Gen)│
└─────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## Appendix B: Environment Variables

Production environment will need these variables:

```bash
# Database
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Authentication
OKTA_CLIENT_ID=abc123
OKTA_CLIENT_SECRET=secret123
OKTA_ISSUER=https://salesforce.okta.com
SESSION_SECRET=random-secret-key

# Google Drive
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_PARENT_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUv
GOOGLE_TEMPLATE_SHEET_ID=1XyZaBcDeFgHiJkLmNoPqRs
GOOGLE_TEMPLATE_DOC_ID=1TuVwXyZaBcDeFgHiJkLmNo

# GUS (Phase 2)
GUS_API_TOKEN=Bearer xyz789
GUS_API_BASE_URL=https://gus.my.salesforce.com/services/data/v58.0

# App Config
NODE_ENV=production
PORT=3000
ALLOWED_ORIGIN=https://a11y-audit.herokuapp.com
```

---

## Appendix C: Support & Contact

**Tool Owner:** Jonathan Bell, Accessibility Engineer  
**Email:** jonathan.bell@salesforce.com  
**Slack Channel:** #accessibility-engineering

**For Issues:**
- Deployment/infrastructure: [DevOps team contact]
- SSO/authentication: [IT Security contact]
- GUS API: [GUS team contact]
- Google Drive: [Workspace admin contact]

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-18 | Jonathan Bell | Initial deployment guide created |
| 1.1 | 2026-06-19 | Jonathan Bell | Updated with completed security fixes (rate limiting, input validation, error handling, file permissions) |

---

**End of Document**
