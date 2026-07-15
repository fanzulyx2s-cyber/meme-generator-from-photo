"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";

const licenseKeyStorageKey = "memephotoai_license_key";
const instanceIdStorageKey = "memephotoai_license_instance_id";
const instanceNameStorageKey = "memephotoai_license_instance_name";
const licenseChangedEvent = "memephotoai-license-changed";

type CreatorLicenseStatus =
  | "free"
  | "activating"
  | "deactivating"
  | "validating"
  | "creator"
  | "error";

type LicenseApiSuccess = {
  success: true;
  status?: "active";
  isCreator?: boolean;
  instanceId?: string;
  message?: string;
  activation: number | null;
  activationLimit: number | null;
  expiresAt: string | null;
};

type LicenseApiError = {
  success: false;
  message?: string;
};

type LicenseApiResponse = LicenseApiSuccess | LicenseApiError;

function createInstanceName() {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, "0");

  return `MemePhoto AI Browser ${randomPart}`;
}

function getOrCreateInstanceName() {
  const savedName = window.localStorage.getItem(instanceNameStorageKey);

  if (savedName) {
    return savedName;
  }

  const instanceName = createInstanceName();
  window.localStorage.setItem(instanceNameStorageKey, instanceName);

  return instanceName;
}

function emitLicenseChanged(sourceId: string) {
  window.dispatchEvent(
    new CustomEvent(licenseChangedEvent, { detail: { sourceId } }),
  );
}

async function postLicenseRequest(
  path:
    | "/api/license/activate"
    | "/api/license/deactivate"
    | "/api/license/validate",
  body: Record<string, string>,
) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({
    success: false,
    message: "The license service returned an invalid response.",
  }))) as LicenseApiResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.success
        ? "License verification failed."
        : data.message ?? "License verification failed.",
    );
  }

  return data;
}

export function useCreatorLicense() {
  const sourceId = useId();
  const [status, setStatus] = useState<CreatorLicenseStatus>("free");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activation, setActivation] = useState<number | null>(null);
  const [activationLimit, setActivationLimit] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const applyCreatorState = useCallback((data: LicenseApiSuccess) => {
    setStatus("creator");
    setError("");
    setNotice("");
    setActivation(data.activation);
    setActivationLimit(data.activationLimit);
    setExpiresAt(data.expiresAt);
  }, []);

  const resetMetadata = useCallback(() => {
    setActivation(null);
    setActivationLimit(null);
    setExpiresAt(null);
  }, []);

  const validateLicense = useCallback(async () => {
    const licenseKey = window.localStorage.getItem(licenseKeyStorageKey);
    const instanceId = window.localStorage.getItem(instanceIdStorageKey);

    if (!licenseKey || !instanceId) {
      setStatus("free");
      setError("");
      setNotice("");
      resetMetadata();
      return;
    }

    setStatus("validating");
    setError("");
    setNotice("");

    try {
      const data = await postLicenseRequest("/api/license/validate", {
        licenseKey,
        instanceId,
      });

      applyCreatorState(data);
    } catch (requestError) {
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "License validation failed. Please activate your license again.",
      );
      setNotice("");
      resetMetadata();
    }
  }, [applyCreatorState, resetMetadata]);

  const activateLicense = useCallback(
    async (inputLicenseKey: string) => {
      const licenseKey = inputLicenseKey.trim();

      if (!licenseKey) {
        setStatus("error");
        setError("Please enter your license key.");
        setNotice("");
        return;
      }

      const instanceName = getOrCreateInstanceName();
      setStatus("activating");
      setError("");
      setNotice("");

      try {
        const data = await postLicenseRequest("/api/license/activate", {
          licenseKey,
          instanceName,
        });

        if (!data.instanceId) {
          throw new Error("Activation succeeded but no browser instance was returned.");
        }

        window.localStorage.setItem(licenseKeyStorageKey, licenseKey);
        window.localStorage.setItem(instanceIdStorageKey, data.instanceId);
        window.localStorage.setItem(instanceNameStorageKey, instanceName);
        applyCreatorState(data);
        emitLicenseChanged(sourceId);
      } catch (requestError) {
        setStatus("error");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "License activation failed. Please try again.",
        );
        setNotice("");
        resetMetadata();
      }
    },
    [applyCreatorState, resetMetadata, sourceId],
  );

  const clearLicense = useCallback((successMessage = "") => {
    window.localStorage.removeItem(licenseKeyStorageKey);
    window.localStorage.removeItem(instanceIdStorageKey);
    window.localStorage.removeItem(instanceNameStorageKey);
    setStatus("free");
    setError("");
    setNotice(successMessage);
    resetMetadata();
    emitLicenseChanged(sourceId);
  }, [resetMetadata, sourceId]);

  const deactivateLicense = useCallback(async () => {
    const licenseKey = window.localStorage.getItem(licenseKeyStorageKey);
    const instanceId = window.localStorage.getItem(instanceIdStorageKey);

    if (!licenseKey || !instanceId) {
      setStatus("error");
      setError("The saved license instance could not be found.");
      setNotice("");
      resetMetadata();
      return;
    }

    setStatus("deactivating");
    setError("");
    setNotice("");

    try {
      const data = await postLicenseRequest("/api/license/deactivate", {
        licenseKey,
        instanceId,
      });

      clearLicense(data.message ?? "This browser has been deactivated.");
    } catch (requestError) {
      setStatus("creator");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "This browser could not be deactivated. Please try again.",
      );
      setNotice("");
    }
  }, [clearLicense, resetMetadata]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void validateLicense();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [validateLicense]);

  useEffect(() => {
    const handleLicenseChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ sourceId?: string }>).detail;

      if (detail?.sourceId === sourceId) {
        return;
      }

      void validateLicense();
    };

    window.addEventListener(licenseChangedEvent, handleLicenseChanged);

    return () => {
      window.removeEventListener(licenseChangedEvent, handleLicenseChanged);
    };
  }, [sourceId, validateLicense]);

  return useMemo(
    () => ({
      activateLicense,
      validateLicense,
      deactivateLicense,
      clearLicense,
      isCreator: status === "creator",
      status,
      error,
      notice,
      loading:
        status === "activating" ||
        status === "deactivating" ||
        status === "validating",
      activation,
      activationLimit,
      expiresAt,
    }),
    [
      activateLicense,
      validateLicense,
      deactivateLicense,
      clearLicense,
      status,
      error,
      notice,
      activation,
      activationLimit,
      expiresAt,
    ],
  );
}
