# Selected campus campaign direction

The user selected `Codex Image 10 Nov 2026, 14_11_49.png` as the visual reference for Campaign Studio. Its project copy is `public/campaign/reference/contact-sheet.png`.

The renderer now uses pale mint backgrounds, black and green display headlines, selected green headline highlights, right-aligned portrait/food imagery, a compact brand header, and green action buttons beside real QR codes. Coming Soon retains a dark green treatment. Text, images, brand assets and QR artwork remain separate SVG layers.

The existing 28 production briefs, campaign identifiers and saved drafts remain stable. The reference sheet's panel ordering differs from the brief library; `lib/campaign-art-direction.ts` maps each brief to the closest visual reference. This is an editable adaptation, not a pixel-for-pixel copy of the contact sheet. Unsupported offers, rewards, quotations and operational claims in the reference are not adopted as verified campaign facts.

## Asset provenance

- `student.png`: AI-generated illustrative Nigerian student portrait, informed by the selected sheet.
- `vendor.png`: AI-generated illustrative Nigerian food-vendor portrait.
- `rider.png`: AI-generated illustrative Nigerian delivery-partner portrait.
- Existing food/lifestyle images remain available; admin uploads override the bundled artwork.
- The existing official logo icon is retained. The reference's generated logo and QR patterns are not used in exported artwork.

The generated portraits do not represent actual Meal Direct staff, vendors or endorsers. Campaigns requiring an actual named person or meal still require an approved upload before final export.

## Verification — 12 November 2026

- All 16 campaign tests passed; TypeScript and targeted ESLint passed.
- Browser layout preflight passed all 112 default template/format combinations.
- Long university names, event details, student quotation mode, reverse sides and 390 px mobile width passed the fixture checks.
- PNG and SVG exports downloaded successfully. The exported PNG is 1080 × 1350 and its QR decoded to the selected campus URL.
- The export was visually inspected for image embedding, typography, headline highlights, CTA placement and QR clearance.

Browser verification used the existing isolated campus-data fixture. Production authentication and API behavior were not changed, and no deployment was performed.
