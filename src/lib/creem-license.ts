import "server-only";

export type LicenseAction = "activate" | "deactivate" | "validate";

type CreemLicenseRequest = {
  action: LicenseAction;
  licenseKey: string;
  instanceName?: string;
  instanceId?: string;
};

type SanitizedLicenseResponse = {
  success: true;
  status: "active";
  instanceId?: string;
  instanceStatus?: "active";
  activation: number | null;
  activationLimit: number | null;
  expiresAt: string | null;
};

export type LicenseResult =
  | SanitizedLicenseResponse
  | {
      success: true;
      message: string;
      activation: number | null;
      activationLimit: number | null;
    }
  | {
      success: false;
      message: string;
      statusCode: number;
    };

const requestTimeoutMs = 10000;
const maxLicenseKeyLength = 256;
const maxInstanceNameLength = 120;
const maxInstanceIdLength = 256;
const allowedCreemApiBaseUrls = new Set([
  "https://test-api.creem.io/v1",
  "https://api.creem.io/v1",
]);

function getRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function getNestedRecord(
  source: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  return getRecord(source[key]);
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function findFirstString(
  source: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = getString(source[key]);

    if (value) {
      return value;
    }
  }

  return null;
}

function findFirstNumber(
  source: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = getNumber(source[key]);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function getInstanceRecord(source: Record<string, unknown>) {
  const direct = getNestedRecord(source, "instance");

  if (direct) {
    return direct;
  }

  const instances = source.instances;

  if (Array.isArray(instances)) {
    for (const instance of instances) {
      const record = getRecord(instance);

      if (record) {
        return record;
      }
    }
  }

  return null;
}

function extractStatus(source: Record<string, unknown>) {
  const license = getNestedRecord(source, "license");

  return (
    findFirstString(source, ["status", "license_status"]) ??
    (license ? findFirstString(license, ["status", "license_status"]) : null)
  );
}

function extractProductId(source: Record<string, unknown>) {
  const license = getNestedRecord(source, "license");
  const product = getNestedRecord(source, "product");

  return (
    findFirstString(source, ["product_id", "productId"]) ??
    (license ? findFirstString(license, ["product_id", "productId"]) : null) ??
    (product ? findFirstString(product, ["id", "product_id", "productId"]) : null)
  );
}

function extractInstanceId(source: Record<string, unknown>) {
  const instance = getInstanceRecord(source);

  return (
    findFirstString(source, ["instance_id", "instanceId"]) ??
    (instance ? findFirstString(instance, ["id", "instance_id", "instanceId"]) : null)
  );
}

function extractInstanceStatus(source: Record<string, unknown>) {
  const instance = getInstanceRecord(source);

  return (
    findFirstString(source, ["instance_status", "instanceStatus"]) ??
    (instance ? findFirstString(instance, ["status", "instance_status"]) : null)
  );
}

function extractActivation(source: Record<string, unknown>) {
  const license = getNestedRecord(source, "license");

  return (
    findFirstNumber(source, ["activation", "activations", "activation_count"]) ??
    (license
      ? findFirstNumber(license, ["activation", "activations", "activation_count"])
      : null)
  );
}

function extractActivationLimit(source: Record<string, unknown>) {
  const license = getNestedRecord(source, "license");

  return (
    findFirstNumber(source, [
      "activationLimit",
      "activation_limit",
      "activation_limit_count",
    ]) ??
    (license
      ? findFirstNumber(license, [
          "activationLimit",
          "activation_limit",
          "activation_limit_count",
        ])
      : null)
  );
}

function extractExpiresAt(source: Record<string, unknown>) {
  const license = getNestedRecord(source, "license");

  return (
    findFirstString(source, ["expires_at", "expiresAt"]) ??
    (license ? findFirstString(license, ["expires_at", "expiresAt"]) : null)
  );
}

function getSafeFailureMessage(action: LicenseAction, status: number) {
  if (action === "deactivate") {
    if (status === 400) {
      return "This browser could not be deactivated. Please try again.";
    }

    if (status === 401 || status === 403) {
      return "License deactivation is not configured correctly.";
    }

    if (status === 404) {
      return "The saved license instance could not be found.";
    }

    if (status === 429) {
      return "Too many license requests. Please try again later.";
    }

    return "License deactivation is temporarily unavailable.";
  }

  return action === "activate"
    ? "License activation failed. Please check your license key and try again."
    : "License validation failed. Please activate your license again.";
}

export function normalizeLicenseKey(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const licenseKey = value.trim();

  if (!licenseKey || licenseKey.length > maxLicenseKeyLength) {
    return null;
  }

  return licenseKey;
}

export function normalizeInstanceName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const instanceName = value.trim();

  if (!instanceName || instanceName.length > maxInstanceNameLength) {
    return null;
  }

  return instanceName;
}

export function normalizeInstanceId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const instanceId = value.trim();

  if (!instanceId || instanceId.length > maxInstanceIdLength) {
    return null;
  }

  return instanceId;
}

