import { NextResponse } from "next/server";
import {
  callCreemLicenseApi,
  normalizeInstanceName,
  normalizeLicenseKey,
} from "@/lib/creem-license";
import { parseLicenseRequest } from "@/lib/license-request";

export async function POST(request: Request) {
  const parsed = await parseLicenseRequest(request, "instanceName");

  if (!parsed.ok) {
    return NextResponse.json(
      {
        success: false,
        message:
          parsed.status === 415
            ? "License requests must use application/json."
            : parsed.status === 413
              ? "The license request is too large."
              : "Please enter a valid license key.",
      },
      { status: parsed.status },
    );
  }

  const licenseKey = normalizeLicenseKey(parsed.body.licenseKey);
  const instanceName = normalizeInstanceName(parsed.body.instanceName);

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
