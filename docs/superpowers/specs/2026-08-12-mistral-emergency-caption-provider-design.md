# Mistral Emergency Caption Provider Design

## Goal

Add Mistral as an independent, terminal disaster-recovery provider after the existing Gemini primary/retry/fallback chain, while preserving the browser contract `{ captions }` and all privacy boundaries.

## Architecture

- Keep `GeminiCaptionProvider` unchanged.
- Add `MistralCaptionProvider` implementing the existing `CaptionProvider` interface with server-side `fetch` to `POST https://api.mistral.ai/v1/chat/completions`.
- Use `ministral-8b-2512`, the existing caption prompt, the existing in-memory compressed image, an inline image data URI, Mistral JSON Schema response format, and the existing Zod result parser.
- Extend the provider factory to create Mistral only when explicitly requested by the request handler.
- Invoke Mistral once only after Gemini fallback was actually attempted and failed. Never run providers concurrently and never retry Mistral.

## Error and timeout policy

- Gemini behavior remains unchanged: one constrained primary retry, then one Gemini fallback where eligible.
- Primary 400/401/403/429, local validation, safety blocks, and user cancellation do not enter the complete Gemini fallback chain and therefore do not call Mistral.
- If the Gemini fallback was attempted and fails for any safe provider error, Mistral receives one terminal attempt if `MISTRAL_API_KEY` is configured and the request is still active.
- Mistral maps 401/403 to missing configuration, 429 to provider rate limiting, timeout to provider timeout, 5xx/network errors to generation failure, and malformed HTTP 200 output to invalid provider response.
- Mistral has a 15-second attempt cap and shares a 55-second server request budget. Browser timeout is 58 seconds and route `maxDuration` is 60 seconds.

## Security and observability

- Keys remain server-only request headers. No key enters a URL, response, diagnostic event, or source-controlled configuration.
- Images remain in memory and are never written to disk.
- Structured diagnostics record provider role, model match/role, HTTP status, latency, error type, fallback state, and final outcome only.
- Normal success responses remain exactly `{ captions }`; provider/model metadata is never sent to the ordinary frontend.

## Verification

- Unit/mock tests cover Gemini success/retry bypassing Mistral, Gemini exhaustion then Mistral success, Mistral timeout, 429, 5xx, invalid response/JSON, and total provider failure.
- Full AI tests, lint, standalone ESLint, TypeScript, build, localhost Playwright, feature commit/push, Git Integration Preview verification, and Preview Playwright are required before any real provider request.
- Real Mistral calls are capped at two under the existing authorization.
