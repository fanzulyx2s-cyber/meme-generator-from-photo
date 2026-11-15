// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CreatorCheckoutButton } from "../creator-checkout-button";
import { CreatorLicensePanel } from "../creator-license-panel";
import { ConversionEventTracker } from "../google-analytics";

const { trackCreatorConversion } = vi.hoisted(() => ({
  trackCreatorConversion: vi.fn(),
}));

const creatorLicenseState = {
  activateLicense: vi.fn(),
  deactivateLicense: vi.fn(),
  isCreator: false,
  status: "idle",
  error: null,
  notice: null,
  loading: false,
  activation: null,
  activationLimit: null,
};

vi.mock("../../lib/analytics/ga4", () => ({ trackCreatorConversion }));

vi.mock("../../hooks/use-creator-license", () => ({
  useCreatorLicense: () => creatorLicenseState,
}));

describe("Creator conversion events", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    Object.assign(creatorLicenseState, {
      isCreator: false,
      status: "idle",
      error: null,
      notice: null,
      loading: false,
      activation: null,
      activationLimit: null,
    });
  });

  it("tracks the pricing checkout entry point", () => {
    vi.stubEnv("NEXT_PUBLIC_CREEM_CHECKOUT_URL", "https://example.invalid/creator");

    render(<CreatorCheckoutButton>Buy Creator</CreatorCheckoutButton>);
    fireEvent.click(screen.getByRole("button", { name: "Buy Creator" }));

    expect(trackCreatorConversion).toHaveBeenCalledWith(
      "creator_checkout_clicked",
      { source: "pricing_page" },
    );
  });

  it("tracks the Creator activation entry point", () => {
    render(<CreatorLicensePanel />);

    expect(trackCreatorConversion).toHaveBeenCalledWith(
      "creator_activation_opened",
    );
  });

  it("prominently explains how to release an activation before clearing data", () => {
    Object.assign(creatorLicenseState, {
      isCreator: true,
      activation: 1,
      activationLimit: 3,
    });

    render(<CreatorLicensePanel />);

    expect(screen.getByRole("note")).toHaveTextContent(
      "Before clearing browser data or switching devices",
    );
    expect(screen.getByRole("note")).toHaveTextContent(
      "Clearing browser data alone does not release it in Creem.",
    );
    expect(
      screen.getByRole("button", { name: "Deactivate this browser" }),
    ).toBeInTheDocument();
  });

  it("tracks the Creator license-panel checkout entry point", () => {
    vi.stubEnv("NEXT_PUBLIC_CREEM_CHECKOUT_URL", "https://example.invalid/creator");

    render(<CreatorLicensePanel />);
    fireEvent.click(screen.getByRole("button", { name: "Buy Creator Plan" }));

    expect(trackCreatorConversion).toHaveBeenCalledWith(
      "creator_checkout_clicked",
      { source: "creator_license_panel" },
    );
  });

  it("tracks the payment-success page view", () => {
    render(<ConversionEventTracker event="creator_purchase_success_viewed" />);

    expect(trackCreatorConversion).toHaveBeenCalledWith(
      "creator_purchase_success_viewed",
    );
  });
});
