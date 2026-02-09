---
name: qa-ux-verification
description: Independent QA subagent for visual and UX verification of web pages. This skill should be used when performing UX validation of a deployed web application — checking visual appearance across Desktop/Tablet/Mobile viewports, interactive states (hover, focus, active), content accuracy, user flow completeness, and accessibility basics. The subagent operates with clean context (no knowledge of source code) and thinks as an end user, not a developer. Produces a ux-report.md. Use during Phase 4 (Integration) of the workflow, alongside qa-technical-validation skill. Requires Playwright MCP tools.
---

# QA UX Verification

## Overview

Independent QA subagent that verifies web applications from the **user's perspective**. The subagent checks visual appearance across viewports, interaction states, content accuracy, user flow completeness, and accessibility basics.

**Critical principle:** The subagent works ONLY with the browser and optional checklist. It does NOT read source code. It thinks as an end user — if something looks wrong or feels broken, it IS a bug.

## When to Use

- During Phase 4 (Integration) of the workflow, after deploy to Docker or production server
- When the CLI Integrator needs independent UX verification of a web page
- When running QA validation alongside the `qa-technical-validation` skill (Subagent 1)
- For re-validation after Developer fixes bugs from a previous QA cycle

## Required Tools

- **MCP:** `mcp__playwright__*` (browser_navigate, browser_snapshot, browser_resize, browser_click, browser_hover, browser_type, browser_fill_form, browser_press_key, browser_take_screenshot, browser_tabs)

## Input Parameters

The subagent receives:

```
page_url:       URL of the page to validate (e.g., http://localhost:3000/ or https://domain.com/)
admin_url:      URL of admin panel, if applicable (optional)
checklist_path: Path to checklist file, if available (optional)
output_path:    Where to save the report (e.g., feedbacks/qa-reports/session-1-v1/ux-report.md)
```

## Verification Workflow

Execute all 8 steps sequentially. Take screenshots for every issue found.

### Step 1: Load Checklist and Setup

1. If `checklist_path` is provided, read the checklist file to understand expected behavior
2. Navigate to `page_url` using `mcp__playwright__browser_navigate`
3. Wait for full page load using `mcp__playwright__browser_wait_for`

### Step 2: Visual Audit — Desktop (1920x1080)

1. Resize browser to 1920x1080 using `mcp__playwright__browser_resize`
2. Take a full-page screenshot using `mcp__playwright__browser_take_screenshot` with `fullPage: true`
3. Take an accessibility snapshot using `mcp__playwright__browser_snapshot`

**For each visible element, check:**
- Present on page? (visibility)
- Correct position and layout? (position)
- Correct sizing? (dimensions)
- Correct colors? (colors)
- Correct typography — font, size, weight? (typography)
- Correct spacing and alignment? (spacing)
- Correct text/content? (content)
- Images loaded and not stretched? (images)

**Record** each element with: element name, what was expected, what was found, PASS/FAIL status.

### Step 3: Visual Audit — Tablet (768x1024)

1. Resize browser to 768x1024 using `mcp__playwright__browser_resize`
2. Take a full-page screenshot
3. Take an accessibility snapshot

**Tablet-specific checks:**
- Navigation adapted (burger menu or compact layout)
- Grid restructured (e.g., 3 columns to 2)
- Text readable (not too small)
- Buttons large enough for touch (min 44x44px)
- No horizontal scroll
- Images scaled proportionally

**Record** responsive issues with: element, issue description, severity (HIGH/MEDIUM/LOW).

### Step 4: Visual Audit — Mobile (375x812)

1. Resize browser to 375x812 using `mcp__playwright__browser_resize`
2. Take a full-page screenshot
3. Take an accessibility snapshot

**Mobile-specific checks:**
- Burger menu works
- Elements in single column
- Touch targets >= 44px
- Forms comfortable to fill on mobile
- Important content visible above the fold (especially CTA)
- Buttons full-width if designed that way
- Font size readable (min 14px for body text)
- No content overflow or clipping

**Record** responsive issues with severity. CTA not visible above fold is CRITICAL.

### Step 5: Interactions and Micro-interactions

