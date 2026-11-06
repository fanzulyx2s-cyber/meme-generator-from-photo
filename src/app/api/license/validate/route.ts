import { NextResponse } from "next/server";
import {
  callCreemLicenseApi,
  normalizeInstanceId,
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
              : "Please activate your license again.",
      },
      { status: parsedBody.status },
    );
  }

  const payload =
    parsedBody.body && typeof parsedBody.body === "object" && !Array.isArray(parsedBody.body)
      ? (parsedBody.body as Record<string, unknown>)
      : null;
  const licenseKey = normalizeLicenseKey(payload?.licenseKey);
  const instanceId = normalizeInstanceId(payload?.instanceId);

  if (!licenseKey || !instanceId) {
    return NextResponse.json(
      { success: false, message: "Please activate your license again." },
      { status: 400 },
    );
  }

  const result = await callCreemLicenseApi({
    action: "validate",
    licenseKey,
    instanceId,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.statusCode },
    );
  }

  if (!("status" in result)) {
    return NextResponse.json(
      { success: false, message: "License validation failed. Please activate your license again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    isCreator: true,
    status: result.status,
    activation: result.activation,
    activationLimit: result.activationLimit,
    expiresAt: result.expiresAt,
  });
}
