# Creator Conversion Copy Design

## Goal

Make the $9 Creator purchase easier to understand before checkout and easier to activate afterwards, without changing pricing, payment, entitlements, accounts, analytics, or data handling.

## Scope

The change covers three existing user-visible locations:

1. The one-time Creator upgrade dialog shown after a user's third successful free export.
2. The Creator card and FAQ on `/pricing`.
3. The `/success` page shown after Creem checkout.

## Copy and behavior

### Upgrade dialog

The dialog continues to describe watermark-free exports and original canvas resolution. It additionally states that Creator is a `$9 one-time purchase — not a subscription.` The existing `Continue with Free` action remains non-blocking and continues to close the dialog.

### Pricing page

The Creator checkout area states that checkout is handled securely by Creem and that the License Key is sent in the purchase email after payment. The FAQ explains the activation path: receive the key, return to MemePhoto AI, and paste it into the Creator License panel.

### Success page

Replace the single activation paragraph with an ordered three-step instruction:

1. Open the Creem purchase email.
2. Copy the License Key.
3. Return to MemePhoto AI and paste it into the Creator License panel.

The page may remind the purchaser that the existing license supports up to three browser activations. It must not imply account login, cross-device automatic restoration, subscriptions, or any future entitlement.

## Non-goals and safety boundaries

- No change to the $9 price, checkout URL, Creem integration, or license verification.
- No database, email sender, analytics platform, cookie, or environment variable.
- No collection of user email, image data, license values, or payment information.
- No production configuration or deployment action.

## Test strategy

- Extend the existing meme generator export test to assert the one-time-purchase text appears with the existing upgrade dialog.
- Retain and re-run the existing assertion that `Continue with Free` closes the dialog.
- Add focused rendering checks for the pricing and success-page activation guidance if the existing test structure supports page-level tests; otherwise verify their static content through the production build and targeted review.

## Acceptance criteria

- A buyer can determine before checkout that Creator costs $9 once and is not a subscription.
- A successful purchaser sees the exact path to retrieve and activate the License Key.
- The existing free export flow, Creator entitlements, checkout navigation, and non-blocking `Continue with Free` behavior are unchanged.
- No personal data or new third-party service is introduced.
