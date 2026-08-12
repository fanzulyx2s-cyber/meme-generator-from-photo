# Mistral Emergency Caption Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one server-only Mistral vision fallback after the complete Gemini caption chain fails.

**Architecture:** Implement a focused `MistralCaptionProvider` behind the existing provider factory and call it serially from the existing request handler only after Gemini fallback failure. Reuse the existing prompt, image bytes, JSON schema, Zod parser, cancellation, diagnostics, and response contract.

**Tech Stack:** TypeScript, Next.js Route Handler, native fetch, Zod, Vitest, Playwright.

---

### Task 1: Specify provider behavior with failing tests

**Files:**
- Create: `src/lib/ai/captions/__tests__/mistral-caption-provider.test.ts`
- Modify: `src/lib/ai/captions/__tests__/create-caption-provider.test.ts`

- [ ] Test the exact endpoint, bearer header, model, text/image content, JSON schema mode, five-caption parsing, timeout, 429/5xx, invalid JSON, and invalid schema.
- [ ] Run the focused tests and confirm failure because the provider does not exist.

### Task 2: Implement the Mistral provider

**Files:**
- Create: `src/lib/ai/captions/providers/mistral-caption-provider.ts`
- Modify: `src/lib/ai/captions/create-caption-provider.ts`
- Modify: `src/lib/ai/captions/types.ts`
- Modify: `src/lib/ai/captions/diagnostics.ts`

- [ ] Build one abortable REST request with the existing prompt and image.
- [ ] Parse only `choices[0].message.content`, then use JSON.parse and the existing Zod parser.
- [ ] Map failures to safe existing error codes and emit only allowlisted diagnostics.
- [ ] Run focused provider tests to green.

### Task 3: Specify and implement terminal orchestration

**Files:**
- Modify: `src/lib/ai/captions/__tests__/request-handler.test.ts`
- Modify: `src/lib/ai/captions/config.ts`
- Modify: `src/lib/ai/captions/request-handler.ts`
- Modify: `src/lib/ai/captions/client.ts`
- Modify: `src/app/api/ai-meme-captions/route.ts`

- [ ] Write failing tests proving Gemini success/retry never call Mistral, Gemini fallback failure calls Mistral once, and all-provider failure remains safe.
- [ ] Extend configuration with a server-only Mistral key presence/value and fixed model.
- [ ] Add one serial Mistral call after actual Gemini fallback failure, with no Mistral retry.
- [ ] Set budgets to provider 15s, server 55s, browser 58s, and route 60s.
- [ ] Run focused tests to green and confirm the normal frontend payload remains `{ captions }`.

### Task 4: Verify and deliver

**Files:**
- Modify: `docs/AI_CAPTION_RELIABILITY_HANDOFF.md`

- [ ] Run `npm.cmd run test:ai`.
- [ ] Run `npm.cmd run lint` and `npx.cmd eslint src`.
- [ ] Run `npx.cmd tsc --noEmit --incremental false` and `npm.cmd run build`.
- [ ] Run localhost Playwright with mocked provider behavior.
- [ ] Security-scan the diff, commit, and push only `feature/seo-gemini-final`.
- [ ] Wait for the matching Git Integration Preview, verify target/commit, and run Preview Playwright.
- [ ] Only after every gate, use at most two real Mistral calls if Preview secrets and access make the authorized E2E possible.
