export type CreatorConversionEvent =
  | "creator_upgrade_shown"
  | "creator_checkout_clicked"
  | "creator_activation_opened"
  | "creator_purchase_success_viewed";

export type CheckoutSource = "pricing_page" | "creator_license_panel";

type GaCommand =
  | ["js", Date]
  | ["config", string, { send_page_view: true }]
  | ["event", CreatorConversionEvent, { source?: CheckoutSource }];

declare global {
  interface Window {
    dataLayer?: GaCommand[];
  }
}

const measurementIdPattern = /^G-[A-Z0-9]{6,}$/i;
const scriptSelector = "script[data-ga4]";

function configuredMeasurementId() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return measurementId && measurementIdPattern.test(measurementId)
    ? measurementId
    : null;
}

export function initializeGa4() {
  if (typeof window === "undefined") {
    return;
  }

  const measurementId = configuredMeasurementId();

  if (!measurementId) {
    return;
  }

  window.dataLayer ??= [];

  if (document.querySelector(scriptSelector)) {
    return;
  }

  window.dataLayer.push(["js", new Date()]);
  window.dataLayer.push(["config", measurementId, { send_page_view: true }]);

  const script = document.createElement("script");
  script.async = true;
  script.dataset.ga4 = "true";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.append(script);
}

export function trackCreatorConversion(
  event: CreatorConversionEvent,
  attributes: { source?: CheckoutSource } = {},
) {
  if (typeof window === "undefined" || !configuredMeasurementId()) {
    return;
  }

  initializeGa4();
  window.dataLayer?.push(["event", event, attributes]);
}
