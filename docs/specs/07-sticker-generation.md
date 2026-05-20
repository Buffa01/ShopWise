# Sticker Generation

## Goal

Automatically generate print-ready sticker/sign assets by reusing the existing base design and inserting only the device-specific QR code for v1.

## Inputs

- Device type.
- Device `publicCode`.
- Device `qrUrl`.
- Base sticker template.
- QR placement coordinates.
- Output format configuration.

## Outputs

- QR image asset.
- Print-ready PDF.
- Print-ready PNG later if needed.
- Optional SVG later if the design pipeline supports it safely.

## Recommended Architecture

Use HTML/CSS templates rendered in a headless browser:

```text
Template HTML/CSS + QR image -> Playwright/Puppeteer render -> PNG/PDF -> R2/S3
```

Store templates under:

```text
packages/templates/sticker/
```

Suggested template organization:

```text
packages/templates/sticker/
  google-review/
  instagram/
  whatsapp/
```

For launch, `google-review` is required. Additional types can be created from the admin panel by uploading a base design and defining the QR placement.

## Launch Sticker Size

The initial Google Reviews sticker is circular:

```text
Diameter: 10 cm
Output: PDF initially
```

Initial implementation:

```text
QR PNG: storage/devices/{publicCode}/qr.png
PDF:    storage/devices/{publicCode}/sticker.pdf
```

The first generated PDF is a basic 10 cm circular template with the QR inserted. The final Figma-based artwork can replace the template in a later iteration without changing the device or asset model.

Reference file:

```text
/Users/nicolasmartinbuffa/Downloads/sticker_google.pdf
```

## Why HTML/CSS Rendered Assets

- Easy to automate in batches.
- Works well with pixel-perfect static layouts.
- Can be versioned in Git.
- Can later support dynamic text, colors, CTAs, product variants, and sizes.
- Easier to run in backend jobs than direct Figma automation.

## Design Source

The Figma design remains the source of visual truth. For v1, convert/export the static background or recreate the exact layout as an HTML/CSS template.

If the design is mostly static, prefer:

1. Export high-resolution static base artwork from Figma without QR.
2. Place QR in a fixed slot in the HTML template.
3. Render final PNG/PDF.

## Print Quality Requirements

- Define physical dimensions in mm.
- Render at 300 DPI or higher.
- Use high-contrast QR colors.
- Keep sufficient quiet zone around the QR.
- Test scan reliability from printed samples.
- Preserve template version in `PrintAsset.templateKey`.

## Batch Behavior

For batch creation:

1. Generate devices.
2. Generate QR images.
3. Generate printable assets.
4. Store generated files.
5. Mark failed devices with `productionStatus = ERROR`.
6. Mark batch as `PARTIAL_ERROR` if some assets fail.

## Future Enhancements

- Multiple templates by product.
- Dynamic CTA text.
- Client branding.
- Multiple sticker sizes.
- Direct print vendor export packages.
- Regeneration history and approvals.
