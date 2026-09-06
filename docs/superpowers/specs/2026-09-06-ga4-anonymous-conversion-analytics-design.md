# GA4 Anonymous Conversion Analytics Design

## Goal

Measure the Creator conversion funnel without creating accounts, storing events
in a MemePhoto AI database, or sending personal content to analytics.

## Scope

When a public GA4 measurement ID is configured, the site will load Google
Analytics and send these anonymous events:

1. `creator_upgrade_shown` when the third successful free export opens the
   Creator upgrade dialog.
2. `creator_checkout_clicked` when a visitor selects a Creator checkout entry
   point, with a fixed `source` value that identifies only the UI location.
3. `creator_activation_opened` when a visitor opens the Creator License panel.
4. `creator_purchase_success_viewed` when the `/success` page is viewed.

The `source` values are fixed strings such as `pricing_page` and
`export_upgrade_dialog`; they never include visitor-entered values.

## Privacy Boundaries

Analytics events must not contain an email address, license key, payment data,
order reference, IP address supplied by application code, image data, caption
text, browser activation identifier, or user-generated text.

The GA4 measurement ID is a public client configuration value named
`NEXT_PUBLIC_GA_MEASUREMENT_ID`. If it is absent or malformed, no Google script
loads and tracking helpers are no-ops. The app must not use a fallback ID.

The Privacy Policy will state that GA4 may receive anonymous page and
interaction data for aggregated usage and conversion measurement, identify the
event categories, and state which sensitive data is excluded. It will keep the
existing statement that MemePhoto AI does not use advertising cookies or
third-party behavioral advertising trackers.

## Architecture

- A small client-side analytics module owns ID validation, script loading, and
  the typed event helper.
- A root client component loads GA4 once when valid configuration exists.
- Existing UI components call the helper at the four defined funnel points.
- A `dataLayer` type declaration supports tests without adding an analytics
  package or a new runtime dependency.

## Failure Handling

Analytics is best-effort and must never block downloads, checkout navigation,
license activation, page rendering, or error recovery. A missing or blocked
Google script is silent from the product user's perspective. Event code must
not log event payloads or expose configuration values.

## Verification

Unit tests will prove that invalid/missing configuration does not inject a
script or emit an event, valid configuration initializes once, each event has
only its allowed fixed attributes, and the relevant UI entry points invoke the
helper. Existing AI tests, lint, TypeScript checks, and production build remain
green.

## Out of Scope

- Production deployment or Vercel environment changes.
- Creating or configuring a real GA4 property/data stream.
- Cookies banners, consent-management tooling, advertising audiences, or
  remarketing.
- Databases, accounts, email collection, server-side purchase tracking, and
  changing the Creem checkout flow.
