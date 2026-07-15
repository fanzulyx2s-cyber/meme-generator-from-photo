import { NextResponse } from "next/server";
import {
  callCreemLicenseApi,
  normalizeInstanceName,
  normalizeLicenseKey,
} from "@/lib/creem-license";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Please enter a valid license key." },
      { status: 400 },
    );
  }

  const payload =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  const licenseKey = normalizeLicenseKey(payload?.licenseKey);
  const instanceName = normalizeInstanceName(payload?.instanceName);

  if (!licenseKey || !instanceName) {
    return NextResponse.json(
      {
        success: false,
        message: "Please enter a valid license key and browser instance name.",
      },
      { status: 400 },
    );
  }

  const result = await callCreemLicenseApi({
    action: "activate",
    licenseKey,
    instanceName,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.statusCode },
    );
  }

  return NextResponse.json(result);
}
