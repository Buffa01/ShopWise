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

The device type can store a base PNG/JPG sticker design plus QR placement in millimeters. If a base design exists, the PDF generator uses it as the full sticker background and inserts the device QR at the saved QR rectangle. If no base design exists, the system falls back to the basic 10 cm circular template.

QR placement format:

```json
{
  "unit": "mm",
  "sticker": {
    "shape": "circle",
    "widthMm": 100,
    "heightMm": 100,
    "diameterMm": 100
  },
  "qr": {
    "xMm": 34,
    "yMm": 34,
    "widthMm": 32,
    "heightMm": 32
  }
}
```

Admin template editor behavior:

1. Upload the base sticker design as PNG/JPG.
2. Set sticker diameter in mm.
3. Set QR width and height in mm.
4. Drag the red QR box over the image.
5. Save the generated coordinates.
6. New devices generated from that type use the saved design and QR placement.

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

1. Export high-resolution static base artwork from Figma without QR as PNG/JPG.
2. Upload it to the device type.
3. Place QR with the admin visual editor.
4. Render final PDF.

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
5. Allow admin to download a batch print sheet PDF.
6. Mark failed devices with `productionStatus = ERROR`.
7. Mark batch as `PARTIAL_ERROR` if some assets fail.

Batch print sheet:

```text
Sheet width: 1300 mm
Sticker size: 100 mm
Gap between stickers: 20 mm
Columns: 11
Height: dynamic
```

## Future Enhancements

- Multiple templates by product.
- Dynamic CTA text.
- Client branding.
- Multiple sticker sizes.
- Stored batch print sheet assets instead of on-demand generation.
- Direct print vendor export packages.
- Regeneration history and approvals.
