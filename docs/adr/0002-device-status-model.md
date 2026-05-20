# ADR-0002: Split Device Status into Three Dimensions

## Status

Accepted for initial implementation.

## Context

A single `status` field would mix production, assignment, and operational concerns:

- `created`
- `print_ready`
- `downloaded`
- `printed`
- `unassigned`
- `assigned`
- `active`
- `paused`
- `disabled`
- `error`
- `archived`

This creates invalid combinations and unclear transitions.

## Decision

Use three status fields:

```text
productionStatus: CREATED | ASSET_GENERATED | DOWNLOADED | PRINTED | ERROR
assignmentStatus: UNASSIGNED | ASSIGNED
operationalStatus: INACTIVE | ACTIVE | PAUSED | DISABLED | ARCHIVED
```

## Rules

- Newly created devices start as:
  - `productionStatus = CREATED`
  - `assignmentStatus = UNASSIGNED`
  - `operationalStatus = INACTIVE`
- A device can be printed while unassigned.
- A device can be assigned but paused.
- Archived devices are not claimable and should not redirect to customer targets.
- Production errors do not necessarily disable an already working device, but they must be visible to admins.

## Rationale

Separate status dimensions make filtering, reporting, and workflow validation simpler. They also support real business states without creating a large enum of combined values.

