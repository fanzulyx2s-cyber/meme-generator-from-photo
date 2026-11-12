// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemeGenerator } from "../meme-generator";

let creatorStatus = false;
let appendChildSpy: ReturnType<typeof vi.spyOn>;
let toDataUrlSpy: ReturnType<typeof vi.spyOn>;

const { trackCreatorConversion } = vi.hoisted(() => ({
  trackCreatorConversion: vi.fn(),
}));

vi.mock("../../hooks/use-creator-license", () => ({
  useCreatorLicense: () => ({ isCreator: creatorStatus }),
}));

vi.mock("../../lib/analytics/ga4", () => ({ trackCreatorConversion }));

const canvasContext = new Proxy(
  {},
  {
    get: (_target, property) =>
      property === "measureText" ? () => ({ width: 100 }) : vi.fn(),
  },
) as CanvasRenderingContext2D;

describe("MemeGenerator export entitlement", () => {
  beforeEach(() => {
    creatorStatus = false;
    trackCreatorConversion.mockClear();
    window.localStorage.clear();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:export"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext);
    toDataUrlSpy = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/png;base64,dGVzdA==");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    appendChildSpy = vi.spyOn(document.body, "appendChild");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("allows two free exports, then reopens the Creator upgrade from either export button", async () => {
    render(<MemeGenerator />);
    appendChildSpy.mockClear();

    const download = screen.getAllByRole("button", { name: "Download PNG" })[0];
    fireEvent.click(download);
    expect(screen.queryByRole("dialog", { name: "Upgrade to Creator" })).not.toBeInTheDocument();
    expect(trackCreatorConversion).toHaveBeenCalledWith("free_export_success", {
      export_number: 1,
    });

    fireEvent.click(download);
    expect(await screen.findByRole("dialog", { name: "Upgrade to Creator" })).toBeVisible();
    expect(screen.getAllByRole("dialog", { name: "Upgrade to Creator" })).toHaveLength(1);
    expect(trackCreatorConversion).toHaveBeenCalledWith("creator_upgrade_shown");
    expect(trackCreatorConversion).toHaveBeenCalledWith("free_export_success", {
      export_number: 2,
    });
    expect(screen.getByText("$9 one-time purchase — not a subscription.")).toBeVisible();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Keep editing" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Free exports used" })).toHaveLength(2);
    expect(appendChildSpy).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("dialog", { name: "Upgrade to Creator" })).not.toBeInTheDocument();
    const exhaustedButtons = screen.getAllByRole("button", { name: "Free exports used" });
    expect(exhaustedButtons).toHaveLength(2);
    expect(exhaustedButtons[0]).toBeEnabled();
    expect(exhaustedButtons[1]).toBeEnabled();

    fireEvent.click(exhaustedButtons[0]);
    expect(screen.getByRole("dialog", { name: "Upgrade to Creator" })).toBeVisible();
    expect(appendChildSpy).toHaveBeenCalledTimes(2);
    expect(trackCreatorConversion).toHaveBeenCalledWith("free_export_limit_reached");

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Free exports used" })[1]);
    expect(screen.getByRole("dialog", { name: "Upgrade to Creator" })).toBeVisible();
    expect(appendChildSpy).toHaveBeenCalledTimes(2);
  });

  it("does not show the free upgrade prompt for Creator exports", () => {
    creatorStatus = true;
    render(<MemeGenerator />);

    const download = screen.getAllByRole("button", { name: "Download PNG" })[0];
    fireEvent.click(download);
    fireEvent.click(download);
    fireEvent.click(download);

    expect(screen.queryByRole("dialog", { name: "Upgrade to Creator" })).not.toBeInTheDocument();
  });

  it("uses a synchronous PNG data URL while the download is still user initiated", () => {
    render(<MemeGenerator />);

    fireEvent.click(screen.getAllByRole("button", { name: "Download PNG" })[0]);

    expect(toDataUrlSpy).toHaveBeenCalledWith("image/png");
  });

  it("keeps the server markup independent of the browser-only export count", async () => {
    window.localStorage.setItem("memephotoai_free_export_count", "1");

    expect(renderToString(<MemeGenerator />)).toContain(
      "2 free PNG exports remaining in this browser.",
    );

    render(<MemeGenerator />);
    expect(
      await screen.findByText("1 free PNG export remaining in this browser."),
    ).toBeVisible();
  });
});
