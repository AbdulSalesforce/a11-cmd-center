# A11y Audit Tool - Adoption Risk Analysis

**Date:** 2026-06-19  
**Purpose:** Identify potential blockers for tool acceptance and adoption at Salesforce

---

## 1. Data Governance & Privacy Concerns

### Risk: Screenshots May Contain Sensitive Information
**Issue:** Screenshots uploaded to Google Drive might contain:
- Unannounced product features
- Customer data in UI mockups
- Internal configuration details
- Security vulnerability evidence

**Impact:** InfoSec might require additional controls or block Drive integration entirely

**Mitigation:**
- [ ] Document screenshot handling policy (redaction requirements)
- [ ] Add warning in UI: "Ensure screenshots do not contain customer data"
- [ ] Consider self-hosted file storage instead of Google Drive
- [ ] Implement screenshot approval workflow before Drive upload
- [ ] Add automatic PII detection/warning (future enhancement)

**Probability:** Medium | **Severity:** High

---

### Risk: Audit Data Reveals Security Vulnerabilities
**Issue:** Accessibility failures often overlap with security issues (auth bypasses, data exposure)

**Impact:** Tool might need higher security classification, limiting who can access it

**Mitigation:**
- [ ] Clarify with InfoSec: accessibility audit data classification
- [ ] Implement role-based access control (not just team-wide access)
- [ ] Add data retention policy (auto-delete audits after X months)
- [ ] Document how to handle security-related findings (escalation path)

**Probability:** Medium | **Severity:** Medium

---

### Risk: Data Retention & Deletion Requirements
**Issue:** No current policy on how long audit data is kept or how to delete it

**Impact:** Compliance issues, storage costs, or requirement to build admin tools

**Mitigation:**
- [ ] Define data retention policy (suggest: 2 years after project completion)
- [ ] Build "Archive Project" feature (soft delete)
- [ ] Build "Permanently Delete Project" feature (hard delete with confirmation)
- [ ] Document GDPR/data subject rights compliance (if applicable)

**Probability:** Low | **Severity:** Low

---

## 2. Integration & Technical Dependencies

### Risk: GUS API Access Approval Takes Too Long
**Issue:** GUS API access can take 4-6 weeks or longer, blocking Phase 2

**Impact:** MVP ships without GUS integration, reducing value proposition

**Mitigation:**
- [x] Document GUS integration as Phase 2 (not MVP blocker) ✅
- [ ] Start GUS API request early (during Phase 1 development)
- [ ] Have manual GUS workflow documented as fallback
- [ ] Consider alternative: CSV export → bulk GUS import tool

**Probability:** High | **Severity:** Medium

---

### Risk: Google Drive Integration Policy Conflicts
**Issue:** Salesforce might have policies against storing work data in Google Drive

**Impact:** Forced to rebuild with internal file storage (S3, internal drive)

**Mitigation:**
- [ ] Verify Google Drive is approved for internal tools BEFORE MVP launch
- [ ] Have architecture plan for alternative storage (S3, Box, internal)
- [ ] Make file storage pluggable (abstract storage layer in code)
- [ ] Document migration path if storage backend changes

**Probability:** Medium | **Severity:** High

---

### Risk: Python Dependency for ACR Generation
**Issue:** Server requires Python installed, adds deployment complexity

**Impact:** May not work on all hosting platforms, increases maintenance burden

**Mitigation:**
- [ ] Consider rewriting ACR generation in Node.js (python-docx → docx.js)
- [ ] Document Python version requirement (3.8+)
- [ ] Add health check: verify Python is installed on startup
- [ ] Consider containerization (Docker) to bundle dependencies

**Probability:** Low | **Severity:** Medium

---

### Risk: OAuth Token Expiration/Revocation
**Issue:** Google OAuth tokens can expire or be revoked, breaking Drive integration

**Impact:** Tool stops working, requires manual re-authentication

**Mitigation:**
- [x] Implemented automatic token refresh ✅
- [ ] Add monitoring/alerting when token refresh fails
- [ ] Document re-authorization procedure for users
- [ ] Consider service account instead of OAuth (see deployment guide)

