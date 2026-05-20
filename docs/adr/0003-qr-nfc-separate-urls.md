# ADR-0003: Separate QR and NFC URLs per Device

## Status

Accepted for initial implementation.

## Context

ShopWise needs to measure QR scans separately from NFC taps when possible.

Two options were considered:

- One URL per device: `https://sw.uy/A0001`
- Two source-specific URLs:
  - QR: `https://sw.uy/r/A0001`
  - NFC: `https://sw.uy/n/A0001`

## Decision

Generate two internal URLs per device:

- `qrUrl = https://sw.uy/r/{publicCode}`
- `nfcUrl = https://sw.uy/n/{publicCode}`

Both resolve to the same configured destination.

## Rationale

Source-specific URLs are the most reliable way to distinguish QR from NFC. User-agent heuristics are weak and inconsistent. The extra two characters in the path are acceptable for NTAG215.

## NFC Constraint

NTAG215 has enough practical capacity for short URLs like:

```text
https://sw.uy/n/A0001
```

Keep the NFC URL short and stable. Do not add tracking query parameters to NFC links.

