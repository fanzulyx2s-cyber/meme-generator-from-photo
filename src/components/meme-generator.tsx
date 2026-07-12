"use client";

import {
  ChangeEvent,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const canvasSize = 1000;

type StickerOption = {
  emoji: string;
  label: string;
};

type StickerLayer = {
  id: number;
  type: "emoji" | "image";
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  label: string;
  border: boolean;
  emoji?: string;
  content?: string;
  src?: string;
  width?: number;
  height?: number;
};

type TextLayerId = "top" | "bottom";

type MemeTextLayer = {
  id: TextLayerId;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  vertical: boolean;
};

type CaptionPreset = {
  id: string;
  title: string;
  top: string;
  bottom: string;
};

type OutputRatioId = "square" | "portrait" | "story";

const minStickerScale = 0.3;
const maxStickerScale = 5;
const minTextScale = 0.45;
const maxTextScale = 2.2;
const emojiBaseSize = 128;
const imageBaseMaxSide = 210;
const stickerDragMargin = 160;

const outputRatios: Array<{
  id: OutputRatioId;
  label: string;
  height: number;
}> = [
  { id: "square", label: "Square 1:1", height: 1000 },
  { id: "portrait", label: "Portrait 4:5", height: 1250 },
  { id: "story", label: "Story 9:16", height: 1778 },
];

const stickerOptions: StickerOption[] = [
  { emoji: "😂", label: "Laugh" },
  { emoji: "🤣", label: "Rolling Laugh" },
  { emoji: "😹", label: "Laugh Cat" },
  { emoji: "🤡", label: "Clown" },
  { emoji: "😜", label: "Silly" },
  { emoji: "😆", label: "Big Laugh" },
  { emoji: "👀", label: "Watching" },
  { emoji: "😮", label: "Shocked" },
  { emoji: "🤯", label: "Mind Blown" },
  { emoji: "😱", label: "Scream" },
  { emoji: "🙄", label: "Eye Roll" },
  { emoji: "😬", label: "Awkward" },
  { emoji: "😭", label: "Crying" },
  { emoji: "💀", label: "Dead" },
  { emoji: "🫠", label: "Melting" },
  { emoji: "😵", label: "Dizzy" },
  { emoji: "😔", label: "Sad" },
  { emoji: "🥲", label: "Tear Smile" },
  { emoji: "😎", label: "Cool" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "✨", label: "Sparkles" },
  { emoji: "😏", label: "Smirk" },
  { emoji: "💅", label: "Attitude" },
  { emoji: "🕶️", label: "Shades" },
  { emoji: "❤️", label: "Love" },
  { emoji: "💖", label: "Cute Love" },
  { emoji: "👍", label: "Like" },
  { emoji: "🙌", label: "Celebrate" },
  { emoji: "👏", label: "Clap" },
  { emoji: "💯", label: "One Hundred" },
  { emoji: "👌", label: "Perfect" },
  { emoji: "🤔", label: "Thinking" },
  { emoji: "🫡", label: "Respect" },
  { emoji: "😴", label: "Sleepy" },
  { emoji: "🐐", label: "GOAT" },
  { emoji: "📸", label: "Snapshot" },
];

const captionPresets: CaptionPreset[] = [
  {
    id: "group-chat-reaction",
    title: "Group chat reaction",
    top: "WHEN THE GROUP CHAT NEEDS A REACTION",
    bottom: "AND YOUR PHOTO IS READY",
  },
  {
    id: "act-normal",
    title: "Act normal",
    top: "WHEN YOU TRY TO ACT NORMAL",
    bottom: "BUT THE PHOTO SAYS EVERYTHING",
  },
  {
    id: "just-one-photo",
    title: "Just one photo",
    top: "WHEN SOMEONE SAYS \"JUST ONE PHOTO\"",
    bottom: "AND NOW IT'S A MEME",
  },
  {
    id: "camera-roll",
    title: "Camera roll",
    top: "WHEN THE VIBE IS TOO STRONG",
    bottom: "TO STAY IN THE CAMERA ROLL",
  },
  {
    id: "face-explains",
    title: "Face explains it",
    top: "WHEN YOUR FACE EXPLAINS IT BETTER",
    bottom: "THAN ANY TEXT MESSAGE",
  },
  {
    id: "family-photo",
    title: "Family photo",
    top: "WHEN THE FAMILY PHOTO GETS TOO REAL",
    bottom: "AND EVERYONE KNOWS THE TRUTH",
  },
  {
    id: "smile-naturally",
    title: "Smile naturally",
    top: "WHEN MOM SAYS SMILE NATURALLY",
    bottom: "AND THIS IS WHAT HAPPENS",
  },
  {
    id: "main-character-dad",
    title: "Main character",
    top: "WHEN DAD JOINS THE GROUP PHOTO",
    bottom: "AND BECOMES THE MAIN CHARACTER",
  },
  {
    id: "couple-chaos",
    title: "Couple chaos",
    top: "WHEN THE COUPLE PHOTO LOOKS CUTE",
    bottom: "BUT THE STORY BEHIND IT IS CHAOS",
  },
  {
    id: "couple-drama",
    title: "Couple drama",
    top: "WHEN YOU BOTH SAID \"NO DRAMA\"",
    bottom: "FIVE MINUTES BEFORE THE DRAMA",
  },
  {
    id: "both-know",
    title: "Both know",
    top: "WHEN YOU LOOK AT EACH OTHER",
    bottom: "AND BOTH KNOW WHO WAS WRONG",
  },
  {
    id: "date-night",
    title: "Date night",
    top: "WHEN DATE NIGHT STARTS PERFECT",
    bottom: "AND THE PHOTO TELLS ANOTHER STORY",
  },
  {
    id: "trust-me",
    title: "Trust me",
    top: "WHEN YOUR FRIEND SAYS \"TRUST ME\"",
    bottom: "AND YOU ALREADY KNOW IT'S OVER",
  },
  {
    id: "zero-responsibility",
    title: "Zero responsibility",
    top: "WHEN THE FRIEND GROUP HAS ONE IDEA",
    bottom: "AND ZERO RESPONSIBILITY",
  },
  {
    id: "bad-idea",
    title: "Bad idea",
    top: "WHEN EVERYONE AGREES IT'S A BAD IDEA",
    bottom: "BUT DOES IT ANYWAY",
  },
  {
    id: "accidental-art",
    title: "Accidental art",
    top: "WHEN YOU OPEN THE CAMERA",
    bottom: "AND ACCIDENTALLY CREATE ART",
  },
  {
    id: "selfie-lore",
    title: "Selfie lore",
    top: "WHEN THE SELFIE WAS SUPPOSED TO BE CASUAL",
    bottom: "BUT NOW IT HAS LORE",
  },
  {
    id: "new-personality",
    title: "New personality",
    top: "WHEN YOU CHECK THE PHOTO AFTERWARDS",
    bottom: "AND FIND A NEW PERSONALITY",
  },
  {
    id: "pet-steals-photo",
    title: "Pet steals photo",
    top: "WHEN THE PET DOES NOTHING",
    bottom: "AND STILL STEALS THE WHOLE PHOTO",
  },
  {
    id: "human-dog",
    title: "Human dog",
    top: "WHEN YOUR DOG LOOKS MORE HUMAN",
    bottom: "THAN EVERYONE IN THE ROOM",
  },
  {
    id: "cat-judges",
    title: "Cat judges",
    top: "WHEN THE CAT JUDGES YOUR LIFE",
    bottom: "THROUGH A SINGLE PHOTO",
  },
  {
    id: "soul-left",
    title: "Work mood",
    top: "WHEN WORK STARTS AT NINE",
    bottom: "BUT YOUR SOUL LEFT AT EIGHT",
  },
  {
    id: "work-meeting",
    title: "Work meeting",
    top: "WHEN THE MEETING COULD HAVE BEEN AN EMAIL",
    bottom: "AND YOUR FACE KNOWS IT",
  },
  {
    id: "im-fine",
    title: "I'm fine",
    top: "WHEN YOU SAY \"I'M FINE\"",
    bottom: "BUT THE CAMERA DISAGREES",
  },
  {
    id: "simple-plan",
    title: "Simple plan",
    top: "WHEN THE PLAN SOUNDS SIMPLE",
    bottom: "UNTIL YOU ACTUALLY START",
  },
  {
    id: "product-photo",
    title: "Product photo",
    top: "WHEN THE PRODUCT PHOTO LOOKS TOO SERIOUS",
    bottom: "SO YOU MAKE IT A MEME",
  },
  {
    id: "brand-energy",
    title: "Brand energy",
    top: "WHEN THE BRAND POST NEEDS ENERGY",
    bottom: "AND THE PHOTO BRINGS CHAOS",
  },
  {
    id: "meme-destiny",
    title: "Meme destiny",
    top: "WHEN THE MOMENT WAS RANDOM",
    bottom: "BUT THE MEME WAS DESTINY",
  },
  {
    id: "photo-perfect",
    title: "Photo perfect",
    top: "WHEN NOTHING MAKES SENSE",
    bottom: "BUT THE PHOTO IS PERFECT",
  },
  {
    id: "reaction-photo",
    title: "Reaction photo",
    top: "WHEN LIFE GIVES YOU A PHOTO",
    bottom: "MAKE IT A REACTION",
  },
];

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  layer: MemeTextLayer,
  alignBottom = false,
) {
  const normalizedText = text.trim().toUpperCase();
  if (!normalizedText) {
    return;
  }

  context.save();
  context.translate(layer.x, layer.y);
  context.rotate((layer.rotation * Math.PI) / 180);

  if (layer.vertical) {
    const chars = Array.from(normalizedText.replace(/\s+/g, ""));
    const fontSize = 72 * layer.scale;
    const lineHeight = fontSize * 0.92;
    const columnGap = fontSize * 0.82;
    const rowsPerColumn = Math.max(1, Math.floor(760 / lineHeight));
    const columnCount = Math.ceil(chars.length / rowsPerColumn);
    const firstX = -((columnCount - 1) * columnGap) / 2;

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = Math.max(7, fontSize * 0.12);
    context.strokeStyle = "#111111";
    context.fillStyle = "#ffffff";
    context.font = `900 ${fontSize}px Impact, Arial Black, system-ui, sans-serif`;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const start = columnIndex * rowsPerColumn;
      const columnChars = chars.slice(start, start + rowsPerColumn);
      const columnHeight = (columnChars.length - 1) * lineHeight;
      const columnX = firstX + columnIndex * columnGap;
      const firstY = -columnHeight / 2;

      columnChars.forEach((char, charIndex) => {
        const charY = firstY + charIndex * lineHeight;
        context.strokeText(char, columnX, charY);
        context.fillText(char, columnX, charY);
      });
    }

    context.restore();
    return;
  }

  const words = normalizedText.split(/\s+/).filter(Boolean);
  const maxWidth = canvasSize - 100;
  let fontSize = 86 * layer.scale;
  const minFontSize = 36 * layer.scale;
  let lines: string[] = [];

  while (fontSize >= minFontSize) {
    context.font = `900 ${fontSize}px Impact, Arial Black, system-ui, sans-serif`;
    lines = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    const widestLine = Math.max(
      ...lines.map((line) => context.measureText(line).width),
    );

    if (widestLine <= maxWidth && lines.length <= 3) {
      break;
    }

    fontSize -= 6;
  }

  context.textAlign = "center";
  context.lineJoin = "round";
  context.lineWidth = Math.max(8, fontSize * 0.12);
  context.strokeStyle = "#111111";
  context.fillStyle = "#ffffff";

  const lineHeight = fontSize * 1.08;
  const blockHeight = lineHeight * Math.max(1, lines.length - 1);
  const startY = alignBottom ? -blockHeight / 2 : -blockHeight / 2;

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    context.strokeText(line, 0, lineY);
    context.fillText(line, 0, lineY);
  });
  context.restore();
}

