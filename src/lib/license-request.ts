export const MAX_LICENSE_REQUEST_BYTES = 4096;

export type LicenseRequestField = "instanceName" | "instanceId";

type ParsedLicenseRequest =
  | {
      ok: true;
      body: Record<"licenseKey" | LicenseRequestField, string>;
    }
  | {
      ok: false;
      status: 400 | 413 | 415;
    };

function isJsonContentType(contentType: string | null): boolean {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function contentLengthExceedsLimit(contentLength: string | null): boolean {
  return Boolean(contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_LICENSE_REQUEST_BYTES);
}

async function readBoundedJson(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; status: 400 | 413 }> {
  if (!request.body) return { ok: false, status: 400 };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_LICENSE_REQUEST_BYTES) {
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
    return {
      ok: true,
      body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return { ok: false, status: 400 };
  }
}

function isExactLicensePayload(
  body: unknown,
  field: LicenseRequestField,
): body is Record<"licenseKey" | LicenseRequestField, string> {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;

  const payload = body as Record<string, unknown>;
  const allowedKeys = new Set(["licenseKey", field]);

  return (
    Object.keys(payload).length === allowedKeys.size &&
    Object.keys(payload).every((key) => allowedKeys.has(key)) &&
    typeof payload.licenseKey === "string" &&
    typeof payload[field] === "string"
  );
}

export async function parseLicenseRequest(
  request: Request,
  field: LicenseRequestField,
): Promise<ParsedLicenseRequest> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, status: 415 };
  }

  if (contentLengthExceedsLimit(request.headers.get("content-length"))) {
    return { ok: false, status: 413 };
  }

  const parsed = await readBoundedJson(request);
  if (!parsed.ok) return parsed;

  if (!isExactLicensePayload(parsed.body, field)) {
    return { ok: false, status: 400 };
  }

  return { ok: true, body: parsed.body };
}