export function sanitizeCreemLicenseResponse(
  action: LicenseAction,
  rawResponse: unknown,
  expectedProductId: string,
): LicenseResult {
  const response = getRecord(rawResponse);

  if (!response) {
    return {
      success: false,
      message: "The license service returned an invalid response.",
      statusCode: 502,
    };
  }

  const licenseStatus = extractStatus(response);

  if (licenseStatus !== "active") {
    return {
      success: false,
      message: "This license is not active.",
      statusCode: 400,
    };
  }

  const productId = extractProductId(response);

  if (productId && productId !== expectedProductId) {
    return {
      success: false,
      message: "This license is not valid for MemePhoto AI Creator Plan.",
      statusCode: 400,
    };
  }

  if (action === "validate" && !productId) {
    return {
      success: false,
      message: "The license product could not be verified.",
      statusCode: 400,
    };
  }

  const instanceId = extractInstanceId(response);
  const instanceStatus = extractInstanceStatus(response);

  if (action === "activate" && !instanceId) {
    return {
      success: false,
      message: "The license activation did not return a browser instance.",
      statusCode: 502,
    };
  }

  if (action === "validate" && instanceStatus !== "active") {
    return {
      success: false,
      message: "This browser activation is not active.",
      statusCode: 400,
    };
  }

  return {
    success: true,
    status: "active",
    instanceId: instanceId ?? undefined,
    instanceStatus: instanceStatus === "active" ? "active" : undefined,
    activation: extractActivation(response),
    activationLimit: extractActivationLimit(response),
    expiresAt: extractExpiresAt(response),
  };
}

export function sanitizeCreemDeactivateResponse(
  rawResponse: unknown,
): LicenseResult {
  const response = getRecord(rawResponse) ?? {};

  return {
    success: true,
    message: "This browser has been deactivated.",
    activation: extractActivation(response),
    activationLimit: extractActivationLimit(response),
  };
}

function getEnvConfig(): LicenseResult | {
  apiKey: string;
  apiBaseUrl: string;
  productId: string;
} {
  const apiKey = process.env.CREEM_API_KEY?.trim();
  const apiBaseUrl = process.env.CREEM_API_BASE_URL?.trim();
  const productId = process.env.CREEM_LICENSE_PRODUCT_ID?.trim();

  if (!apiKey || !apiBaseUrl || !productId) {
    return {
      success: false,
      message: "License service is not configured yet.",
      statusCode: 503,
    };
  }

  let parsedApiBaseUrl: URL;

  try {
    parsedApiBaseUrl = new URL(apiBaseUrl);
  } catch {
    return {
      success: false,
      message: "License service configuration is invalid.",
      statusCode: 503,
    };
  }

  if (
    parsedApiBaseUrl.protocol !== "https:" ||
    !allowedCreemApiBaseUrls.has(apiBaseUrl)
  ) {
    return {
      success: false,
      message: "License service configuration is invalid.",
      statusCode: 503,
    };
  }

  if (!/^prod_[!-~]+$/.test(productId) || /[\s/?#]/.test(productId)) {
    return {
      success: false,
      message: "License product configuration is invalid.",
      statusCode: 503,
    };
  }

  return { apiKey, apiBaseUrl, productId };
}

async function postToCreemLicenseApi({
  action,
  apiKey,
  apiBaseUrl,
  licenseKey,
  instanceName,
  instanceId,
}: CreemLicenseRequest & {
  apiKey: string;
  apiBaseUrl: string;
}) {
  const endpoint = action;
  const requestBody =
    action === "activate"
      ? { key: licenseKey, instance_name: instanceName }
      : { key: licenseKey, instance_id: instanceId };

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/licenses/${endpoint}`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(requestTimeoutMs),
    },
  );

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  return { response, responseBody };
}

function getNetworkFailure(action: LicenseAction, error: unknown): LicenseResult {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return {
      success: false,
      message:
        action === "deactivate"
          ? "License deactivation timed out. Please try again."
          : "The license service timed out. Please try again.",
      statusCode: 504,
    };
  }

  return {
    success: false,
    message:
      action === "deactivate"
        ? "License deactivation is temporarily unavailable."
        : "The license service is temporarily unavailable.",
    statusCode: 503,
  };
}

async function rollbackActivation(
  config: { apiKey: string; apiBaseUrl: string },
  licenseKey: string,
  instanceId: string,
) {
  try {
    const { response } = await postToCreemLicenseApi({
      action: "deactivate",
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      licenseKey,
      instanceId,
    });

    if (!response.ok && response.status !== 409) {
      console.warn("License activation rollback failed.", {
        category: "upstream-error",
        statusCode: response.status,
      });
    }
  } catch (error) {
    console.warn("License activation rollback failed.", {
      category:
        error instanceof DOMException && error.name === "TimeoutError"
          ? "timeout"
          : "network-error",
    });
  }
}

export async function callCreemLicenseApi({
  action,
  licenseKey,
  instanceName,
  instanceId,
}: CreemLicenseRequest): Promise<LicenseResult> {
  const config = getEnvConfig();

  if ("success" in config) {
    return config;
  }

  try {
    const { response, responseBody } = await postToCreemLicenseApi({
      action,
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      licenseKey,
      instanceName,
      instanceId,
    });

    if (action === "deactivate" && response.status === 409) {
      return {
        success: true,
        message: "This browser has been deactivated.",
        activation: null,
        activationLimit: null,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: getSafeFailureMessage(action, response.status),
        statusCode: response.status >= 500 ? 502 : response.status,
      };
    }

    if (action === "deactivate") {
      return sanitizeCreemDeactivateResponse(responseBody);
    }

    if (!responseBody) {
      return {
        success: false,
        message: "The license service returned an invalid response.",
        statusCode: 502,
      };
    }

    const sanitized = sanitizeCreemLicenseResponse(
      action,
      responseBody,
      config.productId,
    );

    if (action === "activate" && !sanitized.success) {
      const activatedInstanceId = extractInstanceId(
        getRecord(responseBody) ?? {},
      );

      if (activatedInstanceId) {
        await rollbackActivation(config, licenseKey, activatedInstanceId);
      }
    }

    return sanitized;
  } catch (error) {
    return getNetworkFailure(action, error);
  }
}
