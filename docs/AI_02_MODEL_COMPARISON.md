# AI-02 Gemini Model Comparison

## Purpose

Compare caption quality, reliability, and response time across three Gemini models using a repeatable manual test. This document records scores only; do not save test images, user filenames, generated caption text, API keys, request bodies, prompts, or raw model responses.

## Models

1. `gemini-3.1-flash-lite`
2. `gemini-3.5-flash-lite`
3. `gemini-3.6-flash`

## Fair-test rules

- Use the same API key, Provider, Prompt, JSON Schema, original image, and selected style for all three models.
- Use each Image ID once per model, with the same fixed style selected for that Image ID.
- Generate once only. Do not use Generate More, retries, image edits, Chrome translation, or different source images.
- Record scores immediately after each request; keep generated caption text out of this document.

## Image set

| Image ID | Scene type |
| --- | --- |
| Image-01 | Single-person facial reaction |
| Image-02 | Two-person interaction |
| Image-03 | Small group or family moment |
| Image-04 | Pet reaction |
| Image-05 | Indoor work or meeting scene |
| Image-06 | Outdoor activity or travel moment |
| Image-07 | Food, product, or object-centered scene |
| Image-08 | Low-light or visually busy scene |
| Image-09 | Subtle expression or quiet everyday moment |
| Image-10 | Clear high-energy or surprising moment |

## Scoring scale

Score each of Image understanding, Photo relevance, English naturalness, Humor, and Variety from **1** (poor) to **5** (excellent). `JSON/5 captions` is `PASS` only when the response is valid and contains exactly five caption pairs. Response time is measured in seconds.

### `gemini-3.1-flash-lite`

| Image | Image understanding | Photo relevance | English naturalness | Humor | Variety | JSON/5 captions | Response time (s) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Image-01 | | | | | | | | |
| Image-02 | | | | | | | | |
| Image-03 | | | | | | | | |
| Image-04 | | | | | | | | |
| Image-05 | | | | | | | | |
| Image-06 | | | | | | | | |
| Image-07 | | | | | | | | |
| Image-08 | | | | | | | | |
| Image-09 | | | | | | | | |
| Image-10 | | | | | | | | |

### `gemini-3.5-flash-lite`

| Image | Image understanding | Photo relevance | English naturalness | Humor | Variety | JSON/5 captions | Response time (s) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Image-01 | | | | | | | | |
| Image-02 | | | | | | | | |
| Image-03 | | | | | | | | |
| Image-04 | | | | | | | | |
| Image-05 | | | | | | | | |
| Image-06 | | | | | | | | |
| Image-07 | | | | | | | | |
| Image-08 | | | | | | | | |
| Image-09 | | | | | | | | |
| Image-10 | | | | | | | | |

### `gemini-3.6-flash`

| Image | Image understanding | Photo relevance | English naturalness | Humor | Variety | JSON/5 captions | Response time (s) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Image-01 | | | | | | | | |
| Image-02 | | | | | | | | |
| Image-03 | | | | | | | | |
| Image-04 | | | | | | | | |
| Image-05 | | | | | | | | |
| Image-06 | | | | | | | | |
| Image-07 | | | | | | | | |
| Image-08 | | | | | | | | |
| Image-09 | | | | | | | | |
| Image-10 | | | | | | | | |

## Final totals and conclusion

| Model | Understanding total / 50 | Relevance total / 50 | Naturalness total / 50 | Humor total / 50 | Variety total / 50 | JSON PASS / 10 | Average response time (s) | Overall total / 250 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| gemini-3.1-flash-lite | | | | | | | | |
| gemini-3.5-flash-lite | | | | | | | | |
| gemini-3.6-flash | | | | | | | | |

**Conclusion:**

- Recommended model:
- Why:
- Reliability observations:
- Follow-up decision:
