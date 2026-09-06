"use client";

import { useEffect } from "react";

import {
  initializeGa4,
  trackCreatorConversion,
  type CreatorConversionEvent,
} from "../lib/analytics/ga4";

export function GoogleAnalytics() {
  useEffect(() => {
    initializeGa4();
  }, []);

  return null;
}

export function ConversionEventTracker({
  event,
}: {
  event: CreatorConversionEvent;
}) {
  useEffect(() => {
    trackCreatorConversion(event);
  }, [event]);

  return null;
}
