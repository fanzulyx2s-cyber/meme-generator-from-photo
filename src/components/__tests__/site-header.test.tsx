// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "../site-header";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

const renderHeaderAt = (pathname: string) => {
  usePathname.mockReturnValue(pathname);
  render(<SiteHeader />);
};

describe("SiteHeader", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it.each([
    ["/", "Generator"],
    ["/photo-reaction-meme-maker", "Reaction memes"],
    ["/how-to-make-a-meme-from-a-photo", "How-to guide"],
    ["/pricing", "Pricing"],
    ["/no-watermark-meme-maker", "Pricing"],
  ])("marks %s as the current navigation item", (pathname, label) => {
    renderHeaderAt(pathname);

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
  });

  it.each([
    "/success",
    "/cancel",
    "/privacy",
    "/terms",
    "/acceptable-use",
    "/refund",
    "/contact",
    "/this-page-does-not-exist",
    "/how-to-make-a-meme-from-a-photo/extra",
  ])(
    "does not mark a navigation item current for %s",
    (pathname) => {
      renderHeaderAt(pathname);

      expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
    },
  );
});
