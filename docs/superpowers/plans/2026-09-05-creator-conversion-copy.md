# Creator Conversion Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify the Creator one-time purchase and License Key activation path without changing payments, pricing, entitlements, or data collection.

**Architecture:** Keep the change in existing client and static page copy. The upgrade dialog explains the offer, the pricing page gives checkout context, and the success page gives activation instructions. No API route, environment variable, analytics event, or provider integration changes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, ESLint.

---

### Task 1: Lock the upgraded dialog wording with a regression test

**Files:**
- Modify: `src/components/__tests__/meme-generator-export.test.tsx:53-70`
- Modify: `src/components/meme-generator.tsx:2727-2745`

- [x] **Step 1: Write the failing test**

Add this assertion after the existing dialog visibility assertion:

```tsx
expect(screen.getByText("$9 one-time purchase — not a subscription.")).toBeVisible();
```

- [x] **Step 2: Run test to verify it fails**

Run `npx.cmd vitest run src/components/__tests__/meme-generator-export.test.tsx`.
Expected: FAIL because the sentence is not rendered.

- [x] **Step 3: Write minimal implementation**

Insert directly after the current dialog benefit paragraph:

```tsx
<p className="mt-3 text-sm font-bold text-zinc-700">
  $9 one-time purchase — not a subscription.
</p>
```

Do not modify actions, price, checkout URL, or entitlement logic.

- [x] **Step 4: Run test to verify it passes**

Run `npx.cmd vitest run src/components/__tests__/meme-generator-export.test.tsx`.
Expected: PASS, including `Continue with Free` dismissal.

### Task 2: Clarify checkout and activation on the pricing page

**Files:**
- Modify: `src/app/pricing/page.tsx:35-72`

- [x] **Step 1: Update the Creator plan copy**

Render this only below the Creator checkout button:

```tsx
<p className="relative mt-3 max-w-sm text-xs font-semibold leading-5 text-zinc-700">
  Secure checkout by Creem. After payment, your License Key is sent by email.
</p>
```

- [x] **Step 2: Add an activation FAQ answer**

Append:

```tsx
{
  question: "How do I activate Creator after purchase?",
  answer:
    "Open the Creem purchase email, copy the License Key, then return to MemePhoto AI and paste it into the Creator License panel. Your license can be activated on up to 3 browsers.",
},
```

Do not claim account login or automatic cross-device restoration.

- [x] **Step 3: Verify static page compilation**

Run `npx.cmd tsc --noEmit --incremental false`.
Expected: PASS.

### Task 3: Make post-purchase activation steps scannable

**Files:**
- Modify: `src/app/success/page.tsx:34-52`

- [x] **Step 1: Replace the activation paragraph with an ordered list**

Use:

```tsx
<ol className="relative mt-5 list-decimal space-y-2 pl-6 text-lg font-semibold leading-8 text-zinc-600">
  <li>Open the Creem purchase email.</li>
  <li>Copy your License Key.</li>
  <li>Return to MemePhoto AI and paste it into the Creator License panel.</li>
</ol>
```

Then add:

```tsx
<p className="relative mt-4 max-w-2xl text-sm font-semibold leading-6 text-zinc-600">
  Your Creator license can be activated on up to 3 browsers.
</p>
```

Keep the support and return links unchanged.

- [x] **Step 2: Run lint and type checks**

Run `npm.cmd run lint` and `npx.cmd tsc --noEmit --incremental false`.
Expected: both exit 0; distinguish pre-existing warnings if any.

### Task 4: Run full verification and commit the feature branch

**Files:**
- Modify: `docs/superpowers/plans/2026-09-05-creator-conversion-copy.md`

- [x] **Step 1: Run full verification**

Run `npm.cmd run test:ai`, `npm.cmd run lint`, `npx.cmd tsc --noEmit --incremental false`, `npm.cmd run build`, and `git diff --check`.
Expected: all exit 0.

- [x] **Step 2: Audit final scope**

Only these feature files may differ: the plan, `src/components/__tests__/meme-generator-export.test.tsx`, `src/components/meme-generator.tsx`, `src/app/pricing/page.tsx`, and `src/app/success/page.tsx`. Do not include `.env*`, output files, secrets, payment configuration, or unrelated edits.

- [x] **Step 3: Commit only scoped files**

Run `git add docs/superpowers/plans/2026-09-05-creator-conversion-copy.md src/components/__tests__/meme-generator-export.test.tsx src/components/meme-generator.tsx src/app/pricing/page.tsx src/app/success/page.tsx` followed by `git commit -m "feat: clarify Creator purchase and activation"`.
Expected: one local feature-branch commit. Do not push, merge, deploy, or change Production configuration.
