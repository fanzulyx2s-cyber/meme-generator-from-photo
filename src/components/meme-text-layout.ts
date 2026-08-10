export type MemeOutputRatioId = "square" | "portrait" | "story";
export type MemeTextPosition = "top" | "bottom";

type NormalizedMemeTextLayoutPreset = {
  maxTextWidth: number;
  topSafeInset: number;
  bottomSafeInset: number;
  initialFontSize: number;
  minFontSize: number;
  maxFontSize: number;
};

export type MemeTextLayoutPreset = NormalizedMemeTextLayoutPreset;

export type MemeTextLayout = {
  lines: string[];
  fontSize: number;
  initialFontSize: number;
  lineHeight: number;
  strokeWidth: number;
  x: number;
  y: number;
  bounds: { x: number; y: number; width: number; height: number };
  safeBounds: { left: number; top: number; right: number; bottom: number };
  topSafeInset: number;
  bottomSafeInset: number;
};

type CalculateMemeTextLayoutOptions = {
  text: string;
  position: MemeTextPosition;
  ratio: MemeOutputRatioId;
  frameEnabled: boolean;
  canvasWidth: number;
  canvasHeight: number;
  measureText?: (value: string, fontSize: number) => number;
};

const memeTextLayoutPresets: Record<
  MemeOutputRatioId,
  { frameOn: NormalizedMemeTextLayoutPreset; frameOff: NormalizedMemeTextLayoutPreset }
> = {
  square: {
    frameOn: {
      maxTextWidth: 0.78,
      topSafeInset: 0.055,
      bottomSafeInset: 0.075,
      initialFontSize: 0.062,
      minFontSize: 0.038,
      maxFontSize: 0.068,
    },
    frameOff: {
      maxTextWidth: 0.78,
      topSafeInset: 0.055,
      bottomSafeInset: 0.075,
      initialFontSize: 0.062,
      minFontSize: 0.038,
      maxFontSize: 0.068,
    },
  },
  portrait: {
    frameOn: {
      maxTextWidth: 0.8,
      topSafeInset: 0.045,
      bottomSafeInset: 0.065,
      initialFontSize: 0.055,
      minFontSize: 0.034,
      maxFontSize: 0.061,
    },
    frameOff: {
      maxTextWidth: 0.8,
      topSafeInset: 0.045,
      bottomSafeInset: 0.065,
      initialFontSize: 0.055,
      minFontSize: 0.034,
      maxFontSize: 0.061,
    },
  },
  story: {
    frameOn: {
      maxTextWidth: 0.82,
      topSafeInset: 0.035,
      bottomSafeInset: 0.055,
      initialFontSize: 0.048,
      minFontSize: 0.03,
      maxFontSize: 0.054,
    },
    frameOff: {
      maxTextWidth: 0.82,
      topSafeInset: 0.035,
      bottomSafeInset: 0.055,
      initialFontSize: 0.048,
      minFontSize: 0.03,
      maxFontSize: 0.054,
    },
  },
};

export function getMemeTextLayoutPreset(
  ratio: MemeOutputRatioId,
  frameEnabled: boolean,
): MemeTextLayoutPreset {
  const basePreset = memeTextLayoutPresets[ratio][frameEnabled ? "frameOn" : "frameOff"];
  return frameEnabled
    ? {
        ...basePreset,
        maxTextWidth: basePreset.maxTextWidth * 0.96,
        topSafeInset: basePreset.topSafeInset + 0.015,
        bottomSafeInset: basePreset.bottomSafeInset + 0.015,
      }
    : basePreset;
}

function defaultMeasureText(value: string, fontSize: number) {
  return Array.from(value).length * fontSize * 0.58;
}

function breakLongWord(
  word: string,
  maxWidth: number,
  fontSize: number,
  measureText: (value: string, fontSize: number) => number,
) {
  const pieces: string[] = [];
  let current = "";

  for (const character of Array.from(word)) {
    const candidate = `${current}${character}`;
    if (current && measureText(candidate, fontSize) > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
  }

  if (current) {
    pieces.push(current);
  }

  return pieces;
}

function wrapAtWordBoundaries(
  text: string,
  maxWidth: number,
  fontSize: number,
  measureText: (value: string, fontSize: number) => number,
) {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (measureText(word, fontSize) > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      const pieces = breakLongWord(word, maxWidth, fontSize, measureText);
      lines.push(...pieces.slice(0, -1));
      currentLine = pieces.at(-1) ?? "";
      continue;
    }

    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && measureText(candidate, fontSize) > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function calculateMemeTextLayout({
  text,
  position,
  ratio,
  frameEnabled,
  canvasWidth,
  canvasHeight,
  measureText = defaultMeasureText,
}: CalculateMemeTextLayoutOptions): MemeTextLayout {
  const preset = getMemeTextLayoutPreset(ratio, frameEnabled);
  const initialFontSize = Math.min(
    preset.maxFontSize * canvasWidth,
    Math.max(preset.minFontSize * canvasWidth, preset.initialFontSize * canvasWidth),
  );
  const minFontSize = preset.minFontSize * canvasWidth;
  const horizontalInset = Math.max(canvasWidth * 0.06, frameEnabled ? 42 : 0);
  const verticalTopInset = preset.topSafeInset * canvasHeight;
  const verticalBottomInset = preset.bottomSafeInset * canvasHeight;
  const maxTextWidth = Math.min(
    preset.maxTextWidth * canvasWidth,
    canvasWidth - horizontalInset * 2,
  );
  let fontSize = initialFontSize;
  let lines = wrapAtWordBoundaries(text, maxTextWidth, fontSize, measureText);

  while (lines.length > 2 && fontSize > minFontSize) {
    fontSize = Math.max(minFontSize, fontSize * 0.97);
    lines = wrapAtWordBoundaries(text, maxTextWidth, fontSize, measureText);
  }

  // A very long AI caption is still more useful as a readable three-line meme
  // than as clipped text. This is only reached after the approved minimum has
  // already been tried with the maximum three lines.
  const readableFloor = minFontSize * 0.5;
  while (lines.length > 3 && fontSize > readableFloor) {
    fontSize = Math.max(readableFloor, fontSize * 0.97);
    lines = wrapAtWordBoundaries(text, maxTextWidth, fontSize, measureText);
  }

  const lineHeight = fontSize * 0.9;
  const strokeWidth = fontSize * 0.08;
  const widestLine = Math.max(0, ...lines.map((line) => measureText(line, fontSize)));
  const textHeight = fontSize + Math.max(0, lines.length - 1) * lineHeight;
  const width = widestLine + strokeWidth * 2;
  const height = textHeight + strokeWidth * 2;
  const safeBounds = {
    left: horizontalInset,
    top: verticalTopInset,
    right: canvasWidth - horizontalInset,
    bottom: canvasHeight - verticalBottomInset,
  };
  const edgePadding = 0.01;
  const y =
    position === "top"
      ? safeBounds.top + height / 2 + edgePadding
      : safeBounds.bottom - height / 2 - edgePadding;
  const x = canvasWidth / 2;

  return {
    lines,
    fontSize,
    initialFontSize,
    lineHeight,
    strokeWidth,
    x,
    y,
    bounds: { x: x - width / 2, y: y - height / 2, width, height },
    safeBounds,
    topSafeInset: verticalTopInset,
    bottomSafeInset: verticalBottomInset,
  };
}
