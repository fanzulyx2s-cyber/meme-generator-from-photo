// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MemeGenerator } from "../meme-generator";

const canvasContext = new Proxy(
  {},
  {
    get: (_target, property) =>
      property === "measureText" ? () => ({ width: 100 }) : vi.fn(),
  },
) as CanvasRenderingContext2D;

const imageFile = (name = "photo.jpg") =>
  new File([new Uint8Array([1, 2, 3])], name, { type: "image/jpeg" });

function renderWithMainImage() {
  const view = render(<MemeGenerator />);
  const mainImageInput = view.container.querySelector(
    'input[type="file"][accept="image/png,image/jpeg,image/webp"]',
  );

  if (!mainImageInput) {
    throw new Error("Main image upload input was not rendered");
  }

  fireEvent.change(mainImageInput, { target: { files: [imageFile()] } });
  return view;
}

function toolbar() {
  const label = screen.getByText("Editing toolbar");
  const element = label.parentElement?.parentElement?.parentElement;

  if (!element) {
    throw new Error("Editing toolbar was not rendered");
  }

  return within(element);
}

function expectCanvasSettings() {
  const controls = toolbar();
  expect(controls.getByRole("button", { name: "Square 1:1" })).toBeVisible();
  expect(controls.getByRole("button", { name: "Portrait 4:5" })).toBeVisible();
  expect(controls.getByRole("button", { name: "Story 9:16" })).toBeVisible();
  expect(controls.getByRole("button", { name: "Frame On" })).toBeVisible();
  expect(controls.getByRole("button", { name: "Frame Off" })).toBeVisible();
  expect(controls.getByRole("button", { name: "Download PNG" })).toBeVisible();
}

describe("MemeGenerator editing toolbar", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test-image"),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps Canvas Settings visible after selecting top text", () => {
    renderWithMainImage();

    expectCanvasSettings();

    fireEvent.click(screen.getAllByRole("button", { name: "Select" })[0]);

    expectCanvasSettings();
    expect(toolbar().getByRole("button", { name: "Smaller" })).toBeVisible();
  });

  it("keeps the selected text tools after changing the output ratio", () => {
    renderWithMainImage();

    fireEvent.click(screen.getAllByRole("button", { name: "Select" })[0]);
    fireEvent.click(toolbar().getByRole("button", { name: "Story 9:16" }));

    expect(toolbar().getByRole("button", { name: "Smaller" })).toBeVisible();
    expect(toolbar().getByRole("button", { name: "Story 9:16" })).toHaveClass(
      "bg-[#ffde59]",
    );
  });

  it("keeps Canvas Settings visible after selecting bottom text", () => {
    renderWithMainImage();

    fireEvent.click(screen.getAllByRole("button", { name: "Select" })[1]);

    expectCanvasSettings();
    expect(toolbar().getByRole("button", { name: "Bigger" })).toBeVisible();
  });

  it("keeps Canvas Settings visible after selecting an emoji sticker", () => {
    renderWithMainImage();

    fireEvent.click(toolbar().getByRole("button", { name: "Add emoji" }));

    expectCanvasSettings();
    expect(toolbar().getByRole("button", { name: "Delete" })).toBeVisible();
  });

  it("keeps Canvas Settings visible after selecting an image sticker", () => {
    const view = renderWithMainImage();
    const imageStickerInput = view.container.querySelectorAll(
      'input[type="file"][accept="image/png,image/jpeg,image/webp"]',
    )[2];

    fireEvent.change(imageStickerInput, { target: { files: [imageFile("logo.jpg")] } });

    expectCanvasSettings();
    expect(toolbar().getByRole("button", { name: "Border On" })).toBeVisible();
  });

  it("continues to update the selected output ratio", () => {
    renderWithMainImage();

    fireEvent.click(toolbar().getByRole("button", { name: "Story 9:16" }));

    expect(toolbar().getByRole("button", { name: "Story 9:16" })).toHaveClass(
      "bg-[#ffde59]",
    );
  });
});
