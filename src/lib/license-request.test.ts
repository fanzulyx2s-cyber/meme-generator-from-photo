import { describe, expect, it } from "vitest";

import { MAX_LICENSE_REQUEST_BYTES, parseLicenseRequest } from "./license-request";

const jsonHeaders = { "Content-Type": "application/json" };

function jsonRequest(body: unknown, contentType = "application/json") {
  return new Request("http://localhost/api/license/activate", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

describe("parseLicenseRequest", () => {
  it("accepts an exact JSON payload with a charset", async () => {
    const result = await parseLicenseRequest(
      jsonRequest(
        { licenseKey: "synthetic-license", instanceName: "synthetic-browser" },
        "application/json; charset=utf-8",
      ),
      "instanceName",
    );

    expect(result).toEqual({
      ok: true,
      body: { licenseKey: "synthetic-license", instanceName: "synthetic-browser" },
    });
  });

  it("rejects missing and unsupported content types before parsing", async () => {
    const missing = await parseLicenseRequest(
      new Request("http://localhost/api/license/activate", {
        method: "POST",
        body: JSON.stringify({ licenseKey: "synthetic-license", instanceName: "browser" }),
      }),
      "instanceName",
    );
    const unsupported = await parseLicenseRequest(
      jsonRequest({ licenseKey: "synthetic-license", instanceName: "browser" }, "text/plain"),
      "instanceName",
    );

    expect(missing).toEqual({ ok: false, status: 415 });
    expect(unsupported).toEqual({ ok: false, status: 415 });
  });

  it("limits both declared and streamed bodies", async () => {
    const declared = await parseLicenseRequest(
      new Request("http://localhost/api/license/activate", {
        method: "POST",
        headers: { ...jsonHeaders, "Content-Length": String(MAX_LICENSE_REQUEST_BYTES + 1) },
        body: "{}",
      }),
      "instanceName",
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(MAX_LICENSE_REQUEST_BYTES + 1)));
        controller.close();
      },
    });
    const streamed = await parseLicenseRequest(
      new Request("http://localhost/api/license/activate", {
        method: "POST",
        headers: jsonHeaders,
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
      "instanceName",
    );

    expect(declared).toEqual({ ok: false, status: 413 });
    expect(streamed).toEqual({ ok: false, status: 413 });
  });

  it("rejects malformed JSON and unexpected input fields", async () => {
    const malformed = await parseLicenseRequest(
      new Request("http://localhost/api/license/activate", {
        method: "POST",
        headers: jsonHeaders,
        body: "{",
      }),
      "instanceName",
    );
    const unexpected = await parseLicenseRequest(
      jsonRequest({ licenseKey: "synthetic-license", instanceName: "browser", extra: "blocked" }),
      "instanceName",
    );
    const wrongField = await parseLicenseRequest(
      jsonRequest({ licenseKey: "synthetic-license", instanceId: "browser" }),
      "instanceName",
    );

    expect(malformed).toEqual({ ok: false, status: 400 });
    expect(unexpected).toEqual({ ok: false, status: 400 });
    expect(wrongField).toEqual({ ok: false, status: 400 });
  });
});
