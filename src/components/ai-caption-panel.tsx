"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { compressImageForAi } from "../lib/ai/captions/browser-image";
import { AiCaptionClientError, requestAiCaptions } from "../lib/ai/captions/client";
import { captionStyles } from "../lib/ai/captions/types";
import type { CaptionStyle, MemeCaption } from "../lib/ai/captions/types";

type PanelState = "intro" | "consent" | "options" | "preparing" | "generating" | "results" | "error";

const styleLabels: Record<CaptionStyle, string> = {
  funny: "Funny",
  sarcastic: "Sarcastic",
  wholesome: "Wholesome",
  reaction: "Reaction",
  workplace: "Workplace",
};

const errorMessages: Record<string, string> = {
  AI_DISABLED: "AI captions are not available right now.",
  MISSING_CONFIGURATION: "AI captions are temporarily unavailable.",
  INVALID_IMAGE: "We couldn't prepare this image for AI captions.",
  IMAGE_TOO_LARGE: "This image is too large to analyze. Try a smaller photo.",
  UNSUPPORTED_IMAGE_TYPE: "AI captions support JPG, PNG, and WEBP images.",
  INVALID_STYLE: "Choose a valid caption style.",
  CONTENT_NOT_ALLOWED: "We couldn't generate captions for this photo.",
  PROVIDER_TIMEOUT: "Caption generation took too long. Please try again.",
  PROVIDER_RATE_LIMITED: "Too many caption requests. Please try again shortly.",
  INVALID_PROVIDER_RESPONSE: "We couldn't generate valid captions. Please try again.",
  AI_GENERATION_FAILED: "We couldn't generate captions. Please try again.",
};

export function AiCaptionPanel({ file, onUseCaption, onReset }: { file: File; onUseCaption: (caption: MemeCaption) => void; onReset?: () => void }) {
  const [state, setState] = useState<PanelState>("intro");
  const [style, setStyle] = useState<CaptionStyle>("funny");
  const [captions, setCaptions] = useState<MemeCaption[]>([]);
  const [error, setError] = useState<AiCaptionClientError | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("intro");
    setCaptions([]);
    setError(null);
    onReset?.();
  }, [onReset]);

  useEffect(() => reset, [file, reset]);

  async function generate() {
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setCaptions([]);
    setState("preparing");
    try {
      const image = await compressImageForAi(file);
      if (controller.signal.aborted) return;
      setState("generating");
      const nextCaptions = await requestAiCaptions({ ...image, style, signal: controller.signal });
      if (controller.signal.aborted) return;
      setCaptions(nextCaptions);
      setState("results");
    } catch (caught) {
      if (controller.signal.aborted) return;
      const clientError = caught instanceof AiCaptionClientError
        ? caught
        : new AiCaptionClientError(caught && typeof caught === "object" && "code" in caught ? String((caught as { code: string }).code) as never : "AI_GENERATION_FAILED");
      setError(clientError);
      setState("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  const isWorking = state === "preparing" || state === "generating";
  const cancelWork = () => {
    abortRef.current?.abort();
    setState("options");
  };

  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-sm" aria-label="AI Meme Captions">
      <h3 className="text-xl font-black text-zinc-950">AI Meme Captions</h3>
      {state === "intro" && <><p className="mt-2 text-sm leading-6 text-zinc-600">Get five caption ideas based on your uploaded photo.</p><button type="button" onClick={() => setState("consent")} className="mt-4 rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">Generate AI Captions</button></>}
      {state === "consent" && <div className="mt-4"><p className="text-sm leading-6 text-zinc-600">To generate meme captions, a compressed copy of your photo will be securely sent to our AI provider for analysis. Manual editing stays in your browser.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setState("options")} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">Continue With AI</button><button type="button" onClick={reset} className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-700">Cancel</button></div></div>}
      {state === "options" && <div className="mt-4"><p className="text-sm font-black text-zinc-900">Choose a style</p><div className="mt-3 flex flex-wrap gap-2">{captionStyles.map((item) => <button key={item} type="button" aria-pressed={style === item} onClick={() => setStyle(item)} className={`rounded-full px-4 py-2 text-sm font-black ${style === item ? "bg-zinc-950 text-white" : "border border-zinc-300 bg-white text-zinc-700"}`}>{styleLabels[item]}</button>)}</div><button type="button" onClick={generate} className="mt-4 rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">Generate 5 Captions</button></div>}
      {isWorking && <div className="mt-4" role="status" aria-live="polite"><p className="text-sm font-semibold text-zinc-600">{state === "preparing" ? "Preparing your photo..." : "Generating caption ideas..."}</p><button type="button" onClick={cancelWork} className="mt-3 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-black text-zinc-700">Cancel</button></div>}
      {state === "results" && <div className="mt-4 space-y-3">{captions.map((caption, index) => <article key={`${caption.topText}-${index}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"><p className="text-xs font-black uppercase text-zinc-500">Top Text</p><p className="mt-1 font-black text-zinc-950">{caption.topText}</p><p className="mt-3 text-xs font-black uppercase text-zinc-500">Bottom Text</p><p className="mt-1 font-black text-zinc-950">{caption.bottomText}</p><button type="button" onClick={() => onUseCaption(caption)} className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-black text-white">Use This Caption</button></article>)}<div className="flex flex-wrap gap-2"><button type="button" onClick={generate} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">Generate More</button><button type="button" onClick={reset} className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-700">Close</button></div></div>}
      {state === "error" && error && <div className="mt-4" role="alert"><p className="text-sm font-semibold text-zinc-700">{errorMessages[error.code] ?? error.message}</p><div className="mt-3 flex flex-wrap gap-2">{error.retryable && <button type="button" onClick={generate} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">Try Again</button>}<button type="button" onClick={reset} className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-700">Close</button></div></div>}
    </section>
  );
}
