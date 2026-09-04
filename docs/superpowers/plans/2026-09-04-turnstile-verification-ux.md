# Turnstile Verification UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preload Turnstile after image upload, keep one widget instance, and give users safe slow/failure recovery without automatic AI requests.

**Architecture:** Keep the change inside the existing AI Caption panel. A DOM-based script helper preloads Cloudflare once; the widget stores callback and instance references, owns its verification state and timer, and removes its instance during retry or unmount.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, Cloudflare Turnstile explicit rendering.

---

### Task 1: Define lifecycle behavior with failing component tests

**Files:**
- Modify: `src/components/__tests__/ai-caption-panel.test.tsx`

- [ ] **Step 1: Add a reusable Turnstile mock**

```ts
function installTurnstileMock() {
  let callbacks: Record<string, () => void> = {};
  const api = {
    render: vi.fn((_target, options) => {
      callbacks = options;
      return "widget-1";
    }),
    remove: vi.fn(),
  };
  window.turnstile = api;
  return { api, callbacks: () => callbacks };
}
```

- [ ] **Step 2: Add tests for preload and a single stable widget**

Render with a site key and assert the Cloudflare script exists before consent. Open caption options, assert `render` is called once, change style, and assert it remains one call. Unmount and assert the widget ID is removed.

- [ ] **Step 3: Add tests for slow and failed verification**

Use fake timers to advance eight seconds and assert the slow-network hint appears without `requestAiCaptions`. Invoke `error-callback`, assert `Retry verification` appears, click it, and assert the old widget is removed and a new one is rendered without an AI call.

- [ ] **Step 4: Add tests for success and expiry**

Invoke the Turnstile success callback with a synthetic token, assert Generate becomes enabled, click it, and assert the in-memory token reaches `requestAiCaptions`. Invoke `expired-callback` and assert Generate is disabled again.

- [ ] **Step 5: Run the focused test and verify RED**

```powershell
npx.cmd vitest run src/components/__tests__/ai-caption-panel.test.tsx --reporter=dot
```

Expected: the new tests fail because script preloading, retry UI, timer state, removal, and stable instance handling are not implemented.

### Task 2: Implement the minimal Turnstile lifecycle

**Files:**
- Modify: `src/components/ai-caption-panel.tsx`
- Test: `src/components/__tests__/ai-caption-panel.test.tsx`

- [ ] **Step 1: Extend the browser API type and add the script helper**

```ts
type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  remove: (widgetId: string) => void;
};

function ensureTurnstileScript() {
  const existing = document.querySelector<HTMLScriptElement>(TURNSTILE_SCRIPT_SELECTOR);
  if (existing) return existing;
  const script = document.createElement("script");
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  return script;
}
```

- [ ] **Step 2: Preload after the panel mounts**

```ts
useEffect(() => {
  if (turnstileSiteKey) ensureTurnstileScript();
}, [turnstileSiteKey]);
```

- [ ] **Step 3: Make the widget instance stable and cleanable**

Store `onToken` and `onFailure` in refs so parent rerenders do not recreate the widget. Store the widget ID, clear the eight-second timer on every terminal path, and call `window.turnstile.remove(widgetId)` on retry and unmount.

- [ ] **Step 4: Add verification state and retry UI**

Start in `loading`, transition to `slow` after eight seconds, `ready` on callback, and `failed` on error or expiry. `Retry verification` increments a local attempt counter so the widget effect recreates one instance; it never calls `generate`.

- [ ] **Step 5: Run the focused test and verify GREEN**

```powershell
npx.cmd vitest run src/components/__tests__/ai-caption-panel.test.tsx --reporter=dot
```

Expected: all AI Caption panel tests pass.

- [ ] **Step 6: Refactor only for clarity and rerun the focused test**

Keep the helper and component local to `ai-caption-panel.tsx`; do not modify server verification or Provider code.

### Task 3: Verify, commit, push, and inspect Preview

**Files:**
- Modify: `src/components/ai-caption-panel.tsx`
- Modify: `src/components/__tests__/ai-caption-panel.test.tsx`
- Add: `docs/superpowers/specs/2026-09-04-turnstile-verification-ux-design.md`
- Add: `docs/superpowers/plans/2026-09-04-turnstile-verification-ux.md`

- [ ] **Step 1: Run local verification**

```powershell
npm.cmd run test:ai
npm.cmd run lint
npx.cmd eslint src
npx.cmd tsc --noEmit --incremental false
npm.cmd run build
git diff --check
```

Expected: tests, lint, TypeScript, build, and diff checks pass with no new warnings.

- [ ] **Step 2: Audit the diff and scan for sensitive content**

Confirm only the two component files and two design/plan documents changed. Confirm no environment files, keys, tokens, Base64, screenshots, reports, or temporary files are present.

- [ ] **Step 3: Commit implementation**

```powershell
git add -- src/components/ai-caption-panel.tsx src/components/__tests__/ai-caption-panel.test.tsx docs/superpowers/plans/2026-09-04-turnstile-verification-ux.md
git commit -m "Improve Turnstile verification recovery"
```

- [ ] **Step 4: Push the feature branch**

```powershell
git -c http.proxy= -c https.proxy= push -u origin fix/turnstile-verification-ux
```

Expected: the remote branch points to the local implementation commit; `main` is unchanged.

- [ ] **Step 5: Verify the Git Integration Preview with mock AI**

Wait for the correct Vercel Project Preview to become Ready. In desktop and 390px Chromium, intercept `/api/ai-meme-captions` with five fixed captions. Verify script preload, one widget instance, slow hint, retry, successful enabling, five results, no duplicate request, and no unexpected Console or Network errors.

- [ ] **Step 6: Clean artifacts and confirm repository state**

Delete temporary browser scripts, downloads, screenshots, and reports. Confirm the feature branch is aligned with its remote and the working tree is clean.