function drawFrame(context: CanvasRenderingContext2D, canvasHeight: number) {
  context.save();
  context.strokeStyle = "#111111";
  context.lineWidth = 24;
  context.lineJoin = "round";
  context.strokeRect(18, 18, canvasSize - 36, canvasHeight - 36);
  context.restore();
}

function getStickerRenderSize(sticker: StickerLayer) {
  if (sticker.type === "emoji") {
    const size = emojiBaseSize * sticker.scale;
    return { width: size, height: size };
  }

  const sourceWidth = sticker.width ?? imageBaseMaxSide;
  const sourceHeight = sticker.height ?? imageBaseMaxSide;
  const ratio = sourceWidth / sourceHeight;
  const maxSide = imageBaseMaxSide * sticker.scale;

  if (ratio >= 1) {
    return { width: maxSide, height: maxSide / ratio };
  }

  return { width: maxSide * ratio, height: maxSide };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawStickerEye(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  pupilOffsetX = 0,
  pupilOffsetY = 0,
) {
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#4a2a33";
  context.beginPath();
  context.arc(
    x + pupilOffsetX,
    y + pupilOffsetY,
    radius * 0.48,
    0,
    Math.PI * 2,
  );
  context.fill();
}

function drawStickerMouth(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  variant: "flat" | "smile" | "laugh" | "open" | "sad",
) {
  context.strokeStyle = "#4a2a33";
  context.fillStyle = "#4a2a33";
  context.lineCap = "round";
  context.lineWidth = Math.max(6, height * 0.22);

  if (variant === "flat") {
    drawRoundedRect(context, x - width / 2, y - height / 2, width, height, height);
    context.fill();
    return;
  }

  if (variant === "open" || variant === "laugh") {
    context.beginPath();
    context.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.fill();
    if (variant === "laugh") {
      context.fillStyle = "#ffffff";
      context.fillRect(x - width * 0.32, y - height * 0.36, width * 0.64, height * 0.22);
    }
    return;
  }

  context.beginPath();
  if (variant === "sad") {
    context.arc(x, y + height * 0.85, width / 2, Math.PI * 1.15, Math.PI * 1.85);
  } else {
    context.arc(x, y - height * 0.3, width / 2, Math.PI * 0.15, Math.PI * 0.85);
  }
  context.stroke();
}

function getEmojiMood(label: string) {
  if (
    [
      "Laugh",
      "Rolling Laugh",
      "Laugh Cat",
      "Silly",
      "Big Laugh",
      "Celebrate",
      "Clap",
    ].includes(label)
  ) {
    return "laugh";
  }

  if (["Shocked", "Mind Blown", "Scream", "Dizzy"].includes(label)) {
    return "open";
  }

  if (["Crying", "Sad", "Tear Smile", "Sleepy"].includes(label)) {
    return "sad";
  }

  if (["Eye Roll", "Awkward", "Thinking"].includes(label)) {
    return "flat";
  }

  return "smile";
}

function isFaceStyleSticker(label: string) {
  return ![
    "Fire",
    "Sparkles",
    "Love",
    "Cute Love",
    "Like",
    "One Hundred",
    "Perfect",
    "GOAT",
    "Snapshot",
  ].includes(label);
}

function drawCustomEmojiSticker(
  context: CanvasRenderingContext2D,
  sticker: StickerLayer,
) {
  const size = getStickerRenderSize(sticker).width;
  const x = 0;
  const y = 0;
  const emoji = sticker.emoji ?? sticker.content ?? "";

  context.save();
  context.translate(sticker.x, sticker.y);
  context.rotate((sticker.rotation * Math.PI) / 180);
  context.globalAlpha = 1;

  context.font = `900 ${size * 0.82}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(0, 0, 0, 0.34)";
  context.shadowBlur = size * 0.08;
  context.shadowOffsetY = size * 0.04;
  context.filter = "saturate(1.35) contrast(1.12)";
  context.fillText(emoji, x, y);
  context.fillText(emoji, x, y);
  context.restore();
  return;
}

function drawStickers(
  context: CanvasRenderingContext2D,
  stickers: StickerLayer[],
  imageCache: Map<string, HTMLImageElement>,
) {
  context.textAlign = "center";
  context.textBaseline = "middle";

  stickers.forEach((sticker) => {
    const renderSize = getStickerRenderSize(sticker);
    context.save();
    context.globalAlpha = sticker.opacity;
    context.shadowColor = "rgba(0, 0, 0, 0.28)";
    context.shadowBlur = 14;
    context.shadowOffsetY = 6;

    if (sticker.type === "emoji") {
      context.restore();
      drawCustomEmojiSticker(context, sticker);
      return;
    }

    if (sticker.src) {
      const image = imageCache.get(sticker.src);
      if (image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
        context.translate(sticker.x, sticker.y);
        context.rotate((sticker.rotation * Math.PI) / 180);
        context.drawImage(
          image,
          -renderSize.width / 2,
          -renderSize.height / 2,
          renderSize.width,
          renderSize.height,
        );
        if (sticker.border) {
          context.shadowColor = "transparent";
          context.strokeStyle = "#ffffff";
          context.lineWidth = Math.max(5, renderSize.width * 0.035);
          context.strokeRect(
            -renderSize.width / 2,
            -renderSize.height / 2,
            renderSize.width,
            renderSize.height,
          );
        }
      }
    }

    context.restore();
  });
}

export function MemeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(
    null,
  );
  const textDragRef = useRef<{
    id: TextLayerId;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const textResizeRef = useRef<{
    id: TextLayerId;
    startClientX: number;
    startClientY: number;
    startScale: number;
  } | null>(null);
  const textRotateRef = useRef<{
    id: TextLayerId;
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: number;
    startClientX: number;
    startClientY: number;
    startScale: number;
  } | null>(null);
  const imageStickerCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const stickerIdRef = useRef(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [topText, setTopText] = useState(
    "WHEN THE GROUP CHAT NEEDS A REACTION",
  );
  const [bottomText, setBottomText] = useState("AND YOUR PHOTO IS READY");
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [outputRatio, setOutputRatio] = useState<OutputRatioId>("square");
  const [textLayers, setTextLayers] = useState<Record<TextLayerId, MemeTextLayer>>({
    top: {
      id: "top",
      x: canvasSize / 2,
      y: 105,
      scale: 1,
      rotation: 0,
      vertical: false,
    },
    bottom: {
      id: "bottom",
      x: canvasSize / 2,
      y: 920,
      scale: 1,
      rotation: 0,
      vertical: false,
    },
  });
  const [selectedTextId, setSelectedTextId] = useState<TextLayerId | null>(null);
  const [fileName, setFileName] = useState("");
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(
    null,
  );
  const [frameEnabled, setFrameEnabled] = useState(true);
  const [textAboveStickers, setTextAboveStickers] = useState(true);
  const [imageCacheVersion, setImageCacheVersion] = useState(0);
  const canvasHeight =
    outputRatios.find((ratio) => ratio.id === outputRatio)?.height ?? canvasSize;

  const selectedSticker = stickers.find(
    (sticker) => sticker.id === selectedStickerId,
  );

  const selectedStickerBox = selectedSticker
    ? getStickerRenderSize(selectedSticker)
    : { width: 0, height: 0 };
  const selectedStickerIsOutside = selectedSticker
    ? isStickerOutsideCanvas(selectedSticker)
    : false;
  const selectedTextLayer = selectedTextId ? textLayers[selectedTextId] : null;
  const selectedTextValue =
    selectedTextId === "top"
      ? topText
      : selectedTextId === "bottom"
        ? bottomText
        : "";
  const selectedTextBox = selectedTextLayer
    ? getTextLayerBox(selectedTextLayer, selectedTextValue)
    : { width: 0, height: 0 };

  useEffect(() => {
    stickers.forEach((sticker) => {
      if (sticker.type !== "image" || !sticker.src) {
        return;
      }

      if (imageStickerCacheRef.current.has(sticker.src)) {
        return;
      }

      const image = new Image();
      image.onload = () => {
        setStickers((currentStickers) =>
          currentStickers.map((currentSticker) =>
            currentSticker.id === sticker.id
              ? {
                  ...currentSticker,
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                  opacity: 1,
                }
              : currentSticker,
          ),
        );
        setImageCacheVersion((version) => version + 1);
      };
      image.src = sticker.src;
      imageStickerCacheRef.current.set(sticker.src, image);
    });
  }, [stickers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvasSize, canvasHeight);
    context.fillStyle = "#f8efe2";
    context.fillRect(0, 0, canvasSize, canvasHeight);

    const drawFinalLayers = () => {
      if (!textAboveStickers) {
        drawWrappedText(context, topText, textLayers.top);
        drawWrappedText(context, bottomText, textLayers.bottom, true);
      }
      drawStickers(context, stickers, imageStickerCacheRef.current);
      if (textAboveStickers) {
        drawWrappedText(context, topText, textLayers.top);
        drawWrappedText(context, bottomText, textLayers.bottom, true);
      }
      if (frameEnabled) {
        drawFrame(context, canvasHeight);
      }
    };

    if (!imageUrl) {
      context.fillStyle = "#fff7e8";
      context.fillRect(72, 72, canvasSize - 144, canvasHeight - 144);
      context.fillStyle = "#171717";
      context.font = "900 54px system-ui, Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("UPLOAD A PHOTO", canvasSize / 2, canvasHeight / 2 - 18);
      context.font = "700 30px system-ui, Arial, sans-serif";
      context.fillText("Then add your meme text", canvasSize / 2, canvasHeight / 2 + 38);
      drawFinalLayers();
      return;
    }

    const image = new Image();
    image.onload = () => {
      const scale = Math.max(
        canvasSize / image.naturalWidth,
        canvasHeight / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const x = (canvasSize - width) / 2;
      const y = (canvasHeight - height) / 2;

      context.drawImage(image, x, y, width, height);
      context.fillStyle = "rgba(0, 0, 0, 0.08)";
      context.fillRect(0, 0, canvasSize, 150);
      context.fillRect(0, canvasHeight - 170, canvasSize, 170);
      drawFinalLayers();
    };
    image.src = imageUrl;
  }, [
    frameEnabled,
    imageCacheVersion,
    imageUrl,
    canvasHeight,
    stickers,
    textAboveStickers,
    textLayers,
    topText,
    bottomText,
  ]);

  function getCanvasPointFromClient(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * canvasSize,
      y: ((clientY - rect.top) / rect.height) * canvasHeight,
    };
  }

  function getCanvasPoint(event: ReactPointerEvent<HTMLCanvasElement>) {
    return getCanvasPointFromClient(event.clientX, event.clientY);
  }

  function clampCanvasPoint(point: { x: number; y: number }, margin = 0) {
    return {
      x: Math.min(canvasSize + margin, Math.max(-margin, point.x)),
      y: Math.min(canvasHeight + margin, Math.max(-margin, point.y)),
    };
  }

  function isStickerOutsideCanvas(sticker: StickerLayer) {
    return (
      sticker.x < 0 ||
      sticker.x > canvasSize ||
      sticker.y < 0 ||
      sticker.y > canvasHeight
    );
  }

  function getTextLayerBox(layer: MemeTextLayer, text: string) {
    const normalizedText = text.trim();
    if (layer.vertical) {
      const charCount = Math.max(1, normalizedText.replace(/\s+/g, "").length);
      const fontSize = 72 * layer.scale;
      const rowsPerColumn = Math.max(1, Math.floor(760 / (fontSize * 0.92)));
      const columnCount = Math.ceil(charCount / rowsPerColumn);
      const rowCount = Math.min(charCount, rowsPerColumn);
      return {
        width: Math.max(80, columnCount * fontSize * 0.95),
        height: Math.max(120, rowCount * fontSize * 0.92),
      };
    }

    return {
      width: Math.min(900, Math.max(260, normalizedText.length * 28 * layer.scale)),
      height: 150 * layer.scale,
    };
  }

  function findTextLayerAtPoint(x: number, y: number) {
    const textEntries: Array<[TextLayerId, string]> = [
      ["bottom", bottomText],
      ["top", topText],
    ];

    for (const [id, text] of textEntries) {
      const layer = textLayers[id];
      const box = getTextLayerBox(layer, text);
      if (
        Math.abs(x - layer.x) <= box.width / 2 &&
        Math.abs(y - layer.y) <= box.height / 2
      ) {
        return layer;
      }
    }

    return null;
  }

  function findStickerAtPoint(x: number, y: number) {
    for (let index = stickers.length - 1; index >= 0; index -= 1) {
      const sticker = stickers[index];
      const renderSize = getStickerRenderSize(sticker);
      const hitWidth = renderSize.width * 0.7;
      const hitHeight = renderSize.height * 0.7;
      if (
        Math.abs(x - sticker.x) <= hitWidth &&
        Math.abs(y - sticker.y) <= hitHeight
      ) {
        return sticker;
      }
    }

    return null;
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    const textLayer = findTextLayerAtPoint(point.x, point.y);
    if (textLayer) {
      setSelectedTextId(textLayer.id);
      setSelectedStickerId(null);
      dragRef.current = null;
      resizeRef.current = null;
      textRotateRef.current = null;
      textDragRef.current = {
        id: textLayer.id,
        offsetX: point.x - textLayer.x,
        offsetY: point.y - textLayer.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const sticker = findStickerAtPoint(point.x, point.y);
    if (!sticker) {
      setSelectedStickerId(null);
      setSelectedTextId(null);
      dragRef.current = null;
      textDragRef.current = null;
      resizeRef.current = null;
      textResizeRef.current = null;
      textRotateRef.current = null;
      return;
    }

    setSelectedStickerId(sticker.id);
    setSelectedTextId(null);
    textResizeRef.current = null;
    textRotateRef.current = null;
    dragRef.current = {
      id: sticker.id,
      offsetX: point.x - sticker.x,
      offsetY: point.y - sticker.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const textDrag = textDragRef.current;
    if (textDrag) {
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }

      setTextLayers((currentLayers) => ({
        ...currentLayers,
        [textDrag.id]: {
          ...currentLayers[textDrag.id],
          ...clampCanvasPoint({
            x: point.x - textDrag.offsetX,
            y: point.y - textDrag.offsetY,
          }),
        },
      }));
      return;
    }

    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    setStickers((currentStickers) =>
      currentStickers.map((sticker) =>
        sticker.id === drag.id
          ? {
              ...sticker,
              ...clampCanvasPoint({
                x: point.x - drag.offsetX,
                y: point.y - drag.offsetY,
              }, stickerDragMargin),
            }
          : sticker,
      ),
    );
  }

  function handleCanvasPointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    dragRef.current = null;
    textDragRef.current = null;
    textResizeRef.current = null;
    textRotateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function addEmojiSticker(option: StickerOption, point?: { x: number; y: number }) {
    stickerIdRef.current += 1;
    const placement = clampCanvasPoint(
      point ?? {
        x: canvasSize / 2 + (stickers.length % 3) * 34,
        y: canvasSize / 2 + (stickers.length % 3) * 26,
      },
    );
    const nextSticker: StickerLayer = {
      id: stickerIdRef.current,
      type: "emoji",
      label: option.label,
      emoji: option.emoji,
      content: option.emoji,
      x: placement.x,
      y: placement.y,
      scale: 1,
      rotation: 0,
      opacity: 1,
      border: false,
    };

    setStickers((currentStickers) => [...currentStickers, nextSticker]);
    setSelectedStickerId(nextSticker.id);
  }

  function handleAddSticker(option: StickerOption) {
    addEmojiSticker(option);
  }

  function handleStickerDragStart(
    event: ReactDragEvent<HTMLButtonElement>,
    option: StickerOption,
  ) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/json", JSON.stringify(option));
    event.dataTransfer.setData("text/plain", option.label);
  }

  function handleCanvasDragOver(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleCanvasDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    const rawSticker = event.dataTransfer.getData("application/json");
    if (!rawSticker) {
      return;
    }

    try {
      const option = JSON.parse(rawSticker) as StickerOption;
      const point = getCanvasPointFromClient(event.clientX, event.clientY);
      if (point && option.emoji && option.label) {
        addEmojiSticker(option, point);
      }
    } catch {
      // Ignore drops that are not emoji sticker payloads.
    }
  }

  function handleImageStickerUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const src = URL.createObjectURL(file);
    stickerIdRef.current += 1;
    const nextSticker: StickerLayer = {
      id: stickerIdRef.current,
      type: "image",
      label: file.name || "Image sticker",
      src,
      x: canvasSize / 2 + (stickers.length % 3) * 34,
      y: canvasSize / 2 + (stickers.length % 3) * 26,
      scale: 1,
      rotation: 0,
      opacity: 1,
      border: false,
    };

    setStickers((currentStickers) => [...currentStickers, nextSticker]);
    setSelectedStickerId(nextSticker.id);
  }

  function updateSelectedStickerSize(delta: number) {
    if (!selectedStickerId) {
      return;
    }

    setStickers((currentStickers) =>
      currentStickers.map((sticker) =>
        sticker.id === selectedStickerId
          ? {
              ...sticker,
              scale: Math.min(
                maxStickerScale,
                Math.max(minStickerScale, sticker.scale + delta),
              ),
              opacity: 1,
            }
          : sticker,
      ),
    );
  }

  function rotateSelectedSticker(delta: number) {
    if (!selectedStickerId) {
      return;
    }

    setStickers((currentStickers) =>
      currentStickers.map((sticker) =>
        sticker.id === selectedStickerId
          ? { ...sticker, rotation: sticker.rotation + delta }
          : sticker,
      ),
    );
  }

  function moveSelectedSticker(direction: "forward" | "backward") {
    if (!selectedStickerId) {
      return;
    }

    setStickers((currentStickers) => {
      const index = currentStickers.findIndex(
        (sticker) => sticker.id === selectedStickerId,
      );
      if (index < 0) {
        return currentStickers;
      }

      const nextIndex = direction === "forward" ? index + 1 : index - 1;
      if (nextIndex < 0 || nextIndex >= currentStickers.length) {
        return currentStickers;
      }

      const nextStickers = [...currentStickers];
      [nextStickers[index], nextStickers[nextIndex]] = [
        nextStickers[nextIndex],
        nextStickers[index],
      ];
      return nextStickers;
    });
  }

  function toggleSelectedImageBorder(border: boolean) {
    if (!selectedStickerId) {
      return;
    }

    setStickers((currentStickers) =>
      currentStickers.map((sticker) =>
        sticker.id === selectedStickerId && sticker.type === "image"
          ? { ...sticker, border }
          : sticker,
      ),
    );
  }

  function clearStickers() {
    stickers.forEach((sticker) => {
      if (sticker.type === "image" && sticker.src) {
        URL.revokeObjectURL(sticker.src);
      }
    });
    imageStickerCacheRef.current.clear();
    setStickers([]);
    setSelectedStickerId(null);
  }

  function resetLayout() {
    setSelectedStickerId(null);
    setSelectedTextId(null);
    setTextAboveStickers(true);
    setTextLayers({
      top: {
        id: "top",
        x: canvasSize / 2,
        y: 105,
        scale: 1,
        rotation: 0,
        vertical: false,
      },
      bottom: {
        id: "bottom",
        x: canvasSize / 2,
        y: canvasHeight - 80,
        scale: 1,
        rotation: 0,
        vertical: false,
      },
    });
  }

  function selectOutputRatio(nextRatio: OutputRatioId) {
    const nextHeight =
      outputRatios.find((ratio) => ratio.id === nextRatio)?.height ?? canvasSize;
    setOutputRatio(nextRatio);
    setSelectedStickerId(null);
    setSelectedTextId(null);
    setTextLayers((currentLayers) => ({
      ...currentLayers,
      bottom: {
        ...currentLayers.bottom,
        y: Math.min(nextHeight - 80, Math.max(80, currentLayers.bottom.y)),
      },
    }));
    setStickers((currentStickers) =>
      currentStickers.map((sticker) => ({
        ...sticker,
        y: Math.min(nextHeight, Math.max(0, sticker.y)),
      })),
    );
  }

  function updateTextLayerScale(id: TextLayerId, delta: number) {
    setSelectedTextId(id);
    setSelectedStickerId(null);
    setTextLayers((currentLayers) => ({
      ...currentLayers,
      [id]: {
        ...currentLayers[id],
        scale: Math.min(
          maxTextScale,
          Math.max(minTextScale, currentLayers[id].scale + delta),
        ),
      },
    }));
  }

  function rotateTextLayer(id: TextLayerId, delta: number) {
    setSelectedTextId(id);
    setSelectedStickerId(null);
    setTextLayers((currentLayers) => ({
      ...currentLayers,
      [id]: {
        ...currentLayers[id],
        rotation: currentLayers[id].rotation + delta,
      },
    }));
  }

  function setTextLayerVertical(id: TextLayerId, vertical: boolean) {
    setSelectedTextId(id);
    setSelectedStickerId(null);
    setTextLayers((currentLayers) => ({
      ...currentLayers,
      [id]: {
        ...currentLayers[id],
        vertical,
      },
    }));
  }

  function selectTextLayer(id: TextLayerId) {
    setSelectedTextId(id);
    setSelectedStickerId(null);
  }

  function handleTextResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: MemeTextLayer,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTextId(layer.id);
    setSelectedStickerId(null);
    textResizeRef.current = {
      id: layer.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScale: layer.scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTextResizePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const resize = textResizeRef.current;
    if (!resize) {
      return;
    }

    const dragDistance =
      event.clientX -
      resize.startClientX +
      event.clientY -
      resize.startClientY;
    const nextScale = Math.min(
      maxTextScale,
      Math.max(minTextScale, resize.startScale + dragDistance / 160),
    );

    setTextLayers((currentLayers) => ({
      ...currentLayers,
      [resize.id]: {
        ...currentLayers[resize.id],
        scale: nextScale,
      },
    }));
  }

  function handleTextResizePointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    textResizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function getPointerAngleFromLayer(
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: MemeTextLayer,
  ) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return 0;
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + (layer.x / canvasSize) * rect.width;
    const centerY = rect.top + (layer.y / canvasHeight) * rect.height;

    return (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
  }

  function handleTextRotatePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    layer: MemeTextLayer,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTextId(layer.id);
    setSelectedStickerId(null);
    textRotateRef.current = {
      id: layer.id,
      centerX: layer.x,
      centerY: layer.y,
      startAngle: getPointerAngleFromLayer(event, layer),
      startRotation: layer.rotation,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTextRotatePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const rotate = textRotateRef.current;
    if (!rotate) {
      return;
    }

    const layer = textLayers[rotate.id];
    const currentAngle = getPointerAngleFromLayer(event, layer);
    setTextLayers((currentLayers) => ({
      ...currentLayers,
      [rotate.id]: {
        ...currentLayers[rotate.id],
        rotation: rotate.startRotation + currentAngle - rotate.startAngle,
      },
    }));
  }

  function handleTextRotatePointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    textRotateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    sticker: StickerLayer,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedStickerId(sticker.id);
    resizeRef.current = {
      id: sticker.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startScale: sticker.scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const resize = resizeRef.current;
    if (!resize) {
      return;
    }

    const dragDistance =
      event.clientX -
      resize.startClientX +
      event.clientY -
      resize.startClientY;
    const nextScale = Math.min(
      maxStickerScale,
      Math.max(minStickerScale, resize.startScale + dragDistance / 120),
    );

    setStickers((currentStickers) =>
      currentStickers.map((sticker) =>
        sticker.id === resize.id
          ? {
              ...sticker,
              scale: nextScale,
              opacity: 1,
            }
          : sticker,
      ),
    );
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    resizeRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function deleteStickerById(stickerId: number) {
    const stickerToDelete = stickers.find((sticker) => sticker.id === stickerId);
    if (!stickerToDelete) {
      return;
    }

    if (stickerToDelete?.type === "image" && stickerToDelete.src) {
      URL.revokeObjectURL(stickerToDelete.src);
      imageStickerCacheRef.current.delete(stickerToDelete.src);
    }

    setStickers((currentStickers) =>
      currentStickers.filter((sticker) => sticker.id !== stickerId),
    );
    setSelectedStickerId((currentSelectedId) =>
      currentSelectedId === stickerId ? null : currentSelectedId,
    );
  }

  function deleteSelectedSticker() {
    if (!selectedStickerId) {
      return;
    }

    deleteStickerById(selectedStickerId);
  }

  function applyCaptionPreset(presetId: string) {
    setSelectedPresetId(presetId);
    const preset = captionPresets.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }

    setTopText(preset.top);
    setBottomText(preset.bottom);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setImageUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return nextUrl;
    });
    setFileName(file.name);
  }

  function handleClear() {
    setImageUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return null;
    });
    stickers.forEach((sticker) => {
      if (sticker.type === "image" && sticker.src) {
        URL.revokeObjectURL(sticker.src);
      }
    });
    imageStickerCacheRef.current.clear();
    setFileName("");
    setTopText("");
    setBottomText("");
    setSelectedPresetId("");
    setTextLayers({
      top: {
        id: "top",
        x: canvasSize / 2,
        y: 105,
        scale: 1,
        rotation: 0,
        vertical: false,
      },
      bottom: {
        id: "bottom",
        x: canvasSize / 2,
        y: canvasHeight - 80,
        scale: 1,
        rotation: 0,
        vertical: false,
      },
    });
    setStickers([]);
    setSelectedStickerId(null);
    setSelectedTextId(null);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    link.download = "photo-meme.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <section id="generator" className="scroll-mt-28">
      <div className="rounded-[2.5rem] border border-black/10 bg-white/82 p-4 shadow-[0_24px_80px_rgba(42,31,16,0.14)] backdrop-blur md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="w-fit rounded-full bg-[#d8ff63] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-950">
              Local browser canvas
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 md:text-5xl">
              Create your meme
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
              Upload a photo, add top and bottom text, preview it instantly,
              then download a PNG. The image is processed locally in your
              browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full bg-zinc-950 px-6 py-4 text-sm font-black text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5"
          >
            Download PNG
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            <label className="group relative cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed border-zinc-300 bg-[#fff7e8] p-6 transition hover:-translate-y-0.5 hover:border-zinc-950 hover:bg-[#fff1d2]">
              <span className="absolute right-5 top-5 h-24 w-32 rotate-6 rounded-[1.5rem] border-4 border-white bg-[#dff7ff]/70 shadow-sm" />
              <span className="absolute right-16 top-12 h-12 w-16 rounded-2xl bg-zinc-950/10" />
              <span className="absolute right-[84px] top-16 h-5 w-5 rounded-full bg-white/80" />
              <span className="absolute right-8 bottom-8 h-16 w-16 rounded-full bg-[#ffd6e7]/70" />
              <span className="absolute right-[46px] bottom-[52px] h-8 w-3 rounded-full bg-zinc-950/15" />
              <span className="absolute right-[35px] bottom-[50px] h-5 w-5 rotate-45 border-r-4 border-t-4 border-zinc-950/15" />
              <span className="absolute bottom-7 left-8 h-16 w-20 -rotate-6 rounded-[1rem] border-4 border-white bg-[#ffde59]/60 shadow-sm" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
              <span className="relative inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-700">
                JPG PNG WEBP
              </span>
              <span className="relative mt-10 block text-3xl font-black text-zinc-950">
                Upload a photo
              </span>
              <span className="relative mt-3 block text-sm leading-6 text-zinc-600">
                Click this card to choose an image. Nothing is uploaded to a
                server.
              </span>
              <span className="relative mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white">
                Choose image
              </span>
              {fileName ? (
                <span className="relative mt-4 block truncate rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700">
                  Selected: {fileName}
                </span>
              ) : null}
            </label>

            <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-gradient-to-br from-white via-[#fffaf3] to-[#f5fbff] p-5 shadow-sm">
              <span className="absolute right-5 top-5 h-12 w-28 rounded-[1.4rem] bg-[#ffd6e7]/45" />
              <span className="absolute right-14 top-20 h-10 w-24 rounded-[1.4rem] bg-[#dff7ff]/55" />
              <span className="absolute right-20 top-9 h-2 w-2 rounded-full bg-zinc-950/18" />
              <span className="absolute right-16 top-9 h-2 w-2 rounded-full bg-zinc-950/18" />
              <span className="absolute right-12 top-9 h-2 w-2 rounded-full bg-zinc-950/18" />
              <span className="absolute bottom-6 right-7 rotate-3 rounded-2xl bg-[#fff7c2]/75 px-4 py-2 text-xs font-black uppercase text-zinc-950/45 shadow-sm">
                caption
              </span>
              <div className="relative flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-zinc-950">Meme text</h3>
                <span className="rounded-full bg-[#ffd6e7] px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-800">
                  Editable
                </span>
              </div>
              <div className="relative mt-5 rounded-[1.5rem] border border-zinc-200 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-900">
                      Meme frame
                    </p>
                    <p className="text-xs font-semibold text-zinc-500">
                      Applies to preview and PNG export.
                    </p>
                  </div>
                  <div className="flex rounded-full bg-zinc-100 p-1">
                    <button
                      type="button"
                      onClick={() => setFrameEnabled(true)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        frameEnabled
                          ? "bg-zinc-950 text-white shadow-sm"
                          : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      Frame On
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameEnabled(false)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        !frameEnabled
                          ? "bg-zinc-950 text-white shadow-sm"
                          : "text-zinc-600 hover:text-zinc-950"
                      }`}
                    >
                      Frame Off
                    </button>
                  </div>
                </div>
              </div>
              <label className="relative mt-5 block rounded-[1.5rem] border border-zinc-200 bg-[#fff7e8]/75 p-3">
                <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    <span className="block text-sm font-black text-zinc-900">
                      Caption preset
                    </span>
                    <span className="block text-xs font-semibold text-zinc-500">
                      Pick a ready-made top and bottom caption pair.
                    </span>
                  </span>
                  <span className="w-fit rounded-full bg-[#ffde59] px-3 py-1 text-xs font-black uppercase tracking-wide text-zinc-950">
                    30 presets
                  </span>
                </span>
                <select
                  value={selectedPresetId}
                  onChange={(event) => applyCaptionPreset(event.target.value)}
                  className="mt-3 w-full rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm font-black text-zinc-950 outline-none transition focus:border-zinc-950"
                >
                  <option value="">Choose a caption preset</option>
                  {captionPresets.map((preset, index) => (
                    <option key={preset.id} value={preset.id}>
                      {index + 1}. {preset.title} - {preset.top} / {preset.bottom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative mt-5 block">
                <span className="text-sm font-black text-zinc-800">
                  Top text
                </span>
                <input
                  value={topText}
                  onChange={(event) => {
                    setTopText(event.target.value);
                    setSelectedPresetId("");
                  }}
                  placeholder="WHEN YOU SEE IT"
                  className="mt-2 w-full rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base font-bold text-zinc-950 outline-none transition focus:border-zinc-950 focus:bg-white"
                />
                <span className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectTextLayer("top")}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      selectedTextId === "top"
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-700 hover:text-zinc-950"
                    }`}
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTextLayerScale("top", -0.1)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Smaller
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTextLayerScale("top", 0.1)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Bigger
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateTextLayer("top", -8)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Rotate -
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateTextLayer("top", 8)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Rotate +
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextLayerVertical("top", false)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      !textLayers.top.vertical
                        ? "bg-[#ffde59] text-zinc-950"
                        : "bg-white text-zinc-700 hover:text-zinc-950"
                    }`}
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextLayerVertical("top", true)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      textLayers.top.vertical
                        ? "bg-[#ffde59] text-zinc-950"
                        : "bg-white text-zinc-700 hover:text-zinc-950"
                    }`}
                  >
                    Vertical
                  </button>
                </span>
              </label>
              <label className="relative mt-4 block">
                <span className="text-sm font-black text-zinc-800">
                  Bottom text
                </span>
                <input
                  value={bottomText}
                  onChange={(event) => {
                    setBottomText(event.target.value);
                    setSelectedPresetId("");
                  }}
                  placeholder="YOU CANNOT UNSEE IT"
                  className="mt-2 w-full rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-base font-bold text-zinc-950 outline-none transition focus:border-zinc-950 focus:bg-white"
                />
                <span className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => selectTextLayer("bottom")}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      selectedTextId === "bottom"
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-700 hover:text-zinc-950"
                    }`}
                  >
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTextLayerScale("bottom", -0.1)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Smaller
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTextLayerScale("bottom", 0.1)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Bigger
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateTextLayer("bottom", -8)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Rotate -
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateTextLayer("bottom", 8)}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                  >
                    Rotate +
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextLayerVertical("bottom", false)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      !textLayers.bottom.vertical
                        ? "bg-[#ffde59] text-zinc-950"
                        : "bg-white text-zinc-700 hover:text-zinc-950"
                    }`}
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextLayerVertical("bottom", true)}
                    className={`rounded-full px-4 py-2 text-xs font-black transition ${
                      textLayers.bottom.vertical
                        ? "bg-[#ffde59] text-zinc-950"
                        : "bg-white text-zinc-700 hover:text-zinc-950"
                    }`}
                  >
                    Vertical
                  </button>
                </span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="relative mt-5 rounded-full border border-zinc-300 bg-white/70 px-5 py-3 text-sm font-black text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
              >
                Clear and start over
              </button>
            </div>
          </div>

          <div className="relative self-start overflow-hidden rounded-[2rem] border border-black/10 bg-zinc-950 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.2)]">
            {!imageUrl ? (
              <>
                <span className="absolute inset-4 rounded-[1.5rem] bg-[radial-gradient(circle,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:18px_18px]" />
                <span className="absolute right-8 top-20 h-24 w-32 rotate-6 rounded-[1.5rem] border border-white/15 bg-white/10" />
                <span className="absolute bottom-10 left-8 h-16 w-24 -rotate-3 rounded-[1.25rem] bg-[#fff7e8]/10" />
              </>
            ) : null}
            <div className="relative mb-4 flex items-center justify-between gap-3 px-2 text-white">
              <h3 className="text-xl font-black">Live preview</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide">
                Canvas PNG
              </span>
            </div>
            <div
              className="relative"
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
            >
              <canvas
                ref={canvasRef}
                width={canvasSize}
                height={canvasHeight}
                className="relative w-full touch-none rounded-[1.5rem] bg-[#f8efe2]"
                style={{ aspectRatio: `${canvasSize} / ${canvasHeight}` }}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
              />
              {selectedTextLayer ? (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${((selectedTextLayer.x - selectedTextBox.width / 2) / canvasSize) * 100}%`,
                    top: `${((selectedTextLayer.y - selectedTextBox.height / 2) / canvasHeight) * 100}%`,
                    width: `${(selectedTextBox.width / canvasSize) * 100}%`,
                    height: `${(selectedTextBox.height / canvasHeight) * 100}%`,
                    transform: `rotate(${selectedTextLayer.rotation}deg)`,
                    transformOrigin: "center",
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Rotate ${selectedTextLayer.id} text`}
                    onPointerDown={(event) =>
                      handleTextRotatePointerDown(event, selectedTextLayer)
                    }
                    onPointerMove={handleTextRotatePointerMove}
                    onPointerUp={handleTextRotatePointerUp}
                    onPointerCancel={handleTextRotatePointerUp}
                    className="pointer-events-auto absolute -right-3 -top-3 flex h-8 w-8 cursor-grab items-center justify-center rounded-full border-2 border-white bg-[#ffde59] text-base font-black leading-none text-zinc-950 shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-white active:cursor-grabbing"
                  >
                    ↻
                  </button>
                  <button
                    type="button"
                    aria-label={`Resize ${selectedTextLayer.id} text`}
                    onPointerDown={(event) =>
                      handleTextResizePointerDown(event, selectedTextLayer)
                    }
                    onPointerMove={handleTextResizePointerMove}
                    onPointerUp={handleTextResizePointerUp}
                    onPointerCancel={handleTextResizePointerUp}
                    className="pointer-events-auto absolute -bottom-3 -right-3 flex h-8 w-8 cursor-nwse-resize items-center justify-center rounded-full border-2 border-white bg-[#ffde59] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-white"
                  >
                    <span className="block h-3 w-3 rounded-br-md border-b-2 border-r-2 border-zinc-950" />
                  </button>
                </div>
              ) : null}
              {selectedSticker ? (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${((selectedSticker.x - selectedStickerBox.width / 2) / canvasSize) * 100}%`,
                    top: `${((selectedSticker.y - selectedStickerBox.height / 2) / canvasHeight) * 100}%`,
                    width: `${(selectedStickerBox.width / canvasSize) * 100}%`,
                    height: `${(selectedStickerBox.height / canvasHeight) * 100}%`,
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Resize ${selectedSticker.label}`}
                    onPointerDown={(event) =>
                      handleResizePointerDown(event, selectedSticker)
                    }
                    onPointerMove={handleResizePointerMove}
                    onPointerUp={handleResizePointerUp}
                    onPointerCancel={handleResizePointerUp}
                    className="pointer-events-auto absolute -bottom-3 -right-3 flex h-8 w-8 cursor-nwse-resize items-center justify-center rounded-full border-2 border-white bg-[#ffde59] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-white"
                  >
                    <span className="block h-3 w-3 rounded-br-md border-b-2 border-r-2 border-zinc-950" />
                  </button>
                  {selectedStickerIsOutside ? (
                    <button
                      type="button"
                      aria-label={`Delete ${selectedSticker.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteStickerById(selectedSticker.id);
                      }}
                      className="pointer-events-auto absolute -right-4 -top-4 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#ffde59] text-lg font-black leading-none text-zinc-950 shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:scale-105 hover:bg-white"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="relative mt-4 rounded-[1.75rem] border border-white/10 bg-[#fff7e8] p-4 text-zinc-950 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                    Editing toolbar
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {selectedTextLayer
                      ? `Selected text: ${selectedTextLayer.id === "top" ? "Top text" : "Bottom text"}`
                      : selectedSticker?.type === "emoji"
                        ? `Selected sticker: ${selectedSticker.label}`
                        : selectedSticker?.type === "image"
                          ? `Selected image: ${selectedSticker.label}`
                          : "No object selected"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                >
                  Download PNG
                </button>
              </div>

              {!selectedSticker && !selectedTextLayer ? (
                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      Size
                    </span>
                    {outputRatios.map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => selectOutputRatio(ratio.id)}
                        className={`rounded-full px-4 py-2 text-xs font-black transition ${
                          outputRatio === ratio.id
                            ? "bg-[#ffde59] text-zinc-950"
                            : "bg-white text-zinc-700 hover:text-zinc-950"
                        }`}
                      >
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      Frame
                    </span>
                    <button
                      type="button"
                      onClick={() => setFrameEnabled(true)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        frameEnabled
                          ? "bg-zinc-950 text-white"
                          : "bg-white text-zinc-700 hover:text-zinc-950"
                      }`}
                    >
                      Frame On
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameEnabled(false)}
                      className={`rounded-full px-4 py-2 text-xs font-black transition ${
                        !frameEnabled
                          ? "bg-zinc-950 text-white"
                          : "bg-white text-zinc-700 hover:text-zinc-950"
                      }`}
                    >
                      Frame Off
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      Add
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddSticker(stickerOptions[0])}
                      className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                    >
                      Add emoji
                    </button>
                    <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">
                      Add logo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={handleImageStickerUpload}
                      />
                    </label>
                    <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">
                      Add image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={handleImageStickerUpload}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      Canvas
                    </span>
                    <button
                      type="button"
                      onClick={clearStickers}
                      className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                    >
                      Clear stickers
                    </button>
                    <button
                      type="button"
                      onClick={resetLayout}
                      className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950"
                    >
                      Reset layout
                    </button>
                  </div>
                </div>
              ) : null}

              {selectedTextLayer ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateTextLayerScale(selectedTextLayer.id, -0.1)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Smaller</button>
                  <button type="button" onClick={() => updateTextLayerScale(selectedTextLayer.id, 0.1)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Bigger</button>
                  <button type="button" onClick={() => rotateTextLayer(selectedTextLayer.id, -8)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Rotate -</button>
                  <button type="button" onClick={() => rotateTextLayer(selectedTextLayer.id, 8)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Rotate +</button>
                  <button type="button" onClick={() => setTextLayerVertical(selectedTextLayer.id, false)} className={`rounded-full px-4 py-2 text-xs font-black transition ${!selectedTextLayer.vertical ? "bg-[#ffde59] text-zinc-950" : "bg-white text-zinc-700 hover:text-zinc-950"}`}>Horizontal</button>
                  <button type="button" onClick={() => setTextLayerVertical(selectedTextLayer.id, true)} className={`rounded-full px-4 py-2 text-xs font-black transition ${selectedTextLayer.vertical ? "bg-[#ffde59] text-zinc-950" : "bg-white text-zinc-700 hover:text-zinc-950"}`}>Vertical</button>
                  <button type="button" onClick={() => setTextAboveStickers(true)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Bring forward</button>
                  <button type="button" onClick={() => setTextAboveStickers(false)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Send backward</button>
                </div>
              ) : null}

              {selectedSticker ? (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => updateSelectedStickerSize(-0.15)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Smaller</button>
                  <button type="button" onClick={() => updateSelectedStickerSize(0.15)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Bigger</button>
                  <button type="button" onClick={() => rotateSelectedSticker(-8)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Rotate -</button>
                  <button type="button" onClick={() => rotateSelectedSticker(8)} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Rotate +</button>
                  <button type="button" onClick={() => moveSelectedSticker("forward")} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Bring forward</button>
                  <button type="button" onClick={() => moveSelectedSticker("backward")} className="rounded-full bg-white px-4 py-2 text-xs font-black text-zinc-700 transition hover:text-zinc-950">Send backward</button>
                  {selectedSticker.type === "image" ? (
                    <>
                      <button type="button" onClick={() => toggleSelectedImageBorder(true)} className={`rounded-full px-4 py-2 text-xs font-black transition ${selectedSticker.border ? "bg-[#ffde59] text-zinc-950" : "bg-white text-zinc-700 hover:text-zinc-950"}`}>Border On</button>
                      <button type="button" onClick={() => toggleSelectedImageBorder(false)} className={`rounded-full px-4 py-2 text-xs font-black transition ${!selectedSticker.border ? "bg-[#ffde59] text-zinc-950" : "bg-white text-zinc-700 hover:text-zinc-950"}`}>Border Off</button>
                    </>
                  ) : null}
                  <button type="button" onClick={deleteSelectedSticker} className="rounded-full bg-[#ffde59] px-4 py-2 text-xs font-black text-zinc-950 transition hover:bg-[#ffd12f]">Delete</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] border border-black/10 bg-gradient-to-br from-white via-[#fffaf3] to-[#f5fbff] p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="w-fit rounded-full bg-[#ffd6e7] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-950">
                Emoji sticker tray
              </p>
              <h3 className="mt-3 text-2xl font-black text-zinc-950">
                Add a reaction sticker
              </h3>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-zinc-600">
              Drag an emoji onto the preview, or tap to place it near the
              center.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {stickerOptions.map((option) => (
              <button
                key={`${option.emoji}-${option.label}`}
                type="button"
                draggable
                onDragStart={(event) => handleStickerDragStart(event, option)}
                onClick={() => handleAddSticker(option)}
                className="group rounded-[1.25rem] border border-black/10 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-950 hover:shadow-md"
              >
                <span className="block text-3xl transition group-hover:scale-110">
                  {option.emoji}
                </span>
                <span className="mt-2 block text-xs font-black leading-4 text-zinc-700">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-[1.5rem] border-2 border-dashed border-zinc-300 bg-[#fff7e8] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-black text-zinc-950">
                  Add logo / image sticker
                </p>
                <p className="mt-1 text-sm font-semibold leading-6 text-zinc-600">
                  Upload a PNG, JPG, or WEBP. It stays local in your browser and
                  exports with the meme.
                </p>
              </div>
              <label className="w-fit cursor-pointer rounded-full bg-zinc-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5">
                Upload sticker
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={handleImageStickerUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