Test interactive states for all interactive elements.

**For buttons:**
1. Hover over element using `mcp__playwright__browser_hover` — check for hover effect
2. Click element using `mcp__playwright__browser_click` — check for active/pressed state
3. Tab to element using `mcp__playwright__browser_press_key` with key `Tab` — check for focus ring

**For form inputs:**
1. Click to focus — check for focus style
2. Type text — check that text is readable
3. Submit empty/invalid — check for error states and messages
4. Fill valid data — check that field accepts it

**For links:**
- Hover shows visual change
- Click navigates correctly

**For cards/list items:**
- Hover shows elevation/shadow change (if designed)

**Record per element:** element name, which states exist (normal, hover, active, focus, disabled), which states are missing, PASS/FAIL.

### Step 6: Content Verification

**Check all text content against checklist or admin panel:**

1. If `admin_url` provided:
   - Open admin in new tab using `mcp__playwright__browser_tabs` + `mcp__playwright__browser_navigate`
   - Compare admin values with frontend values
   - Record mismatches

2. General content checks:
   - No typos in visible text
   - No Lorem ipsum or placeholder text
   - Correct currency symbols and number formatting
   - Correct date/time formatting
   - Words not broken awkwardly by line wrapping

**Record** each content item: element, expected text/source, actual text, match (yes/no).

### Step 7: User Flow Testing

**Walk through main user flows from checklist or by discovering page actions:**

For each flow:
1. Start at the beginning action
2. Execute each step using appropriate Playwright tools (click, type, select)
3. Take a screenshot after each step
4. Verify expected outcome matches actual outcome
5. Note where flow breaks or becomes confusing

**Record per flow:**
- Flow name and description
- Each step: action taken, expected result, actual result, visual OK (yes/no)
- Overall status: PASS / FAIL
- If FAIL: which step blocks progress

A broken user flow is always CRITICAL severity.

### Step 8: Accessibility Quick Check

**Basic accessibility checks:**

1. **Color contrast:**
   - Check main body text contrast against background
   - Check button text contrast
   - Check link text contrast
   - Target: WCAG AA (4.5:1 for normal text, 3:1 for large text)

2. **Keyboard navigation:**
   - Tab through all interactive elements using `mcp__playwright__browser_press_key`
   - Verify tab order is logical (top-to-bottom, left-to-right)
   - Verify all interactive elements are reachable
   - Verify focus is visible on every element

3. **Screen reader basics:**
   - Use `mcp__playwright__browser_snapshot` to check accessibility tree
   - Verify images have alt text
   - Verify forms have labels
   - Verify buttons have clear text or aria-label
   - Verify headings are hierarchical (h1 then h2 then h3)

4. **Touch targets:**
   - All clickable elements >= 44x44px on mobile
   - Sufficient spacing between clickable elements

**Record** each check: what was tested, requirement, actual state, PASS/FAIL.

## Output

### Report Format

Read the template from `references/ux-report-template.md` and fill it with collected data.

### Save Location

Save the completed report to the path specified in `output_path`:
```
feedbacks/qa-reports/session-{N}-v{X}/ux-report.md
```

### Classification Rules

- **Critical:** User cannot complete main action (broken flow, CTA invisible on mobile, page layout broken)
- **Medium:** User experience noticeably degraded (no hover states, content clipped, poor contrast)
- **Minor:** Cosmetic issues (missing slider indicators, small spacing inconsistencies, missing alt texts)

## Core Rules

1. **Think as a user** — not as a developer; if it looks wrong, it IS wrong
2. **Visual precision** — if something looks "slightly off", it is a bug
3. **Screenshots mandatory** — for every issue found
4. **Compare with checklist** — do not invent requirements; verify against provided expectations
5. **Prioritize by user impact** — what hurts users the most comes first
6. **Test real scenarios** — walk through actual user flows, not abstract edge cases
7. **Do not read source code** — observe only browser behavior
8. **Do not fix anything** — document and report, that is all

## Resources

### references/

- `ux-report-template.md` — Markdown template for the UX verification report. Read this template and fill it with findings from the verification workflow.
