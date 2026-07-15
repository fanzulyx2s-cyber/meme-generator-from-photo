import { NextResponse } from "next/server";
import {
  callCreemLicenseApi,
  normalizeInstanceId,
  normalizeLicenseKey,
} from "@/lib/creem-license";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "This browser could not be deactivated. Please try again.",
      },
      { status: 400 },
    );
  }

  const payload =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  const licenseKey = normalizeLicenseKey(payload?.licenseKey);
  const instanceId = normalizeInstanceId(payload?.instanceId);

  if (!licenseKey || !instanceId) {
    return NextResponse.json(
      {
        success: false,
        message: "The saved license instance could not be found.",
      },
      { status: 400 },
    );
  }

  const result = await callCreemLicenseApi({
    action: "deactivate",
    licenseKey,
    instanceId,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.statusCode },
    );
  }

  return NextResponse.json(result);
}
