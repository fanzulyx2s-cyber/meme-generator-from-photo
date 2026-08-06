// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiCaptionPanel } from "../ai-caption-panel";

const { compressImageForAi, requestAiCaptions } = vi.hoisted(() => ({
  compressImageForAi: vi.fn(),
  requestAiCaptions: vi.fn(),
}));

vi.mock("../../lib/ai/captions/browser-image", () => ({ compressImageForAi }));
vi.mock("../../lib/ai/captions/client", () => ({ requestAiCaptions }));

const createImageFile = (): File =>
  new File([new Uint8Array([1, 2, 3])], "synthetic-image.jpg", { type: "image/jpeg" });

describe("AiCaptionPanel", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requires consent before preparing or sending a photo", () => {
    render(<AiCaptionPanel file={createImageFile()} onUseCaption={vi.fn()} />);

    expect(compressImageForAi).not.toHaveBeenCalled();
    expect(requestAiCaptions).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Generate AI Captions" }));
    expect(screen.getByText(/compressed copy of your photo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(compressImageForAi).not.toHaveBeenCalled();
    expect(requestAiCaptions).not.toHaveBeenCalled();
  });

  it("uses a chosen caption only after the user selects it", async () => {
    const onUseCaption = vi.fn();
    compressImageForAi.mockResolvedValue({ imageBase64: "runtime-value", mimeType: "image/jpeg", byteSize: 12, width: 8, height: 8 });
    requestAiCaptions.mockResolvedValue(Array.from({ length: 5 }, (_, index) => ({ topText: `TOP ${index}`, bottomText: `BOTTOM ${index}` })));
    render(<AiCaptionPanel file={createImageFile()} onUseCaption={onUseCaption} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate AI Captions" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue With AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate 5 Captions" }));

    expect(await screen.findAllByRole("button", { name: "Use This Caption" })).toHaveLength(5);
    expect(onUseCaption).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Use This Caption" })[0]);
    expect(onUseCaption).toHaveBeenCalledWith({ topText: "TOP 0", bottomText: "BOTTOM 0" });
  });

  it("uses the selected style and allows a manual second generation", async () => {
    compressImageForAi.mockResolvedValue({ imageBase64: "runtime-value", mimeType: "image/jpeg", byteSize: 12, width: 8, height: 8 });
    requestAiCaptions.mockResolvedValue(Array.from({ length: 5 }, () => ({ topText: "TOP", bottomText: "BOTTOM" })));
    render(<AiCaptionPanel file={createImageFile()} onUseCaption={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate AI Captions" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue With AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Workplace" }));
    expect(screen.getByRole("button", { name: "Workplace" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Generate 5 Captions" }));
    await screen.findAllByRole("button", { name: "Use This Caption" });
    fireEvent.click(screen.getByRole("button", { name: "Generate More" }));
    await waitFor(() => expect(requestAiCaptions).toHaveBeenCalledTimes(2));
    expect(requestAiCaptions).toHaveBeenLastCalledWith(expect.objectContaining({ style: "workplace" }));
  });

  it("clears prior results when a new file arrives", async () => {
    compressImageForAi.mockResolvedValue({ imageBase64: "runtime-value", mimeType: "image/jpeg", byteSize: 12, width: 8, height: 8 });
    requestAiCaptions.mockResolvedValue(Array.from({ length: 5 }, () => ({ topText: "TOP", bottomText: "BOTTOM" })));
    const view = render(<AiCaptionPanel file={createImageFile()} onUseCaption={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Generate AI Captions" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue With AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Generate 5 Captions" }));
    await screen.findAllByRole("button", { name: "Use This Caption" });
    view.rerender(<AiCaptionPanel file={new File([new Uint8Array([4])], "new-image.jpg", { type: "image/jpeg" })} onUseCaption={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Generate AI Captions" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Use This Caption" })).not.toBeInTheDocument();
  });
});
