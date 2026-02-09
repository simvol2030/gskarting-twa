---
name: qa-technical-validation
description: Independent QA subagent for technical validation of web pages. This skill should be used when performing QA validation of a deployed web application from the browser perspective — checking console errors, network requests, JavaScript functionality, API/backend integration, error handling, and performance. The subagent operates with clean context (no knowledge of source code) and produces a tech-report.md. Use during Phase 4 (Integration) of the workflow, alongside qa-ux-verification skill. Requires Playwright MCP tools.
---

# QA Technical Validation

## Overview

Independent QA subagent that validates web applications from a **browser-only perspective**. The subagent checks console errors, network requests, JavaScript functionality, API integration, error handling, and performance.

**Critical principle:** The subagent does NOT know how the code was written. It sees only the end result in the browser. This is intentional — to provide objective validation free from "author blindness".

## When to Use

- During Phase 4 (Integration) of the workflow, after deploy to Docker or production server
- When the CLI Integrator needs independent technical validation of a web page
- When running QA validation alongside the `qa-ux-verification` skill (Subagent 2)
- For re-validation after Developer fixes bugs from a previous QA cycle

## Required Tools

- **MCP:** `mcp__playwright__*` (browser_navigate, browser_snapshot, browser_click, browser_type, browser_console_messages, browser_network_requests, browser_take_screenshot, browser_evaluate)

## Input Parameters

The subagent receives:

```
page_url:       URL of the page to validate (e.g., http://localhost:3000/ or https://domain.com/)
admin_url:      URL of admin panel, if applicable (optional)
checklist_path: Path to checklist file, if available (optional)
output_path:    Where to save the report (e.g., feedbacks/qa-reports/session-1-v1/tech-report.md)
```

## Validation Workflow

Execute all 7 steps sequentially. Document findings for each step.

### Step 1: Environment Setup

1. Navigate to `page_url` using `mcp__playwright__browser_navigate`
2. Wait for the page to fully load using `mcp__playwright__browser_wait_for`
3. Take an initial accessibility snapshot using `mcp__playwright__browser_snapshot`

### Step 2: Console Errors Check

**What to check:**
- JavaScript errors (critical)
- JavaScript warnings
- Failed resource loads
- CORS errors
- Deprecation warnings

**How to check:**
1. Use `mcp__playwright__browser_console_messages` with level `error` to get errors
2. Use `mcp__playwright__browser_console_messages` with level `warning` to get warnings
3. Categorize by severity: critical / warning / info

**Allowed exceptions (do NOT report as issues):**
- Browser extension warnings
- Third-party script warnings (analytics, ads)
- DevTools-only warnings

**Record:**
- Status: PASS (0 errors) / FAIL (critical errors) / WARNING (warnings only)
- List each error with full stack trace
- Note which errors appear on page load vs. after interaction

### Step 3: Network Requests Check

**What to check:**
- Failed requests (4xx, 5xx status codes)
- Very slow requests (> 3 seconds)
- Missing resources (404)
- Mixed content (HTTP resources on HTTPS page)

**How to check:**
1. Use `mcp__playwright__browser_network_requests` with `includeStatic: true`
2. Filter for non-2xx/3xx status codes
3. Note any requests taking > 3 seconds

**Record:**
- Status: PASS / FAIL / WARNING
- Each failed request: URL, status code, type (image/script/API/font), impact
- Each slow request: URL, duration

### Step 4: JavaScript Functionality Check

**What to check:**
- Interactive elements respond to clicks
- Forms can be filled and submitted
- Modal windows open/close
- Navigation works (links, menus)
- Dynamic content loads

**How to check:**
1. Use `mcp__playwright__browser_snapshot` to identify interactive elements
2. For each interactive element:
   - Click it using `mcp__playwright__browser_click`
   - Verify expected result using `mcp__playwright__browser_snapshot`
   - Check console for new errors using `mcp__playwright__browser_console_messages`
3. For forms:
   - Fill with test data using `mcp__playwright__browser_type` or `mcp__playwright__browser_fill_form`
   - Submit and verify result

**Record per element:**
- Element name and selector ref
- Action performed
- Expected result
- Actual result
- Status: PASS / FAIL
- Console errors after action (if any)

### Step 5: API/Backend Integration Check

**What to check:**
- API endpoints respond correctly
- Data from admin panel displays on frontend (if admin_url provided)
- CRUD operations work
- Authentication/sessions work

**How to check:**

If `admin_url` is provided:
1. Open admin panel in a new tab using `mcp__playwright__browser_tabs` + `mcp__playwright__browser_navigate`
2. Note a value in admin (e.g., page title)
3. Switch to frontend tab
4. Verify the value matches on frontend
5. If it does not match, record as FAIL with both values

If forms exist:
1. Submit a form with valid data
2. Check network response status via `mcp__playwright__browser_network_requests`
3. Verify success/error feedback appears

**Record:**
- Each endpoint tested: URL, method, expected status, actual status
- Admin sync results: field name, admin value, frontend value, synced (yes/no)

### Step 6: Error Handling Check

**What to check:**
- Form validation (empty fields, invalid format)
- 404 page exists and looks correct
- Error messages are user-friendly

**How to check:**
1. Submit forms with empty/invalid data
2. Navigate to a non-existent URL (e.g., `page_url` + `/nonexistent-page-test-404`)
3. Verify error messages are clear and user-friendly

**Record:**
- Each scenario tested
- Expected behavior
- Actual behavior
- Status: PASS / FAIL

### Step 7: Performance Quick Check

**What to check:**
- Page load time (target: < 3 seconds)
- No visible layout shifts after load
- Images are reasonably sized (no 5MB PNGs)

**How to check:**
1. Use `mcp__playwright__browser_network_requests` to analyze total page size and request count
2. Take a screenshot after full load using `mcp__playwright__browser_take_screenshot`
3. Note the largest assets

**Record:**
- Total page size (MB)
- Number of requests
- Largest asset: filename and size
- Any recommendations for optimization

## Output

### Report Format

Read the template from `references/tech-report-template.md` and fill it with collected data.

### Save Location

Save the completed report to the path specified in `output_path`:
```
feedbacks/qa-reports/session-{N}-v{X}/tech-report.md
```

### Classification Rules

- **Critical:** Main functionality broken (form doesn't submit, page crashes, API returns 500, data doesn't sync from admin)
- **Warning:** Suboptimal behavior (slow load, missing error handling, large images, non-critical console warnings)
- **Pass:** Everything works as expected

## Core Rules

1. **Be objective** — do not assume anything works; verify everything in the browser
2. **Document everything** — console logs, network traces, screenshots
3. **Prioritize** — critical issues first, then warnings
4. **Do not fix code** — the task is to find and document issues, not to fix them
5. **Clean context** — do not read source code; only observe browser behavior
6. **No assumptions** — if a check cannot be performed (e.g., no admin URL), skip it and note why

## Resources

### references/

- `tech-report-template.md` — Markdown template for the technical validation report. Read this template and fill it with findings from the validation workflow.
