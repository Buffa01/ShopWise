# QR/NFC Short Link Strategy

## Recommended URL Format

Use source-specific paths:

```text
QR:  https://sw.uy/r/{publicCode}
NFC: https://sw.uy/n/{publicCode}
```

Example:

```text
https://sw.uy/r/A0001
https://sw.uy/n/A0001
```

## Code Strategy

Use public codes that are distinct from internal UUIDs.

Initial format:

```text
A000001
```

Recommended scalable format:

```text
{series}{base36Sequence}
```

Examples:

```text
A000001
A00000Z
A000010
B000001
```

## Why Base36

- Human-readable enough for support.
- Shorter than decimal.
- Avoids case sensitivity issues from base62.
- Easy to print and read.
- Works well with NFC URL length constraints.

## Capacity

With one prefix letter and six base36 characters:

```text
36^6 = 2,176,782,336 codes per prefix
```

This is more than enough for v1. Additional prefixes can represent product lines, print batches, markets, or manufacturing series.

## Collision Handling

The database must enforce `publicCode` uniqueness.

Generation process:

1. Allocate next sequence from a controlled source.
2. Convert to padded base36.
3. Add prefix.
4. Attempt insert.
5. On unique collision, retry with next sequence.

Do not rely only on random short codes for batch generation.

## Future-Proofing

Add a `CodeSequence` table if needed:

```prisma
model CodeSequence {
  id        String   @id @default(uuid())
  prefix    String   @unique
  nextValue BigInt
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

For v1, this can be implemented through a transaction-safe sequence service.

## QR vs NFC Analytics

Source-specific URL paths are the canonical analytics source. User agent detection should only be metadata, not the source of truth.

