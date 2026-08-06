# AI-02 Manual Model Test Guide

Use this guide to test one model at a time. Do not edit `.env.local` and do not create or display an API key.

## Before every model

1. Keep the system proxy and virtual network adapter enabled.
2. Open PowerShell in the project folder.
3. If a previous server is running, press **Ctrl+C** in that server window and wait for it to stop.
4. Turn off Chrome translation for the test page.
5. Prepare the fixed Image-01 to Image-10 set. Use the same original image and the same selected style for all three models.

## Start commands

Run exactly one pair of commands for the model being tested.

### Model 1 — gemini-3.1-flash-lite

```powershell
$env:AI_CAPTION_MODEL="gemini-3.1-flash-lite"
npm.cmd run dev -- --port 3103
```

### Model 2 — gemini-3.5-flash-lite

```powershell
$env:AI_CAPTION_MODEL="gemini-3.5-flash-lite"
npm.cmd run dev -- --port 3103
```

### Model 3 — gemini-3.6-flash

```powershell
$env:AI_CAPTION_MODEL="gemini-3.6-flash"
npm.cmd run dev -- --port 3103
```

After startup, confirm the service log shows `modelMatch:true` during the test request. Do not modify any environment file.

## Test each image

1. Open <http://localhost:3103>.
2. Upload the current prepared test image.
3. Select the fixed style assigned to that Image ID.
4. Generate captions **once**.
5. Do **not** use Generate More, retries, or a second generation.
6. In browser DevTools Network, confirm the caption request returns **200**.
7. Confirm exactly five caption pairs are returned.
8. Record response time, scores, PASS/FAIL, and short notes in `AI_02_MODEL_COMPARISON.md`.
9. Do not copy generated caption text, file names, API keys, prompts, request bodies, or raw responses into either document.

## Switch models

1. Finish Image-01 through Image-10 for the current model.
2. Press **Ctrl+C** to stop the server.
3. Set the next model’s process environment variable with the command above.
4. Restart on port 3103.
5. Repeat the exact same image order and style choices.

Every image/model combination is called once only. All three models must use the same original image and the same style. Stop the server after the final model.
