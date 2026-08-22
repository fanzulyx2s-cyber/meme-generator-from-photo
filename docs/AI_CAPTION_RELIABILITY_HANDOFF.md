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

## Mistral emergency provider checkpoint — 2026-08-13

- Emergency provider: Mistral Chat Completions REST using `ministral-8b-2512` and native server-side `fetch`.
- Final serial order: Gemini primary, one eligible primary retry, Gemini fallback, then one Mistral emergency attempt.
- Mistral is reached only after the Gemini fallback was actually attempted and failed; it is not used for local validation errors, user cancellation, safety blocks, HTTP 400, 401, 403, or 429 on the primary path.
- Mistral has one attempt only, a 15-second provider cap, and shares the 55-second server request budget. Browser timeout is 58 seconds and route maximum duration is 60 seconds.
- The same compressed in-memory image, prompt builder, five-caption JSON schema, and Zod result validation are reused. No image is written to disk.
- Successful browser responses remain exactly `{ captions }`; provider, model, latency, status, error type, and fallback state are limited to safe server diagnostics.
- AI mock tests: 168/168 passed, skip 0.
- Lint: 0 errors; the same four pre-existing warnings remain in unchanged editor code.
- TypeScript and Next.js build: passed.
- Local Playwright mock regression: passed on desktop and 390px mobile, including expected Retry, five captions, Use This Caption, Console/Network checks, and all six ratio/frame combinations.
- No real Gemini or Mistral request was made during implementation or localhost verification.

## Protected Preview acceptance — 2026-08-22

- Deployment `dpl_HGUyZx7rfLf5mLK5tmPJDzB5xwtY` for commit `4ea270833a473cb16dac1db6a7989f3dbc2ac4a8` was confirmed Ready with target `preview`, branch `feature/seo-gemini-final`, and project `meme-generator-from-photo` in the expected Vercel team.
- The official `x-vercel-protection-bypass` header returned HTTP 200 and did not redirect to Vercel `/sso-api`. The bypass value was not printed, recorded, or added to the repository.
- Protected Preview Playwright passed with a fixed public demo image and a mocked caption route: expected HTTP 502 then Retry HTTP 200, rapid double-click produced one initial request, five captions rendered, Use This Caption worked, all six ratio/frame combinations rendered, and PNG download completed.
- The six combinations were Square, Portrait, and Story with Frame On and Frame Off. No unexpected Console errors, Network failures, or HTTP failures remained; the intentionally mocked Retry 502 was treated as expected.
- One authorized real Preview caption action completed with HTTP 200, five captions, and Use This Caption success. Browser-observed API duration was about 4.4 seconds.
- Safe server diagnostics recorded a successful `gemini-3.5-flash-lite` primary attempt in about 2.5 seconds with `fallbackUsed: false`; Gemini fallback and Mistral emergency fallback were not invoked.
- Real Gemini caption actions completed in this acceptance: one. Real Mistral calls completed: zero.
- The Mistral disaster path remains mock-verified but not real-provider verified. A normal successful Gemini request cannot safely force that path; do not introduce a public test override, alter Preview secrets, or deliberately degrade Gemini merely to trigger it.
- Production, `main`, domains, DNS, and Production environment variables were not changed.
