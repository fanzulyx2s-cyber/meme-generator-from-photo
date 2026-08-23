// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemeGenerator } from "../meme-generator";

let creatorStatus = false;
let appendChildSpy: ReturnType<typeof vi.spyOn>;
let toDataUrlSpy: ReturnType<typeof vi.spyOn>;

vi.mock("../../hooks/use-creator-license", () => ({
  useCreatorLicense: () => ({ isCreator: creatorStatus }),
}));

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

  it("shows the optional Creator upgrade once after the third successful free export", async () => {
    render(<MemeGenerator />);
    appendChildSpy.mockClear();

    const download = screen.getAllByRole("button", { name: "Download PNG" })[0];
    fireEvent.click(download);
    fireEvent.click(download);
    expect(screen.queryByRole("dialog", { name: "Upgrade to Creator" })).not.toBeInTheDocument();

    fireEvent.click(download);
    expect(await screen.findByRole("dialog", { name: "Upgrade to Creator" })).toBeVisible();
    expect(screen.getAllByRole("dialog", { name: "Upgrade to Creator" })).toHaveLength(1);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Continue with Free" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Continue with Free" }));
    fireEvent.click(download);
    expect(screen.queryByRole("dialog", { name: "Upgrade to Creator" })).not.toBeInTheDocument();
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
});
