# Campaign Studio Working Memory

## Completed scope

Updated the existing authenticated admin Campaign Studio using the supplied November 2026 library of 28 Meal Direct campus campaign briefs. The original source is preserved in `docs/campaign-prompt-library.txt` and loaded on demand from `public/campaign/prompt-library.json`.

## Implementation

- Searchable library with four categories, separate university/campus names, campaign-specific fields and destinations, optional approved image uploads, and alternate feedback/quote, menu/poll and partnership actions.
- Source palette, Outfit display type and Inter body type. Responsive SVG layouts for feed, story, square and applicable print formats; duplex pocket flyers and packaging inserts.
- Real QR generation with a four-module quiet zone. Invalid or changed destinations immediately remove stale QR artwork.
- Editable SVG and exact-size PNG exports embed local images and font assets. Print canvases include 3 mm bleed; printer color conversion and PDF/X-4 finishing remain outside the studio.
- Incomplete facts and unchecked approvals retain a review-proof watermark. Text overflow blocks export. Content and format edits, imports, and reopening require fresh review.
- Version 2 drafts are saved immediately in browser local storage, isolated by campus/template, with JSON backup/import and storage-error feedback. Previous-version drafts are not reused.
- Existing authenticated campus reads and route protection are retained. No campaign mutation endpoint or deployment was added.

## Files

- `components/admin/campaign/CampaignStudio.tsx`: library, editing, review and persistence flow.
- `components/admin/campaign/CampaignPoster.tsx`: SVG composition and text fitting.
- `lib/campaign-studio.ts`: 28 templates, variants, formats, copy and validation.
- `lib/campaign-drafts.ts`: versioned local storage validation.
- `lib/campaign-export.ts`: layout preflight and embedded SVG/PNG exports.
- `app/(admin)/campaigns/page.tsx`: Outfit font scope.
- `test/campaign-*.test.*`: 16 focused tests.

## Verification — 10 November 2026

- TypeScript and targeted ESLint passed.
- All 16 campaign tests passed, covering draft isolation, malformed/legacy data, quota errors, URLs, required facts, stale QR responses, edit/review state and alternate-campaign reset.
- A temporary browser fixture exercised the real studio with two mocked campus records. All 112 default template/format combinations passed text and canvas bounds checks.
- Long names, filled event and quote fields, three-step content, counter vendor name, reverse sides and an A7 support contact passed layout checks. A 390 px viewport had no horizontal overflow.
- PNG and editable SVG downloads were verified; the exported 1080 x 1350 PNG QR decoded to the selected campus URL. Assets and fonts were embedded in the SVG.
- Screenshots remain under `output/playwright/campaign-*.png`. The temporary fixture server and browser were stopped. Automatic approval review blocked deletion of `output/playwright/campaign-harness`; that folder and its temporary dependencies remain. Generated browser logs and export copies also remain in `.playwright-cli`.

## Remaining limits

- No authenticated live-campus session was available; the browser checks used fixture campus data. Existing unauthenticated route redirect was verified earlier.
- Production build, physical phone scanning, printer proofing and color-profile conversion were not performed.
- Drafts are local to the device. Shared storage and audit history require a supported backend contract.

## Selected visual reference — completed 12 November 2026

- The user supplied a 28-panel campaign image and requested completion of that visual direction.
- Added `lib/campaign-art-direction.ts`, a preserved reference sheet, three illustrative generated portraits, reference thumbnails and updated default headlines. Existing brief IDs, user drafts and required-fact checks are preserved.
- Updated the SVG renderer to pale mint backgrounds, black/green headlines with optional green highlights, right-side imagery, and green CTA buttons next to the generated QR. Print reverse sides remain available.
- Fixed headline width estimation and a CTA/URL overlap found in visual checks.
- Verification: 16 tests, typecheck and targeted lint passed; 112 default layouts plus long names, filled event/quote details, reverse sides and mobile checks passed. The new PNG/SVG exports were inspected, and the PNG QR decoded correctly.
- See `docs/campaign-art-direction.md` for asset provenance, scope and verification. Current preview: `output/playwright/reference-studio.png`; exported proof: `output/playwright/reference-launch-export.png`.
