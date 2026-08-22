# MemePhoto AI — Project Handoff

Date: 2026-08-22

This document is the safe starting point for a new Codex task. It intentionally contains no API key values, tokens, cookies, image Base64, user images, prompts, request bodies, or raw provider responses.

## 1. Canonical workspace

| Item | Value |
| --- | --- |
| Official Git workspace | `C:\Users\linyong\Desktop\codes\meme-generator-from-photo-seo-git` |
| Repository | `fanzulyx2s-cyber/meme-generator-from-photo` |
| Active branch | `feature/seo-gemini-final` |
| Current HEAD | `203502780c1dc11f02d615182a7335217ae62586` |
| Current commit | `Document protected Preview AI acceptance` |
| Git status at handoff | Clean |
| Previous non-Git source copy | `C:\Users\linyong\Desktop\codes\meme-generator-from-photo-seo` — do not treat as the canonical Git workspace |

The official workspace has local Git identity `fanzulyx2s-cyber <fanzulyx2s@gmail.com>`. Do not change global Git identity, rewrite history, force-push, merge `main`, or deploy Production without explicit authorization.

## 2. Product state

### Navigation and editor UI

- Header active-state routing uses exact pathname matching. `Generator`, `Reaction memes`, `How-to guide`, and `Pricing` map to their intended routes; unknown/404 and policy/payment utility paths do not incorrectly highlight a navigation item.
- Canvas Settings remain visible whenever a main image exists: output ratio, Frame On/Off, and Download PNG. Object-specific controls are displayed separately, so selecting text, emoji, logo, or image sticker does not hide ratio controls.
- Text layout uses ratio-aware presets for Square 1:1, Portrait 4:5, and Story 9:16. Auto-layout recalculates font size, wrapping, and vertical safe regions on ratio changes; manual edits disable auto-layout for the edited text object.
- Previous local visual acceptance passed all six ratio/frame combinations. The existing layout parameters should not be adjusted unless a new measured UI regression is reproduced.

### AI Caption chain

The browser keeps the existing explicit privacy-consent flow and compresses the selected image in memory before sending it. The normal browser response remains exactly:

```json
{ "captions": [] }
```

Provider diagnostics are server-only and must not leak to the browser response.

Current serial provider policy:

```text
Gemini primary: gemini-3.5-flash-lite
  → one eligible primary retry
  → Gemini fallback: gemini-3.1-flash-lite
  → Mistral emergency fallback: ministral-8b-2512
  → unified failure only when every eligible attempt fails
```

Important rules:

- Gemini and Mistral never run concurrently.
- Primary retry is limited to transient upstream/network failures according to the request handler.
- Local validation failures, 400, 401, 403, 429, safety blocks, and user cancellation do not automatically fallback from the primary path.
- Mistral is only reached after the Gemini fallback actually runs and fails.
- Providers reuse the same compressed in-memory image, prompt builder, five-caption schema, and Zod validation. No image is saved to disk and no Files API is used.
- Normal browser responses never expose provider name, model, or `fallbackUsed`.

Key implementation files:

| Area | File |
| --- | --- |
| Route | `src/app/api/ai-meme-captions/route.ts` |
| Request sequencing / retry / fallback | `src/lib/ai/captions/request-handler.ts` |
| Gemini REST provider | `src/lib/ai/captions/providers/gemini-caption-provider.ts` |
| Mistral REST provider | `src/lib/ai/captions/providers/mistral-caption-provider.ts` |
| Provider factory | `src/lib/ai/captions/create-caption-provider.ts` |
| Fixed model strategy / budgets | `src/lib/ai/captions/config.ts` |
| Shared prompt/schema/Zod | `src/lib/ai/captions/prompt.ts`, `src/lib/ai/captions/schema.ts` |
| Safe diagnostics | `src/lib/ai/captions/diagnostics.ts` |

## 3. Completed milestones

1. Gemini provider was moved to Generate Content REST while retaining the existing caption interface, API route, prompt, JSON schema, and Zod validation.
2. Three-model Gemini comparison tooling and offline blind-review outputs were added for local testing only. Test images and results are ignored by Git.
3. Default Gemini strategy was selected as 3.5 Flash Lite with 3.1 Flash Lite as the sole Gemini fallback. Gemini 3.6 Flash is not in the formal route.
4. AI reliability work added browser/request/provider cancellation budgets, limited retry, safe error classification, single-flight UI protection, and server-only diagnostics.
5. Mistral emergency provider was added using native server-side `fetch`; no Mistral SDK or new core runtime dependency was added.
6. Shared Playwright tooling was installed outside business repositories at `C:\Users\linyong\.agents\skills\webapp-testing`.
7. Protected Vercel Preview was validated with official automation-bypass request headers. No bypass value is stored in this repository.

Relevant commits:

| Commit | Meaning |
| --- | --- |
| `714e88a02ca08b49e211ac34203fb4d6c9a93823` | Earlier layout candidate baseline |
| `fb8d34400953a39ed65a659bdfd1ee84530fbbcb` | AI caption request reliability work |
| `4ea270833a473cb16dac1db6a7989f3dbc2ac4a8` | Mistral caption disaster recovery |
| `203502780c1dc11f02d615182a7335217ae62586` | Protected Preview AI acceptance documentation |

## 4. Verification evidence

### Automated local checks

