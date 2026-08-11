# AI Caption Reliability Handoff

Date: 2026-08-11

Branch: `feature/seo-gemini-final`

Baseline: `714e88a02ca08b49e211ac34203fb4d6c9a93823`

## Scope

This checkpoint hardens the existing Gemini caption path without changing the prompt, response schema, model strategy, privacy consent flow, image compression behavior, payment code, or production configuration.

## Final request policy

- Primary model: `gemini-3.5-flash-lite`.
- Fallback model: `gemini-3.1-flash-lite`.
- A primary request may be retried once after HTTP 500, 502, 503, or a network failure with no HTTP response.
- HTTP 504 and an attempt timeout skip the same-model retry and go directly to the single fallback attempt.
- Invalid HTTP 200 content (missing candidates/parts, invalid JSON, or failed Zod validation) goes directly to the single fallback attempt.
- HTTP 400, 401, 403, 429, local image validation errors, safety blocks, and user cancellation never retry or fallback automatically.
- The fallback model is attempted at most once and is never retried.
- Maximum upstream attempts for one user action: three (primary, one primary retry, one fallback).
- Normal successful browser response remains exactly `{ captions }`.

## Time budgets and cancellation

- Provider attempt cap: 15 seconds.
- Server request budget: 38 seconds.
- Browser request budget: 42 seconds.
- Vercel route maximum duration: 45 seconds.
- The request AbortSignal is propagated from the route through the handler to the active Gemini fetch.
- A browser deadline is reported as a timeout; an explicit caller abort remains a cancellation.

## UI and diagnostics

- The caption panel has a synchronous in-flight guard, preventing rapid repeated clicks from starting parallel compression or API requests.
- Existing Retry preserves the selected local image and style.
- Structured diagnostics record only safe fields such as model role, upstream/local status, elapsed time, error type, retry/fallback state, and final outcome.
- Diagnostics do not contain API keys, image bytes, Base64, prompts, request bodies, or raw Gemini responses.

## Verification at this checkpoint

- AI tests: 153/153 passed, skip 0.
- Lint: 0 errors; four pre-existing unused-function warnings remain in the unchanged `meme-generator.tsx`.
- Standalone ESLint: 0 errors; same four pre-existing warnings.
- TypeScript: passed.
- Next.js build: passed with all expected routes.
- Local Playwright with a mocked API: passed.
  - Expected Retry path: HTTP 502 then HTTP 200.
  - Rapid double click produced one initial API request.
  - Five captions were rendered and `Use This Caption` completed.
  - Square, Portrait, and Story with Frame On/Off were captured with no unexpected console or network failures.
- No real Gemini request was made during implementation or local browser verification.

## Remaining release gates

1. Commit and push only `feature/seo-gemini-final`.
2. Wait for the Vercel Preview deployment to become Ready.
3. Run the same non-destructive browser checks against Preview.
4. Only after those gates, perform no more than three authorized real Gemini caption requests using a non-user test image and the approved cost ceiling.
5. Do not merge `main` or change Production settings.
