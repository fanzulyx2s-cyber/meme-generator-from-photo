# GA4 Anonymous Conversion Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional GA4 tracking for the anonymous Creator conversion funnel without collecting user content or changing checkout behavior.

**Architecture:** A client analytics module validates `NEXT_PUBLIC_GA_MEASUREMENT_ID`, loads Google gtag.js once only when the ID is valid, and exposes a typed allowlist. A root client component initializes that module; existing UI sends the four defined funnel events. Missing configuration means no script and no event request.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing Library, Google gtag.js.

---

### Task 1: Optional, typed GA4 boundary

**Files:**
- Create: `src/lib/analytics/ga4.ts`
- Create: `src/lib/analytics/__tests__/ga4.test.ts`
- Modify: `package.json`

- [x] **Step 1: Write the failing module tests.** Assert empty or malformed `NEXT_PUBLIC_GA_MEASUREMENT_ID` causes `initializeGa4()` and `trackCreatorConversion("creator_upgrade_shown")` to leave `document.querySelector("script[data-ga4]")` null and `window.dataLayer` undefined. Assert `G-ABC1234` inserts exactly one `script[data-ga4]` and `trackCreatorConversion("creator_checkout_clicked", { source: "pricing_page" })` queues only `["event", "creator_checkout_clicked", { source: "pricing_page" }]`.

- [x] **Step 2: Run `npx.cmd vitest run src/lib/analytics/__tests__/ga4.test.ts --reporter=dot`.** The focused tests pass after implementation.

- [x] **Step 3: Implement `ga4.ts`.** Define `CreatorConversionEvent` as exactly `creator_upgrade_shown | creator_checkout_clicked | creator_activation_opened | creator_purchase_success_viewed`; define `CheckoutSource` as exactly `pricing_page | creator_license_panel`. Validate IDs with `/^G-[A-Z0-9]{6,}$/i`; only valid IDs initialize `window.dataLayer`, queue `js` and `config` with `{ send_page_view: true }`, and append one encoded gtag.js script. The tracking function accepts no arbitrary attributes and returns without effects on server or invalid configuration.

- [x] **Step 4: Add `src/lib/analytics` to the existing explicit `test:ai` Vitest paths in `package.json`, preserving every existing path. Run the focused test and `npm.cmd run test:ai -- --reporter=dot`; both pass.**

- [x] **Step 5: Commit with `git add src/lib/analytics/ga4.ts src/lib/analytics/__tests__/ga4.test.ts package.json` and `git commit -m "feat: add optional GA4 analytics client"`.**

### Task 2: Instrument only the defined funnel actions

**Files:**
- Create: `src/components/google-analytics.tsx`
- Create: `src/components/__tests__/creator-conversion-events.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/success/page.tsx`
- Modify: `src/components/creator-checkout-button.tsx`
- Modify: `src/components/creator-license-panel.tsx`
- Modify: `src/components/meme-generator.tsx`
- Modify: `src/components/__tests__/meme-generator-export.test.tsx`

- [x] **Step 1: Write focused mocked tests.** The tests assert the four allowlisted actions and use only an invalid example checkout URL; they do not use real keys, email, License Keys, images, or payment data.

- [x] **Step 2: Run `npx.cmd vitest run src/components/__tests__/meme-generator-export.test.tsx src/components/__tests__/creator-conversion-events.test.tsx --reporter=dot`.** The focused tests pass after implementation.

- [x] **Step 3: Create `GoogleAnalytics` and `ConversionEventTracker` client components.** `GoogleAnalytics` runs `initializeGa4()` once in `useEffect`; `ConversionEventTracker` accepts typed `CreatorConversionEvent` and runs `trackCreatorConversion(event)` in `useEffect`. Add `GoogleAnalytics` in root layout and add the success tracker to `/success`.

- [x] **Step 4: Add only these calls.** Before opening the third free-export dialog, call `trackCreatorConversion("creator_upgrade_shown")`. Immediately before real Creator checkout navigation from pricing, call `trackCreatorConversion("creator_checkout_clicked", { source: "pricing_page" })`. On Creator license-panel mount, call `trackCreatorConversion("creator_activation_opened")`. Immediately before license-panel checkout navigation, call `trackCreatorConversion("creator_checkout_clicked", { source: "creator_license_panel" })`. No excluded actions are instrumented.

- [x] **Step 5: Run the focused tests and commit.** The focused command passes; the commit is prepared after final diff audit.

### Task 3: Privacy disclosure, verification, and PR

**Files:**
- Modify: `src/app/privacy/page.tsx`

- [x] **Step 1: Replace the short Cookies and Analytics paragraph.** State GA4 may be enabled for anonymous page usage and the four funnel actions: upgrade-prompt display, checkout click, activation-panel display, and success-page view. State photos, image data, caption text, email addresses, License Keys, payment cards, order references, and user-entered content are not sent as GA4 event data. Retain the no advertising cookies/no behavioral advertising statement.

- [x] **Step 2: Run `npm.cmd run test:ai -- --reporter=dot`, `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false`, `npm.cmd run build`, and `git diff --check`.** Tests (214), lint, TypeScript, build, and whitespace check pass. The only test-environment output is JSDOM's expected navigation notice from assigning an invalid example checkout URL; it is not a production request.

- [ ] **Step 3: Audit and publish only the feature branch.** Check `git diff main...HEAD --stat` and `git status --short`; confirm no `.env*`, measurement ID, arbitrary payload, dependency addition, or Creem flow change. Commit Privacy and this plan with `docs: disclose optional GA4 analytics`; push `feat/ga4-conversion-analytics`; create a PR; wait for CI and Preview. Do not configure GA4, modify Vercel variables, merge, or deploy Production.