**Probability:** Medium | **Severity:** Low

---

## 3. User Adoption & Change Management

### Risk: Team Prefers Existing Spreadsheet Workflow
**Issue:** Team has muscle memory with current Google Sheets process

**Impact:** Low adoption, tool sits unused, team continues with spreadsheets

**Mitigation:**
- [ ] Run pilot with 1-2 friendly auditors first (get champions)
- [ ] Document what's BETTER than spreadsheets (auto-marking, progress tracking)
- [ ] Offer migration help (import existing spreadsheet data)
- [ ] Collect feedback early and iterate quickly
- [ ] Don't force adoption - make it optional initially

**Probability:** Medium | **Severity:** High

---

### Risk: Missing Critical Workflow Features
**Issue:** Tool might not support edge cases the team encounters

**Examples:**
- Re-testing after fixes (no "verified" workflow)
- Collaborative auditing (multiple auditors on same page)
- Custom WCAG criteria not in 2.2 Level AA
- Export to formats other than .docx (PDF, HTML)

**Impact:** Team hits blockers, reverts to spreadsheets

**Mitigation:**
- [ ] Survey team BEFORE MVP: "What would make you stop using this?"
- [ ] Build feedback mechanism into the tool (in-app feedback button)
- [ ] Maintain feature backlog visible to team
- [ ] Set expectation: MVP is 80% solution, will evolve

**Probability:** High | **Severity:** Medium

---

### Risk: Learning Curve Too Steep
**Issue:** Tool more complex than "just edit a spreadsheet"

**Impact:** Team frustrated, adoption fails

**Mitigation:**
- [ ] Create quick-start guide (5-minute "How to log your first failure")
- [ ] Record walkthrough video
- [ ] Offer 1:1 onboarding sessions
- [ ] Add in-app tooltips/help text
- [ ] Keep UI simple - resist feature creep

**Probability:** Low | **Severity:** Medium

---

## 4. Operational & Maintenance Concerns

### Risk: Single Point of Failure (You)
**Issue:** Jonathan is sole developer/maintainer - what if you leave, go on leave, or get reassigned?

**Impact:** Tool breaks, no one can fix it, team loses trust

**Mitigation:**
- [x] Comprehensive documentation (deployment guide, security fixes) ✅
- [ ] Cross-train at least one other engineer
- [ ] Code review with senior engineer (knowledge transfer)
- [ ] Document architecture decisions (ADRs)
- [ ] Add extensive inline comments in complex sections
- [ ] Create runbook: "How to debug common issues"

**Probability:** Medium | **Severity:** High

---

### Risk: No Support Model Defined
**Issue:** Who helps when things break? How do users report bugs?

**Impact:** Issues pile up, team loses confidence

**Mitigation:**
- [ ] Create Slack channel: #a11y-audit-tool-support
- [ ] Define SLA: "We'll respond within X hours"
- [ ] Set up error logging/monitoring (Sentry, LogRocket, or Heroku logs)
- [ ] Create issue tracker (Jira, GitHub issues, or GUS epic)
- [ ] Document on-call rotation if tool becomes critical

**Probability:** Medium | **Severity:** Medium

---

### Risk: Backup & Disaster Recovery Not Defined
**Issue:** What if the database is corrupted or deleted?

**Impact:** Loss of audit data, team has to recreate work

**Mitigation:**
- [x] Document daily automated backups requirement in deployment guide ✅
- [ ] Test backup restore procedure BEFORE production
- [ ] Document RTO/RPO (Recovery Time/Point Objectives)
- [ ] Consider export-all feature (manual backup option)
- [ ] Store backups in separate location from primary database

**Probability:** Low | **Severity:** High

---

## 5. Organizational & Political Risks

### Risk: Duplicate/Competing Tools
**Issue:** Another team might have built or be building similar tool

**Impact:** Forced to merge efforts, tool might be deprecated, wasted work

