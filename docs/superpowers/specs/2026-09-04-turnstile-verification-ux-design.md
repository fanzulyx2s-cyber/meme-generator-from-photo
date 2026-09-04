# Turnstile verification UX design

## Goal

Make AI Caption human verification feel faster and recover cleanly from slow or failed Cloudflare Turnstile checks, without weakening server-side verification or causing any AI request automatically.

## Scope

Only the AI Caption panel's Turnstile client lifecycle and related tests change. Gemini, Mistral, image moderation, API request schemas, server verification, environment variables, and Production configuration remain unchanged.

## Design

When an uploaded image causes the AI Caption panel to mount, the panel preloads Cloudflare's Turnstile script. The visible widget is still rendered only after the user accepts the AI consent notice and reaches caption options. This removes script-download latency from the final interaction without loading Cloudflare for visitors who never upload an image.

The widget owns one stable instance ID. Stable callbacks prevent ordinary React rerenders, including caption-style changes, from creating additional instances. On file replacement, panel reset, or component unmount, the old instance is removed. The Turnstile token remains only in React memory.

The panel exposes four verification states:

- `loading`: verification is in progress and generation remains disabled;
- `slow`: after eight seconds, a non-alarming network hint appears;
- `ready`: a token was issued and generation becomes available;
- `failed`: an explicit `Retry verification` control appears.

Retry resets the existing widget when possible. If the instance is unavailable, it safely removes and recreates that widget. Retry never invokes the AI route. Token expiry returns the panel to the failed state and disables generation until verification succeeds again.

## Security and privacy

- No Turnstile bypass is added.
- No token is written to localStorage, sessionStorage, logs, URLs, or files.
- AI generation remains a separate explicit button click after verification.
- Server-side fail-closed verification remains authoritative.
- No automatic AI retry or Provider call is added.

## Tests

Component tests will prove that:

1. the script is preloaded after the panel mounts;
2. the widget renders once and style changes do not duplicate it;
3. an eight-second delay displays the slow-network hint without an AI request;
4. failure displays retry and retry resets the widget without an AI request;
5. successful verification enables generation and passes the in-memory token;
6. expiry disables generation again;
7. unmount removes the widget.

Existing AI, duplicate-submit, consent, privacy, and server Turnstile tests must continue to pass. Preview browser verification will mock the AI route and will not call Gemini, Mistral, Google Vision, Creem, email, or payment services.

## Acceptance criteria

- Uploading a photo begins script preloading.
- One widget instance is maintained per panel lifecycle.
- Slow and failed verification states give actionable guidance.
- Retry does not reload the page or re-upload the image.
- No AI call occurs until a valid token exists and the user clicks Generate.
- All local checks and Preview mock verification pass.
