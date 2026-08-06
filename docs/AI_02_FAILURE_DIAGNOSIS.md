# AI-02 Failure Diagnosis

## Root-cause conclusion

The 24 HTTP 400 responses were returned by the local API route before any Gemini request. Eight of the ten anonymously numbered PNG files exceeded the existing 2 MB image and Base64 request limits. The request schema rejects those inputs before the provider is created, and the route safely classifies that schema rejection as `INVALID_IMAGE` / HTTP 400.

The three HTTP 504 responses were local provider timeouts. The configured provider timeout was 15 seconds, while the comparison script's outer HTTP timeout was 25 seconds. The approximately 15.06–15.07 second durations match the server-side timeout, not the script timeout.

## Evidence matrix

| Image | 3.1 flash-lite | 3.5 flash-lite | 3.6 flash | Upstream entered | usageMetadata |
|---|---|---|---|---|---|
| Image-01 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-02 | 200 PASS | 200 PASS | 504 provider timeout | Yes | Yes for 200 only |
| Image-03 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-04 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-05 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-06 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-07 | 504 provider timeout | 200 PASS | 504 provider timeout | Yes | Yes for 200 only |
| Image-08 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-09 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |
| Image-10 | 400 local size validation | 400 local size validation | 400 local size validation | No | No |

The 400 rows completed in approximately 0.02–0.06 seconds with no usage metadata, which is consistent with local validation. The 504 rows completed at approximately 15.06–15.07 seconds with no usage metadata, matching the provider timeout.

## 400 classification

- Count: 24.
- Source: local `generateCaptionsRequestSchema` Base64 maximum, before `decodeImage`, Provider construction, or Gemini fetch.
- Image correlation: Image-01 and Image-03 through Image-06, plus Image-08 through Image-10, all exceeded 2 MB.
- MIME / encoding: all selected inputs were PNG; two PNG inputs within the limit reached Gemini successfully. There is no MIME-type or encoding evidence for the 400s.

## 504 classification

- Count: 3.
- Source: local `GeminiCaptionProvider` abort at its former 15,000 ms timeout.
- Affected requests: Image-02 / gemini-3.6-flash, Image-07 / gemini-3.1-flash-lite, and Image-07 / gemini-3.6-flash.
- No Google error status or reason was received because the local abort occurred first.

## Route, script, and model checks

- The per-model override is passed to each spawned local server as `AI_CAPTION_MODEL`; the Route reads that value through the existing configuration path.
- `includeUsageMetadata` is removed by the Route before it calls the existing request handler. It does not enter the Gemini request body.
- The formal request still uses the same `store: false`, response MIME type, response schema, system instruction, Prompt, and Zod requirement of exactly five captions.
- The data does not establish a model-parameter or Generate Content compatibility problem. In particular, all gemini-3.6-flash attempts were either blocked locally by oversized input or timed out locally; no upstream incompatibility response was recorded.

## Applied small-scope repair

1. The comparison child process now sets the existing server-only timeout override to 25,000 ms, matching the configured comparison generation timeout.
2. Before any network request, the comparison script now reads anonymous file-size metadata and exits safely if a selected image exceeds the unchanged 2 MB product limit. It does not display the original filename.

These changes do not alter Prompt semantics, front-end behavior, model names, the Route request body, the Zod five-caption constraint, or production environment variables. No broad refactor is required.

## Next minimal real verification

After explicit authorization, use one PNG test image known to be within the existing 2 MB limit and run each fixed model once: three serial requests total, with the same reaction style and no retries. This validates the timeout alignment and confirms whether gemini-3.6-flash completes within 25 seconds. Do not run this step without a new authorization.