**Mitigation:**
- [ ] Survey other accessibility teams: "Do you have audit tooling?"
- [ ] Check internal tool registry (if Salesforce has one)
- [ ] Present at accessibility guild meeting (get buy-in, avoid surprises)
- [ ] Offer to share/collaborate if another tool exists
- [ ] Emphasize customization: "Built specifically for our workflow"

**Probability:** Low | **Severity:** High

---

### Risk: Budget/Cost Approval Issues
**Issue:** $90/month Heroku cost might require director approval

**Impact:** Deployment delayed waiting for budget approval

**Mitigation:**
- [ ] Get manager pre-approval BEFORE building deployment plan
- [ ] Frame as "productivity investment": saves X hours per audit
- [ ] Offer free alternative: deploy on internal infrastructure (no cost)
- [ ] Start with free Heroku hobby tier for pilot (downgrade from standard)
- [ ] Calculate ROI: "Saves 5 hours per audit × 20 audits/year = 100 hours = $X value"

**Probability:** Low | **Severity:** Low

---

### Risk: Engineering Time for GUS Integration
**Issue:** GUS team might not have bandwidth to support integration

**Impact:** Phase 2 blocked indefinitely

**Mitigation:**
- [ ] Make GUS integration self-service via API (don't depend on GUS team doing work)
- [ ] Get GUS API docs access early
- [ ] Build MVP without GUS dependency to prove value first
- [ ] Escalate to management if GUS team blockers arise

**Probability:** Medium | **Severity:** Medium

---

## 6. Technical Debt & Scalability

### Risk: SQLite → PostgreSQL Migration Issues
**Issue:** Schema differences, data migration bugs, performance surprises

**Impact:** Production launch delayed, data loss, downtime

**Mitigation:**
- [x] Document migration steps in deployment guide ✅
- [ ] Test PostgreSQL locally BEFORE production
- [ ] Write and test data migration script
- [ ] Plan for rollback if migration fails
- [ ] Consider starting fresh in production (no data migration)

**Probability:** Medium | **Severity:** Medium

---

### Risk: Performance at Scale
**Issue:** Tool built/tested with 2-3 demo projects - what about 100 projects?

**Impact:** Slow page loads, timeouts, poor user experience

**Mitigation:**
- [ ] Load test with realistic data (100 projects, 5000 failures)
- [ ] Add database indexes on common queries
- [ ] Implement pagination on project/failure lists
- [ ] Monitor performance in production (response times)
- [ ] Plan for caching if needed (Redis)

**Probability:** Low | **Severity:** Medium

---

### Risk: Browser Compatibility
**Issue:** Built and tested only in Chrome - might break in Firefox/Safari

**Impact:** Some team members can't use tool

**Mitigation:**
- [ ] Test in Firefox, Safari, Edge before launch
- [ ] Use standard web APIs (avoid Chrome-only features)
- [ ] Document supported browsers
- [ ] Add browser detection warning if unsupported

**Probability:** Low | **Severity:** Low

---

## 7. Compliance & Regulatory

### Risk: SOC2/Compliance Audit Requirements
**Issue:** Salesforce might require SOC2 compliance for internal tools

**Impact:** Extensive documentation, security controls, audit trail requirements

**Mitigation:**
- [ ] Ask InfoSec: "Does this need SOC2 compliance?"
- [ ] Implement audit logging early if yes (created_by, updated_by)
- [ ] Document all security controls comprehensively
- [ ] Plan for annual security audits

**Probability:** Low | **Severity:** Medium

---

### Risk: Export Control / Security Issue Handling
**Issue:** If audit documents security vulnerabilities, might need export controls

**Impact:** Can't share ACRs with external parties (agencies, contractors)

**Mitigation:**
- [ ] Clarify with security team: how to handle security-related a11y findings
- [ ] Add watermark to ACRs: "Internal Use Only - Do Not Share"
- [ ] Separate accessibility from security issues in reporting
- [ ] Document escalation path for security-related findings

**Probability:** Very Low | **Severity:** Medium

---

## 8. Feature Gaps (Known Limitations)

### Missing Features That Might Block Adoption

1. **No Offline Mode**
   - Can't audit without internet connection
   - Workaround: Document limitations, require VPN

2. **No Real-Time Collaboration**
   - Multiple auditors can't work on same checklist simultaneously
   - Workaround: Assign pages to specific auditors

3. **No Mobile Support**
   - Can't log failures from mobile device during testing
   - Workaround: Take notes on mobile, log later on desktop

4. **No Revision History**
   - Can't see who changed what when
   - Workaround: Database has updated_at, could build history view later

5. **No Bulk Operations**
   - Can't bulk-edit multiple failures at once
   - Workaround: Edit one at a time (or add feature if requested)

6. **No PDF Export**
   - Only .docx ACR format
   - Workaround: Open .docx, save as PDF manually

7. **No Customizable Templates**
   - ACR format is fixed
   - Workaround: Edit generated .docx after export

**Mitigation Strategy:**
- Document known limitations upfront
- Collect feedback on which gaps matter most
- Prioritize based on actual pain points (not speculation)

---

## 9. Success Metrics & Exit Criteria

To know if the tool is truly accepted, define success metrics:

**Adoption Metrics:**
- [ ] 80% of accessibility team using tool by Month 3
- [ ] At least 5 completed audits logged in tool by Month 2
- [ ] Zero security incidents related to tool

**Satisfaction Metrics:**
- [ ] User satisfaction survey: 4/5 stars or higher
- [ ] <5 critical bugs reported per month after Month 1
- [ ] Time to complete audit reduced by 20% (measure before/after)

**Technical Metrics:**
- [ ] 99% uptime
- [ ] <2 second page load times
- [ ] Zero data loss incidents

**Exit Criteria (When to Abandon/Pivot):**
- If <30% adoption after 3 months → investigate why, pivot or sunset
- If critical security issue cannot be resolved → take offline
- If Salesforce mandates use of different tool → migrate gracefully

---

## 10. Recommended Pre-Launch Actions

### Critical Path (Must Do)
1. [ ] **Survey the team:** "Would you use this? What's missing?"
2. [ ] **Verify Google Drive approval** for storing work artifacts
3. [ ] **Get manager budget approval** for hosting costs
4. [ ] **Cross-train one backup maintainer** (knowledge transfer)
5. [ ] **Test PostgreSQL migration** locally before production

### High Priority (Should Do)
6. [ ] Check for competing tools in organization
7. [ ] Define data retention/deletion policy
8. [ ] Create support channel and issue tracker
9. [ ] Document backup/restore procedure and test it
10. [ ] Load test with realistic data volume

### Medium Priority (Nice to Have)
11. [ ] Create quick-start guide and walkthrough video
12. [ ] Test in multiple browsers
13. [ ] Set up error monitoring (Sentry or similar)
14. [ ] Calculate and document ROI/time savings
15. [ ] Present to accessibility guild for feedback

---

## Summary: Top 5 Biggest Risks

| Risk | Probability | Severity | Mitigation Priority |
|------|-------------|----------|---------------------|
| **1. Low team adoption** (prefer spreadsheets) | Medium | High | **Critical** - Survey team first |
| **2. Google Drive policy conflict** | Medium | High | **Critical** - Verify approval now |
| **3. Single maintainer (you)** | Medium | High | **High** - Cross-train backup |
| **4. Missing critical workflow features** | High | Medium | **High** - Collect requirements |
| **5. GUS API access delays** | High | Medium | **Medium** - Start request early |

---

## Next Steps

**This Week:**
1. Send survey to accessibility team: "Would you use this? What's missing?"
2. Confirm with IT/InfoSec: Is Google Drive approved for work artifacts?
3. Get manager approval for $90/month hosting cost (or commit to internal hosting)

**Before MVP Launch:**
4. Cross-train at least one other engineer on codebase
5. Test PostgreSQL migration locally
6. Create support Slack channel and announce to team

**After MVP Launch:**
7. Monitor adoption metrics weekly
8. Hold feedback session after first 2 completed audits
9. Iterate quickly on top pain points

---

**Document Owner:** Jonathan Bell  
**Last Updated:** 2026-06-19  
**Next Review:** After MVP pilot (recommended: 1 month post-launch)

---

**End of Risk Analysis**
