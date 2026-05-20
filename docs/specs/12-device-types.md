# Device Types

## Goal

Device types allow ShopWise to support multiple physical products without changing core device logic.

Launch type:

```text
Google Reviews
```

Future examples:

```text
Instagram
WhatsApp
Menu
WiFi
TikTok
Catalog
Custom Link
Payments
Reservations
Order Now
```

## Admin Requirements

Admin can create a device type with:

- Name.
- Slug.
- Description.
- Active/inactive status.
- Default code prefix.
- Base sticker/sign design.
- QR placement configuration.
- Template key.

## Device Creation

When admin creates devices, the admin chooses a device type.

Example:

```text
Type: Google Reviews
Quantity: 100
Prefix: A
```

The system then uses the selected type to:

- Select the base design.
- Place the QR in the right location.
- Generate the correct print asset.
- Apply type-specific validation later if needed.

## Client UX

Clients can see the device type on their device list and detail page.

Example:

```text
Mostrador Frente
Type: Google Reviews
```

For launch, clients do not need to create device types. Only admins manage them.

## Sticker Template Behavior

Each device type can have one active base template initially.

Future versions can support:

- Multiple sizes.
- Multiple designs per type.
- Client-branded variants.
- Template versioning.