- AI test suite reached 168/168 passing at the Mistral checkpoint, skip 0.
- Lint reported 0 errors. Four pre-existing unused-function warnings remain in unchanged editor code.
- TypeScript and Next.js build passed at the Mistral checkpoint.
- Local Playwright mock regression passed on desktop and 390px mobile: expected Retry flow, five captions, Use This Caption, duplicate-click guard, Console/Network checks, 1:1 / 4:5 / 9:16, Frame On/Off, and PNG download.

Run from the official workspace when fresh verification is required:

```powershell
npm.cmd run test:ai
npm.cmd run lint
npx.cmd eslint src
npx.cmd tsc --noEmit --incremental false
npm.cmd run build
```

### Vercel Preview

MemePhoto AI Vercel identity is fixed and must be checked before every Vercel operation:

| Item | Required value |
| --- | --- |
| User | `fanzulyx2s-4910` |
| Team | `fanzulyx2sgmailcoms-projects` |
| Project | `meme-generator-from-photo` |
| GitHub repository | `fanzulyx2s-cyber/meme-generator-from-photo` |
| Branch | `feature/seo-gemini-final` or an explicitly approved feature/test branch |
| Target | Preview only unless explicitly authorized otherwise |

Use the dedicated CLI configuration for every Vercel CLI operation:

```powershell
vercel.cmd <command> --global-config "$env:USERPROFILE\.vercel-meme"
```

Never use the machine-default Vercel identity for this project. Do not use bare Vercel commands, `--prod`, `promote`, Production aliases, or environment-variable mutation commands without new explicit authorization.

Current latest Preview (documentation-only commit):

- URL: `https://meme-generator-from-photo-jwe7cbg3y.vercel.app`
- Deployment ID: `dpl_7c5eLzeZ5Dke7V1DYQgGg36Kbt7s`
- Target: Preview
- Status at handoff: Ready
- Commit: `2035027`

The preceding application Preview for commit `4ea2708` was fully browser-accepted at `https://meme-generator-from-photo-bw6hrhd0j.vercel.app`. The newer Preview has the same application code plus the handoff documentation.

Protected Preview facts:

- The official automation bypass header returned HTTP 200 and did not redirect to Vercel SSO.
- Preview Playwright mock acceptance passed: page load, AI UI, expected Retry, duplicate-click guard, six ratio/frame combinations, PNG download, Console, and Network.
- One real Preview Gemini action returned HTTP 200, five captions, and completed Use This Caption. Safe diagnostics recorded `gemini-3.5-flash-lite` primary success and `fallbackUsed: false`.

## 5. Secret and safety boundaries

Do not read, display, copy, commit, log, or place any secret in source code.

Known environment-variable names only:

- `GEMINI_API_KEY` — Preview server configuration.
- `MISTRAL_API_KEY` — Preview server configuration; also temporarily supplied by the user for the direct local Mistral acceptance attempt.
- `VERCEL_AUTOMATION_BYPASS_SECRET` — local automation environment only; used as the official request header for protected Preview checks.

Always preserve these boundaries:

- No Production deploy, Production environment change, `main` merge/push, formal-domain/DNS operation, or payment-plan activation without explicit authorization.
- Do not enable Mistral Pay-As-You-Go, add a card, or alter account billing.
- Do not upload real user images or save compressed images to disk.
- Do not commit local Playwright screenshots/reports, test images, `.env*`, `.next`, `node_modules`, or Vercel metadata.
- `private-ai-test-images/` and `local-ai-comparison-results/` are intentionally ignored.

## 6. Mistral direct real-provider acceptance

The Mistral emergency implementation is mock-verified and its direct provider path is now real-provider accepted.

On 2026-08-22, one explicitly authorized direct call to the existing `MistralCaptionProvider` used a tracked public demo image and completed successfully:

- HTTP 200 was received.
- The provider made exactly one request with no retry.
- The response contained exactly five captions; all top/bottom text values were non-empty.
- Existing Zod validation passed and the result normalized to the browser contract `{ captions }`.
- The test did not invoke the API Route, Gemini, or the serial fallback chain.

The earlier no-response result was caused by the local DNS/proxy route, not by code, credentials, model access, schema validation, or quota. With iKuuuVPN TUN/Fake-IP routing active, Node TLS 1.3 and certificate verification passed, followed by the successful direct Provider call. No permanent code change was needed.

This accepts direct Mistral provider connectivity and contract compatibility. The full serial Gemini-to-Mistral fallback remains mock/automation verified only; no real end-to-end fallback was deliberately triggered.

## 7. Recommended next task

Complete release-preparation checks on `feature/seo-gemini-final`: local quality gates, Git Integration Preview readiness, and non-real-AI Preview browser regression. A `main` merge or Production deployment remains a separate authorization boundary.

## 8. New-window startup checklist

1. Read this document and `docs/AI_CAPTION_RELIABILITY_HANDOFF.md`.
2. Confirm the official workspace, branch, HEAD, and clean Git status.
3. Announce a time estimate before any new task; use `C:\Users\linyong\.agents\skills\safe-efficient-autonomous-execution` by default.
4. For browser work, use the shared Playwright skill at `C:\Users\linyong\.agents\skills\webapp-testing`.
5. For Vercel work, verify User, Team, Project, repository, branch, and Preview target before any action, always with `.vercel-meme` global config.
6. Treat Production, `main`, billing, keys, domains, DNS, and secret changes as mandatory user-confirmation boundaries.
