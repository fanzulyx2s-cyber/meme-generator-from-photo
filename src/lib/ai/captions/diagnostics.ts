export type AiCaptionDiagnosticStage =
  | "ROUTE_ENTRY"
  | "CONFIG"
  | "IMAGE_VALIDATION"
  | "REQUEST_BUILD"
  | "GOOGLE_API_CALL"
  | "RESPONSE_EXTRACTION"
  | "ZOD_VALIDATION"
  | "ROUTE_RESPONSE"
  | "TIMEOUT"
  | "UNKNOWN";

type GoogleStatus =
  | "INVALID_ARGUMENT"
  | "UNAUTHENTICATED"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "RESOURCE_EXHAUSTED"
  | "FAILED_PRECONDITION"
  | "INTERNAL"
  | "UNAVAILABLE"
  | "DEADLINE_EXCEEDED"
  | "UNKNOWN";

type DiagnosticEvent =
  | "AI_CAPTION_ROUTE_START"
  | "AI_CAPTION_PROVIDER_START"
  | "AI_CAPTION_UPSTREAM_ERROR"
  | "AI_CAPTION_RESPONSE_EXTRACTION_ERROR"
  | "AI_CAPTION_ZOD_ERROR"
  | "AI_CAPTION_FALLBACK"
  | "AI_CAPTION_ROUTE_ERROR"
  | "AI_CAPTION_ROUTE_SUCCESS";

type DiagnosticFields = {
  stage: AiCaptionDiagnosticStage;
  localStatus?: number;
  upstreamStatus?: number;
  errorName?: string;
  sdkCode?: string | number;
  googleStatus?: GoogleStatus;
  modelMatch?: boolean;
  apiStyle?: "INTERACTIONS" | "GENERATE_CONTENT_REST";
  elapsedMs?: number;
  fallbackUsed?: boolean;
};

export type AiCaptionDiagnostics = {
  emit: (event: DiagnosticEvent, fields: DiagnosticFields) => void;
};

const allowedGoogleStatuses = new Set<GoogleStatus>([
  "INVALID_ARGUMENT",
  "UNAUTHENTICATED",
  "PERMISSION_DENIED",
  "NOT_FOUND",
  "RESOURCE_EXHAUSTED",
  "FAILED_PRECONDITION",
  "INTERNAL",
  "UNAVAILABLE",
  "DEADLINE_EXCEEDED",
]);

function recordFromError(error: unknown): Record<string, unknown> | undefined {
  return typeof error === "object" && error !== null
    ? (error as Record<string, unknown>)
    : undefined;
}

function numericStatus(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : undefined;
}

export function getSafeUpstreamStatus(error: unknown): number | undefined {
  const record = recordFromError(error);
  if (!record) return undefined;
  return numericStatus(record.status)
    ?? numericStatus(record.code)
    ?? numericStatus(recordFromError(record.response)?.status)
    ?? numericStatus(recordFromError(record.cause)?.status);
}

export function getSafeGoogleStatus(error: unknown): GoogleStatus {
  const record = recordFromError(error);
  const candidates = [record?.status, record?.code, recordFromError(record?.cause)?.status];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && allowedGoogleStatuses.has(candidate as GoogleStatus)) {
      return candidate as GoogleStatus;
    }
  }
  return "UNKNOWN";
}

export function getSafeErrorName(error: unknown): string {
  const name = recordFromError(error)?.name;
  return typeof name === "string" && /^[A-Za-z0-9_$.-]{1,80}$/.test(name)
    ? name
    : "UNKNOWN";
}

export function getSafeSdkCode(error: unknown): string | number | undefined {
  const code = recordFromError(error)?.code;
  if (typeof code === "number" && Number.isInteger(code)) return code;
  return typeof code === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(code)
    ? code
    : undefined;
}

export function isTimeoutError(error: unknown): boolean {
  const record = recordFromError(error);
  return record?.name === "AbortError"
    || record?.name === "TimeoutError"
    || getSafeGoogleStatus(error) === "DEADLINE_EXCEEDED";
}

export function createAiCaptionDiagnostics(requestId: string, startedAt = Date.now()): AiCaptionDiagnostics {
  return {
    emit(event, fields) {
      console.info(JSON.stringify({
        event,
        requestId,
        ...fields,
        elapsedMs: fields.elapsedMs ?? Math.max(0, Date.now() - startedAt),
      }));
    },
  };
}
