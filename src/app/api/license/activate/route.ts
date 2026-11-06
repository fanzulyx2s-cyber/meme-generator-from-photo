import { NextResponse } from "next/server";
import {
  callCreemLicenseApi,
  normalizeInstanceName,
  normalizeLicenseKey,
} from "@/lib/creem-license";
import { readLicenseJsonRequest } from "../../../../lib/license-request";

export async function POST(request: Request) {
  const parsedBody = await readLicenseJsonRequest(request);

  if (!parsedBody.ok) {
    return NextResponse.json(
      {
        success: false,
        message:
          parsedBody.status === 415
            ? "Content-Type must be application/json."
            : parsedBody.status === 413
              ? "The license request is too large."
              : "Please enter a valid license key.",
      },
      { status: parsedBody.status },
    );
  }

  const payload =
    parsedBody.body && typeof parsedBody.body === "object" && !Array.isArray(parsedBody.body)
      ? (parsedBody.body as Record<string, unknown>)
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
