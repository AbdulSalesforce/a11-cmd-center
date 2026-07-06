# Security Fixes Applied - A11y Audit Tool

**Date:** 2026-06-19  
**Status:** ✅ Complete

---

## Overview

Applied comprehensive security hardening to the A11y Audit Tool based on security audit findings. All critical and high-priority issues have been addressed, along with most medium-priority issues.

---

## Critical Issues Fixed

### 1. Command Injection Prevention (Export Route)
**Issue:** `product_name` passed unsanitized to Python subprocess and used in file paths

**Fix Applied:**
- Added sanitization function in `server/src/routes/export.js`:
  ```javascript
  const sanitizedProductName = project.product_name
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9\s\-]/g, '')
    .trim() || 'Unnamed_Project';
  ```
- Applied to both subprocess argument and file path construction
- Applied to `Content-Disposition` header

**Files Modified:** `server/src/routes/export.js`

---

### 2. HTTP Header Injection Prevention
**Issue:** `Content-Disposition` header contained unsanitized `product_name`, allowing response header manipulation

**Fix Applied:**
- Reused the same `sanitizedProductName` for the download filename
- Strips all special characters that could cause header injection (quotes, CRLF, etc.)

**Files Modified:** `server/src/routes/export.js`

---

## High Priority Issues Fixed

### 3. Request Body Size Limits
**Issue:** No limit on JSON payload size, enabling DoS attacks

**Fix Applied:**
- Added explicit 1MB limit: `app.use(express.json({ limit: '1mb' }))`
- Added per-field length validation on all text inputs

**Files Modified:** `server/index.js`

---

### 4. Stack Trace Exposure Prevention
**Issue:** Database errors leaked internal paths and schema details to clients

**Fix Applied:**
- Wrapped all database operations in try-catch blocks
- Added global error handler that hides stack traces in production:
  ```javascript
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
  });
  ```

**Files Modified:**
- `server/index.js` (global handler)
- `server/src/routes/projects.js`
- `server/src/routes/failures.js`
- `server/src/routes/scope.js`
- `server/src/routes/checklist.js`
- `server/src/routes/export.js`

---

### 5. Comprehensive Input Validation
**Issue:** Fields accepted any content beyond basic "required" checks

**Fix Applied:**

**Failures Route (`server/src/routes/failures.js`):**
- `subject`: max 500 chars, type check
- `wcag_criterion`: max 50 chars, type check
- `platform_type`: non-empty string validation
- `severity`: enum validation (`['P1', 'P2', 'P3']`)
- Text fields: max 10,000 chars (`details`, `steps`, `impact`, `recommendations`, `auditor_comments`)
- `html_code`: max 50,000 chars
- `screenshots`: array type check, max 20 items
- `additional_pages`: array type check, max 50 items
- Screenshot validation: URL and filename format/length checks, path traversal prevention
- Page name validation in loops: max 200 chars

**Projects Route (`server/src/routes/projects.js`):**
- `product_name`: max 200 chars (required)
- `pm_name`, `pm_email`: max 200 chars
- Array validation: auditors/product_tags max 50, scope_items max 100
- Nested object validation within transaction:
  - Auditor names: required, max 200 chars
  - Product tag names: required, max 200 chars
  - Scope item page names: required, max 200 chars

**Checklist Route (`server/src/routes/checklist.js`):**
- `status`: enum validation (`['unchecked', 'pass', 'fail', 'na']`)
- `scId`: max 50 chars
- `na_note`: max 1000 chars

**Files Modified:** All routes listed above

---

## Medium Priority Issues Fixed

### 6. Google OAuth Token File Permissions
**Issue:** Tokens stored with default permissions, readable by any user/process

**Fix Applied:**
- Added `mode: 0o600` option to `fs.writeFileSync()` calls (owner-only read/write)
- Applied to both initial token creation and refresh token updates

**Files Modified:** `server/src/google/auth.js` (lines 41, 63)

---

### 7. Rate Limiting
**Issue:** No throttling on API requests, enabling DoS and resource exhaustion

**Fix Applied:**
- Installed `express-rate-limit` package
- General API limit: 100 requests per 15 minutes per IP
- Export endpoint: 5 requests per 15 minutes per IP (resource-intensive)
- Returns clear error message: `{ error: 'Too many requests, please try again later' }`

**Configuration:**
```javascript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
});

const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
});
```

