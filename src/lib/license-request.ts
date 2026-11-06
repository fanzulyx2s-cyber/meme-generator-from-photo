export const MAX_LICENSE_REQUEST_BYTES = 8_192;

export type BoundedJsonResult =
  | { ok: true; body: unknown }
  | { ok: false; status: 400 | 413 | 415 };

function isJsonContentType(contentType: string | null): boolean {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

function exceedsLimit(contentLength: string | null): boolean {
  return Boolean(contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_LICENSE_REQUEST_BYTES);
}

export async function readLicenseJsonRequest(request: Request): Promise<BoundedJsonResult> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, status: 415 };
  }

  if (exceedsLimit(request.headers.get("content-length"))) {
    return { ok: false, status: 413 };
  }

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
    return { ok: true, body: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
