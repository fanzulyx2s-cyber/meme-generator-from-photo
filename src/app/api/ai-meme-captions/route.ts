import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { createAiCaptionDiagnostics } from "../../../lib/ai/captions/diagnostics";
import { handleAiCaptionRequest } from "../../../lib/ai/captions/request-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

function readComparisonUsageRequest(requestBody: unknown): { includeUsageMetadata: boolean; captionRequestBody: unknown } {
  if (typeof requestBody !== "object" || requestBody === null || !("includeUsageMetadata" in requestBody)) return { includeUsageMetadata: false, captionRequestBody: requestBody };
  const { includeUsageMetadata, ...captionRequestBody } = requestBody as Record<string, unknown>;
  return { includeUsageMetadata: includeUsageMetadata === true, captionRequestBody };
}

export async function POST(request: Request) {
  const diagnostics = createAiCaptionDiagnostics(randomUUID());
  diagnostics.emit("AI_CAPTION_ROUTE_START", { stage: "ROUTE_ENTRY" });
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    diagnostics.emit("AI_CAPTION_ROUTE_ERROR", { stage: "IMAGE_VALIDATION", localStatus: 400 });
    return NextResponse.json({ error: { code: "INVALID_IMAGE", message: "The image request is invalid." } }, { status: 400 });
  }
  const { includeUsageMetadata, captionRequestBody } = readComparisonUsageRequest(requestBody);
  const result = await handleAiCaptionRequest({ requestBody: captionRequestBody, diagnostics, requestSignal: request.signal });
  if (result.ok) {
    diagnostics.emit("AI_CAPTION_ROUTE_SUCCESS", { stage: "ROUTE_RESPONSE", localStatus: 200, fallbackUsed: result.fallbackUsed, outcome: "success" });
    return NextResponse.json({ captions: result.captions, ...(includeUsageMetadata ? { usageMetadata: result.usageMetadata ?? null } : {}) });
  }
  diagnostics.emit("AI_CAPTION_ROUTE_ERROR", { stage: "ROUTE_RESPONSE", localStatus: result.status, errorType: result.error.code, outcome: "failure" });
  return NextResponse.json({ error: result.error }, { status: result.status });
}