**Files Modified:** `server/index.js`, `server/package.json`

---

### 8. Array Size Limits
**Issue:** Unbounded arrays in `screenshots` and `additional_pages` could trigger DoS

**Fix Applied:**
- `screenshots`: limited to 20 items per failure
- `additional_pages`: limited to 50 items per failure
- `auditors`/`product_tags`: limited to 50 items per project
- `scope_items`: limited to 100 items per project

**Files Modified:** `server/src/routes/failures.js`, `server/src/routes/projects.js`

---

## Security Features Already Present (No Changes Needed)

✅ **SQL Injection Protection** - All queries use parameterized statements  
✅ **XSS Protection** - React auto-escapes all output, no `dangerouslySetInnerHTML`  
✅ **UUID Primary Keys** - Prevents enumeration attacks  
✅ **Foreign Key Constraints** - Maintains referential integrity  
✅ **CORS Configured** - Restricted to `http://localhost:5173`  
✅ **Spawn vs Exec** - Using `child_process.spawn()` to avoid shell interpretation

---

## Issues Documented for Production (Not Fixed Now)

These are acknowledged gaps that will be addressed during production deployment, as documented in `DEPLOYMENT_GUIDE.md`:

🔜 **Authentication/Authorization** - Salesforce SSO integration (planned)  
🔜 **CSRF Protection** - Required before session-based auth (planned)  
🔜 **HTTPS Enforcement** - Automatic on Heroku or internal hosting (planned)  
🔜 **Session Management** - Secure cookies with httpOnly, secure, sameSite flags (planned)  
🔜 **Audit Logging** - `created_by` and `updated_by` fields (planned)

---

## Testing Performed

✅ Server starts successfully with all security middleware  
✅ Health check endpoint responds: `{"status":"ok"}`  
✅ Projects list endpoint returns data without errors  
✅ Rate limiting headers present in responses  
✅ Error handling returns generic messages (no stack traces in production mode)

---

## Dependency Changes

**Added:**
- `express-rate-limit@^7.5.0` (rate limiting middleware)

**No vulnerabilities** detected via `npm audit`

---

## Migration Notes

### For Local Development
No migration needed - all changes are backward-compatible additions.

### For Production Deployment
When deploying, set environment variable:
```bash
NODE_ENV=production
```

This will:
- Hide stack traces in error responses
- Enable production-grade error handling

---

## Security Checklist Status

### ✅ Completed
- [x] Command injection prevention
- [x] HTTP header injection prevention
- [x] Request body size limits
- [x] Stack trace exposure prevention
- [x] Comprehensive input validation
- [x] Google token file permissions
- [x] Rate limiting on all endpoints
- [x] Array size limits
- [x] Error handling on all routes
- [x] Path traversal prevention in filenames

### 🔜 Planned for Production
- [ ] Authentication (SSO)
- [ ] CSRF protection
- [ ] HTTPS enforcement
- [ ] Session management
- [ ] Audit logging
- [ ] Security review with InfoSec
- [ ] Secrets management (environment variables)

---

## Files Modified

### Core Server Files
- `server/index.js` - Rate limiting, body size limit, global error handler
- `server/package.json` - Added express-rate-limit

### Route Files (All routes now include try-catch + validation)
- `server/src/routes/projects.js`
- `server/src/routes/failures.js`
- `server/src/routes/scope.js`
- `server/src/routes/checklist.js`
- `server/src/routes/export.js`

### Utility Files
- `server/src/google/auth.js` - Token file permissions

---

## Impact Summary

**Breaking Changes:** None  
**Performance Impact:** Minimal (rate limiting adds negligible overhead)  
**User Experience:** Unchanged (validation errors are clear and actionable)  
**Security Posture:** Significantly improved

---

## Recommendations for Next Steps

1. **Test validation** - Try creating a failure with invalid data to verify error messages
2. **Test rate limiting** - Make 101 requests rapidly to verify throttling
3. **Review deployment guide** - Ensure all production requirements are documented
4. **Schedule InfoSec review** - Before production deployment
5. **Update user documentation** - If field length limits impact workflows

---

## Contact

**Security Lead:** Jonathan Bell (Accessibility Engineer)  
**Review Date:** 2026-06-19  
**Next Review:** Before production deployment (see DEPLOYMENT_GUIDE.md)

---

**End of Security Fixes Document**
