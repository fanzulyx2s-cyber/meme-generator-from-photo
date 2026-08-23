export const FREE_EXPORT_MAX_EDGE = 1080;

export type ExportTier = "free" | "creator" | "verified_free";

export type ExportDimensions = {
  width: number;
  height: number;
};

export type ExportPolicy = {
  tier: ExportTier;
  includePlatformWatermark: boolean;
  dimensions: ExportDimensions;
};

export function getFreeExportDimensions(
  width: number,
  height: number,
): ExportDimensions {
  const longestEdge = Math.max(width, height);

  if (longestEdge <= FREE_EXPORT_MAX_EDGE) {
    return { width, height };
  }

  const scale = FREE_EXPORT_MAX_EDGE / longestEdge;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function getExportPolicy(
  isCreator: boolean,
  width: number,
  height: number,
): ExportPolicy {
  if (isCreator) {
    return {
      tier: "creator",
      includePlatformWatermark: false,
      dimensions: { width, height },
    };
  }

  return {
    tier: "free",
    includePlatformWatermark: true,
    dimensions: getFreeExportDimensions(width, height),
  };
}

export function shouldShowCreatorUpgrade(
  successfulFreeExports: number,
  hasShownCreatorUpgrade: boolean,
) {
  return successfulFreeExports >= 3 && !hasShownCreatorUpgrade;
}
