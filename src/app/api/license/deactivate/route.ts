import { NextResponse } from "next/server";
import {
  callCreemLicenseApi,
  normalizeInstanceId,
  normalizeLicenseKey,
} from "@/lib/creem-license";
import { parseLicenseRequest } from "@/lib/license-request";

export async function POST(request: Request) {
  const parsed = await parseLicenseRequest(request, "instanceId");

  if (!parsed.ok) {
    return NextResponse.json(
      {
        success: false,
        message:
          parsed.status === 415
            ? "License requests must use application/json."
            : parsed.status === 413
              ? "The license request is too large."
              : "This browser could not be deactivated. Please try again.",
      },
      { status: parsed.status },
    );
  }

  const licenseKey = normalizeLicenseKey(parsed.body.licenseKey);
  const instanceId = normalizeInstanceId(parsed.body.instanceId);

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
