# Gemini Generate Content REST Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Gemini caption provider from the SDK Interactions call to server-side Generate Content REST while preserving its public interface and validation path.

**Architecture:** The provider receives the existing API key, model, timeout, diagnostics, and caption input. It builds one REST `fetch` request with text and inline-image parts, then extracts `candidates[0].content.parts` text and passes parsed JSON to existing Zod validation.

**Tech Stack:** TypeScript, Node.js fetch/AbortController, Vitest.

---

### Task 1: REST request contract tests

**Files:**
- Modify: `src/lib/ai/captions/__tests__/gemini-caption-provider.test.ts`

- [ ] Replace Interaction-client tests with mock-fetch tests that require a POST to the exact Generate Content model endpoint, key only in `x-goog-api-key`, `contents`, `systemInstruction`, JSON schema generation config, inline data, and `store: false`.
- [ ] Add response tests for candidate-part extraction, invalid/missing text, invalid JSON/Zod output, five-caption enforcement, HTTP error mapping, and one fetch attempt.
- [ ] Run the target test and verify it fails because the current provider calls `interactions.create`.

### Task 2: REST provider implementation

**Files:**
- Modify: `src/lib/ai/captions/providers/gemini-caption-provider.ts`

- [ ] Remove the SDK Interaction client usage and inject an optional server `fetch` implementation for tests.
- [ ] Build one aborted-on-timeout fetch request, without retries or Files API calls; use `x-goog-api-key` and no key in the URL.
- [ ] Extract all string `candidates[0].content.parts[*].text` values, parse JSON, then delegate exact-five validation to `parseGenerateCaptionsResult`.
- [ ] Run target tests and confirm they pass.

### Task 3: Full verification

- [ ] Run the project test, lint, TypeScript, and build commands; do not make a real provider call, commit, push, or deploy.
