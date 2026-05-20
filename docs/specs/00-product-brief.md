# Product Brief

## Vision

ShopWise is a platform for physical connected devices. Each device has a stable internal ShopWise short link, a QR code, an NFC tag, an owner, a configurable destination, and analytics.

The business objective is not only to sell stickers. The platform must support multiple future device-based products: Google Reviews, Instagram, WhatsApp, menus, WiFi, TikTok, catalogs, payments, reservations, and order integrations.

## First Product

Google Reviews QR + NFC stickers:

- Circular resin stickers or printed signs.
- Customer places them in a store, counter, table, bar, or similar location.
- End user scans QR or taps NFC.
- ShopWise resolves the short code and redirects to the configured Google Reviews URL.

## Non-Negotiable Rule

QR and NFC must never point directly to the customer's final destination.

They must point to ShopWise internal short URLs:

- QR: `https://sw.uy/r/A0001`
- NFC: `https://sw.uy/n/A0001`

This enables destination changes, analytics, remote support, traceability, and device reuse.

## Primary Roles

### Admin / ShopWise

Internal operator responsible for creating devices, assigning devices, supporting customers, generating printable assets, and monitoring global metrics.

### Client

Business customer that owns or claims devices, configures destinations, manages aliases/status, and reviews basic analytics.

### Public Visitor

Anonymous end user scanning QR or tapping NFC. This user is redirected and does not need an account.

## Quality Bar

- Clear monorepo structure.
- Specs and ADRs before implementation.
- Strong module boundaries.
- Explicit validation and DTOs.
- Role-based authorization.
- Privacy-aware analytics.
- Audit trail for important changes.
- Printable assets generated consistently.
- Tests where behavior has business risk.

