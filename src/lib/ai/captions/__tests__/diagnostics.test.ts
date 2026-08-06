import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createAiCaptionDiagnostics,
  getSafeErrorName,
  getSafeGoogleStatus,
  getSafeSdkCode,
  getSafeUpstreamStatus,
  isTimeoutError,
} from "../diagnostics";

const secretMarker = "synthetic-secret-marker";
const imageMarker = Buffer.from("synthetic-image-marker", "utf8").toString("base64");
const promptMarker = "synthetic-prompt-marker";
const rawResponseMarker = "synthetic-response-marker";

const errorFor = (status: number, googleStatus: string) => ({
  name: "GoogleGenAIError",
  status,
  code: googleStatus,
  message: `${secretMarker} ${imageMarker} ${promptMarker} ${rawResponseMarker}`,
  stack: "synthetic-stack-marker",
});

describe("AI caption diagnostics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [400, "INVALID_ARGUMENT"],
    [401, "UNAUTHENTICATED"],
    [403, "PERMISSION_DENIED"],
    [404, "NOT_FOUND"],
    [429, "RESOURCE_EXHAUSTED"],
    [500, "INTERNAL"],
    [503, "UNAVAILABLE"],
  ])("keeps the safe fields for upstream %i / %s", (status, googleStatus) => {
    const error = errorFor(status, googleStatus);

    expect(getSafeUpstreamStatus(error)).toBe(status);
    expect(getSafeGoogleStatus(error)).toBe(googleStatus);
    expect(getSafeErrorName(error)).toBe("GoogleGenAIError");
    expect(getSafeSdkCode(error)).toBe(googleStatus);
  });

  it("reads allowed status properties without reading error messages", () => {
    expect(getSafeUpstreamStatus({ code: 429 })).toBe(429);
    expect(getSafeUpstreamStatus({ response: { status: 503 } })).toBe(503);
    expect(getSafeUpstreamStatus({ cause: { status: 504 } })).toBe(504);
    expect(getSafeGoogleStatus({ status: "NOT_A_SAFE_STATUS" })).toBe("UNKNOWN");
  });

  it("identifies timeout failures from safe status or error name", () => {
    expect(isTimeoutError({ name: "AbortError" })).toBe(true);
    expect(isTimeoutError({ status: "DEADLINE_EXCEEDED" })).toBe(true);
    expect(isTimeoutError(errorFor(500, "INTERNAL"))).toBe(false);
  });

  it("emits only structured whitelisted fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const diagnostics = createAiCaptionDiagnostics("test-request-id", 0);
    const error = errorFor(400, "INVALID_ARGUMENT");

    diagnostics.emit("AI_CAPTION_UPSTREAM_ERROR", {
      stage: "GOOGLE_API_CALL",
      upstreamStatus: getSafeUpstreamStatus(error),
      errorName: getSafeErrorName(error),
      sdkCode: getSafeSdkCode(error),
      googleStatus: getSafeGoogleStatus(error),
      modelMatch: true,
      apiStyle: "INTERACTIONS",
    });

    const output = info.mock.calls[0]?.[0] as string;
    expect(JSON.parse(output)).toMatchObject({
      event: "AI_CAPTION_UPSTREAM_ERROR",
      requestId: "test-request-id",
      stage: "GOOGLE_API_CALL",
      upstreamStatus: 400,
      errorName: "GoogleGenAIError",
      googleStatus: "INVALID_ARGUMENT",
      modelMatch: true,
      apiStyle: "INTERACTIONS",
    });
    expect(output).not.toContain(secretMarker);
    expect(output).not.toContain(imageMarker);
    expect(output).not.toContain(promptMarker);
    expect(output).not.toContain(rawResponseMarker);
    expect(output).not.toContain("synthetic-stack-marker");
  });
});
