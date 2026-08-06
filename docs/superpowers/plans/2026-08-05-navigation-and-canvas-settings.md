# Navigation and Canvas Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct exact-route navigation highlighting and keep canvas settings available whenever a main image is loaded.

**Architecture:** `SiteHeader` becomes a client component that maps the current pathname through an explicit exact-match table. `MemeGenerator` retains its existing ratio, frame, download, object-selection, and rendering state; only the toolbar render tree is split into a fixed Canvas Settings section and a dynamic Selected Object Tools section.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Header exact-path regression tests

**Files:**
- Create: `src/components/__tests__/site-header.test.tsx`
- Modify: `package.json`

- [ ] Add pathname-mocked tests for `/`, `/photo-reaction-meme-maker`, `/how-to-make-a-meme-from-a-photo`, `/pricing`, `/no-watermark-meme-maker`, and an unknown path. Assert exactly one current link for mapped paths and none for unknown paths.
- [ ] Run the new test and confirm it fails before header logic exists.

### Task 2: Header implementation

**Files:**
- Modify: `src/components/site-header.tsx`

- [ ] Make the header client-rendered and derive the active label from `usePathname()` with exact mappings only. Preserve every label, href, and responsive layout class; apply the existing black current-item treatment only to the derived active link.
- [ ] Run the header test and confirm it passes.

### Task 3: Fixed Canvas Settings regression tests

**Files:**
- Create: `src/components/__tests__/meme-generator-toolbar.test.tsx`
- Modify: `package.json`

- [ ] Render a generator with a selected main image and assert the three ratio controls, frame controls, and download button exist before and after selecting top text, bottom text, an emoji, and an image sticker. Assert ratio clicks reach the existing output-ratio update path and object-specific tools remain rendered.
- [ ] Run the new test and confirm it fails while the old conditional toolbar hides size controls.

### Task 4: Toolbar render-tree implementation

**Files:**
- Modify: `src/components/meme-generator.tsx`

- [ ] Keep the existing `selectOutputRatio`, `setFrameEnabled`, `handleDownload`, and selection state handlers unchanged. Move size, frame, and download controls into a first `Canvas Settings` section rendered whenever `imageSrc` exists. Put current add/reset controls or selected text/sticker controls into a second dynamic section. Use existing `flex-wrap` patterns so narrow screens wrap rather than overflow.
- [ ] Run the toolbar and mobile-scroll tests and confirm they pass.

### Task 5: Full validation and local review setup

**Files:**
- Modify: no additional files

- [ ] Run `npm.cmd run test:ai`, `npm.cmd run lint`, `npx.cmd eslint src`, `npx.cmd tsc --noEmit --incremental false`, and `npm.cmd run build`; record test totals, skip total, and command results.
- [ ] Start `npm.cmd run dev -- --port 3103` and leave it running for the requested manual checks.

### Plan self-review

- Exact-path highlighting covers all mapped and unknown route outcomes.
- Canvas controls remain in the original state/data-flow paths; no provider, payments, license, SEO metadata, policy copy, or image rendering code is in scope.
- Tests target externally observable controls and behavior without editor-wide rewrites.
