"use client";

import { FormEvent, useState } from "react";
import { useCreatorLicense } from "@/hooks/use-creator-license";

type CreatorLicensePanelProps = {
  variant?: "full" | "compact";
};

export function CreatorLicensePanel({
  variant = "full",
}: CreatorLicensePanelProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const {
    activateLicense,
    deactivateLicense,
    isCreator,
    status,
    error,
    notice,
    loading,
    activation,
    activationLimit,
  } = useCreatorLicense();
  const checkoutUrl = process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void activateLicense(licenseKey);
  };

  const handleDeactivate = () => {
    if (!window.confirm("Deactivate Creator access on this browser?")) {
      return;
    }

    void deactivateLicense();
  };
  const isCompact = variant === "compact";
  const sectionClassName = isCompact
    ? "overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#fffaf3,#fff7c2_48%,#f5fbff)] p-5 shadow-sm md:p-6"
    : "rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm";
  const activeSectionClassName = isCompact
    ? "overflow-hidden rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#fffaf3,#fff3bf_48%,#d8fbff)] p-5 shadow-sm md:p-6"
    : "rounded-[2rem] border border-black/10 bg-[linear-gradient(135deg,#fffaf3,#fff3bf_48%,#d8fbff)] p-6 shadow-sm";
  const contentClassName = isCompact
    ? "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
    : "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between";
  const formClassName = isCompact
    ? "grid w-full gap-3 lg:max-w-md"
    : "grid w-full gap-3 lg:max-w-sm";
  const titleClassName = isCompact
    ? "mt-3 text-2xl font-black"
    : "mt-4 text-2xl font-black";

  if (isCreator) {
    return (
      <section className={activeSectionClassName}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="w-fit rounded-full bg-[#ffde59] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              LICENSE
            </p>
            <h2 className={titleClassName}>Creator Plan Active</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-zinc-600">
              This browser is activated for MemePhoto AI Creator features.
            </p>
            {activation !== null && activationLimit !== null ? (
              <p className="mt-3 text-sm font-black text-zinc-950">
                Activations: {activation} of {activationLimit}
              </p>
            ) : null}
            <p className="mt-3 max-w-2xl text-xs font-semibold leading-5 text-zinc-500">
              Deactivating releases this browser&apos;s activation slot in Creem
              and removes locally saved Creator access.
            </p>
            {error ? (
              <p className="mt-3 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={loading}
            className="w-full rounded-full border border-zinc-950/15 bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
          >
            {status === "deactivating"
              ? "Deactivating..."
              : "Deactivate this browser"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClassName}>
      <div className={contentClassName}>
        <div className="max-w-2xl">
          <p className="w-fit rounded-full bg-[#ffde59] px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
            {isCompact ? "CREATOR ACCESS" : "Already purchased?"}
          </p>
          <h2 className={titleClassName}>Unlock Creator Plan</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
            {isCompact
              ? "Already purchased? Enter your Creem license key to activate Creator features on this browser."
              : "Already purchased? Enter the license key included in your Creem receipt to activate Creator features on this browser."}
          </p>
          {status === "validating" ? (
            <p className="mt-3 text-sm font-black text-zinc-700">
              {isCompact ? "Verifying license..." : "Checking saved license..."}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="mt-3 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {notice}
            </p>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className={formClassName}>
          <label
            htmlFor="creator-license-key"
            className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500"
          >
            License key
          </label>
          <input
            id="creator-license-key"
            type="text"
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
            className="rounded-full border border-black/10 bg-[#fffaf3] px-5 py-3 text-sm font-bold text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950"
            autoComplete="off"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "activating" ? "Activating..." : "Activate License"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!checkoutUrl) {
                  window.alert("Payment link is not available yet.");
                  return;
                }

                window.location.href = checkoutUrl;
              }}
              className="rounded-full border border-zinc-950/15 bg-white px-5 py-3 text-sm font-black text-zinc-950 transition hover:border-zinc-950"
            >
              Buy Creator Plan
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
