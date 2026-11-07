# Pasko Photo Magic — App Prompt

Build and maintain a mobile-first Christmas AI photo transformation app for Filipino customers called **Pasko Photo Magic**, with the tagline **“Balik Alaala sa Pasko.”** Preserve the existing uploaded logo and app name; do not rename it XmasMagic PH or Pasko Memories.

## Design and branding

- Use English with optional Filipino language support and Philippine Peso (₱) pricing.
- Follow the owner's uploaded Christmas artwork: bright snowy scenery, festive red, green, white, and gold, gifts, parol lanterns, and photo transformations.
- Preserve the latest uploaded opening artwork, package artwork, sample-transformations artwork, and How It Works artwork. Keep pictured action buttons functional through accessible links where needed.
- Keep the experience mobile-first, readable, and fast on low-end Android devices. Avoid horizontal overflow, overlapping text, and decorative-only controls.
- Keep presentation changes separate from checkout rules.

## Required customer process

1. **Upload photo:** Accept one JPG/JPEG, PNG, or WEBP photo, up to 10 MB; show a preview and allow replacement.
2. **Choose template:** Let the customer choose their preferred Christmas style before proceeding to payment.
3. **Payment:** Show the package, customer details, selected template, and payment choices. Create an order with a unique reference and Pending Payment status. Allow payment-reference submission.
4. **Generate 5 photos:** Generate only after an admin verifies payment. Produce the selected template first, followed by the remaining four styles. Every order includes all five styles.

Customers do not need to sign in. Keep order access private through a secret per-order access token; an order reference alone must not reveal customer photos.

## Packages and payment

- **Basic Magic — ₱99:** One uploaded photo transformed into five Christmas photos; no background music.
- **Magic with Music — ₱149:** One uploaded photo transformed into five Christmas photos, plus a slideshow and background music. Mark this package Recommended.
- Support **GCash, Maya, and bank transfer**.
- Read active prices from server-side settings when creating an order; never trust a price supplied by the browser.
- Never mark an order paid merely because a customer submitted a payment reference. Admin verification is required unless a real verified payment-provider integration is implemented.
- Do not invent payment-account details or contact information.

## Five Christmas styles

1. Santa Claus Christmas
2. Christmas Family Portrait
3. Winter Wonderland
4. Christmas Lights & Bokeh
5. Red & Green Christmas Fashion

Aim to preserve the subjects' recognizable faces, skin tones, ages, and natural appearance. Restore faded or scratched originals naturally and produce photorealistic Christmas portraits. Do not promise perfect identity preservation or present illustrative samples as actual customer results.

## Real AI photo generation

- Use the connected **Replicate** provider with the official SDK and **black-forest-labs/flux-kontext-pro** through the Lovable connector gateway.
- Keep credentials and provider requests server-side. Never expose secrets to the browser or place them in this document.
- Disable automatic replay of billed generation requests. Poll an existing prediction rather than creating another prediction on a polling retry.
- Generate one style per server call to avoid long-running requests.
- Validate downloaded output as a PNG and keep order images private.
- Show actionable errors for unavailable service, insufficient credit, failed predictions, or invalid output. Never fabricate successful AI results.
- Require a stored admin payment-verification timestamp for generation and retries; a Processing or Failed status alone is insufficient.

## Tester button — current unfinished-app phase

- Place **Test Photo** beside the payment options, after a photo and template have been selected.
- Testers must not need to sign in or enter an access code.
- Use the uploaded photo and selected template to generate **one real test image**, show it, and offer a download.
- Show a loading state, prevent duplicate clicks during generation, and display failures clearly.
- Test generation must not create or modify orders, verify payments, or bypass the paid five-photo generation gate.
- Retain the separate admin-only photo-test control with server-verified admin access.
- Public tester access is intentional only for the unfinished testing phase; review it before launching because each generation can consume the owner's Replicate balance.

## Customer results

- Show order reference, selected template, package, and accurate status.
- Use the statuses **Pending Payment**, **Payment Verified**, **Processing**, **Completed**, and **Failed**.
- Display real generated images when available and allow downloads.
- Provide the slideshow and available licensed music for Magic with Music; Basic Magic has no music.
- Keep private media behind short-lived signed URLs.

## Music

The owner requested Christmas music including the chorus of **Christmas in Our Hearts** by Jose Mari Chan. Use only uploaded audio the owner is licensed to use; do not source or embed unauthorized commercial recordings. Traditional songs do not automatically make particular recordings or arrangements free to use. Do not claim music is available until suitable audio has been provided.

## Admin area

- Protect admin access with authentication and server-verified roles stored separately from user-editable metadata.
- Preserve the existing first-signup admin assignment behavior.
- Provide order search and filtering, status and sales summaries, payment verification, generation and retry controls, photo tests, and order/media management.
- Allow management of prices, payment-account details, sample images, music, and retention cleanup settings.
- Never allow non-admin customers or testers to change payment status or generate unpaid order results.

## Technical constraints

- Preserve the existing TanStack Start v1, React, TypeScript, and Tailwind CSS v4 application; use TanStack Router rather than installing another routing framework.
- Use Lovable Cloud for data, authentication, and private storage.
- Keep app-internal server functions in `src/lib/api/*.functions.ts` and server-only helpers in `src/server/*.server.ts`, dynamically imported inside handlers.
- Keep `order-photos` and `site-media` buckets private; expose only short-lived signed media URLs.
- Preserve server-side price validation, order-access tokens, protected admin roles, and payment-verification gates.
- Use shared design tokens and existing accessible UI controls. Give content pages distinct app-specific titles and descriptions.
- Do not replace working customer flows when updating artwork or styling.

## Verification expectations

- Test photo upload → template selection → payment → Pending Payment order creation, including persistence of the chosen template.
- Verify unpaid orders cannot generate photos, including failed-order retry paths.
- Verify the public Test Photo flow works without login or codes, produces a real downloadable image, and leaves orders and payments untouched.
- Verify admin-only tests reject non-admin callers before any AI work.
- Test provider errors, invalid images, duplicate-request prevention, and preservation of private credentials.
- Check desktop and mobile artwork, navigation, dialogs, and downloads.
- Verify a complete paid-order flow with an admin account when available; do not claim this is verified based only on an isolated photo test.

## Known verification limit

Real Replicate photo generation and the signed-out checkout photo-test flow have succeeded. Full paid-order generation and customer readback remain unverified until an admin account is available. Preserve that distinction when reporting progress.