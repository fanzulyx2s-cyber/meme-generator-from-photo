import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { createAiCaptionDiagnostics } from "../../../lib/ai/captions/diagnostics";
import { handleAiCaptionRequest } from "../../../lib/ai/captions/request-handler";
import { MAX_AI_CAPTION_REQUEST_BYTES } from "../../../lib/ai/captions/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function errorResponse(code: "INVALID_CONTENT_TYPE" | "REQUEST_TOO_LARGE" | "INVALID_IMAGE", message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isJsonContentType(contentType: string | null): boolean {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function contentLengthExceedsLimit(contentLength: string | null): boolean {
  if (!contentLength || !/^\d+$/.test(contentLength)) return false;
  return Number(contentLength) > MAX_AI_CAPTION_REQUEST_BYTES;
}

async function readBoundedJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; status: 400 | 413 }> {
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_AI_CAPTION_REQUEST_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}

export async function POST(request: Request) {
  const diagnostics = createAiCaptionDiagnostics(randomUUID());
  diagnostics.emit("AI_CAPTION_ROUTE_START", { stage: "ROUTE_ENTRY" });
  if (!isJsonContentType(request.headers.get("content-type"))) {
    diagnostics.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: 415 });
    return errorResponse("INVALID_CONTENT_TYPE", "Content-Type must be application/json.", 415);
  }
  if (contentLengthExceedsLimit(request.headers.get("content-length"))) {
    diagnostics.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: 413 });
    return errorResponse("REQUEST_TOO_LARGE", "The image request is too large.", 413);
  }
  const parsedBody = await readBoundedJson(request);
  if (!parsedBody.ok) {
    diagnostics.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: parsedBody.status });
    return errorResponse(parsedBody.status === 413 ? "REQUEST_TOO_LARGE" : "INVALID_IMAGE", parsedBody.status === 413 ? "The image request is too large." : "The image request is invalid.", parsedBody.status);
  }
  const result = await handleAiCaptionRequest({ requestBody: parsedBody.body, diagnostics, requestSignal: request.signal });
  if (result.ok) {
    diagnostics.emit("AI_CAPTION_ROUTE_SUCCESS", { stage: "ROUTE_RESPONSE", localStatus: 200, fallbackUsed: result.fallbackUsed, outcome: "success" });
    return NextResponse.json({ captions: result.captions });
  }
  diagnostics.emit("AI_CAPTION_ROUTE_ERROR", { stage: "ROUTE_RESPONSE", localStatus: result.status, errorType: result.error.code, outcome: "failure" });
  return NextResponse.json({ error: result.error }, { status: result.status });
}
