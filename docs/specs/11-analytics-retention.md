# Analytics Retention

## Clarification

Analytics counters are small. Persisting only totals such as scan counts per device barely costs anything.

The heavier part is raw event analytics if every scan stores:

- timestamp
- source
- user agent
- referrer
- hashed IP
- metadata

This is still manageable for a long time in PostgreSQL, but it should be designed intentionally.

## Recommended Strategy

Use both raw events and aggregates:

```text
DeviceEvent          -> raw append-only event log
DeviceDailyMetric    -> daily aggregated counters per device/source
```

## Retention

Initial recommendation:

```text
Raw DeviceEvent rows:    12 months
Daily aggregate metrics: keep indefinitely
```

This gives useful debugging and recent analytics without letting the event table grow forever.

## Future Aggregate Model

```prisma
model DeviceDailyMetric {
  id        String            @id @default(uuid())
  deviceId  String
  date      DateTime
  source    DeviceEventSource
  scans     Int               @default(0)
  redirects Int               @default(0)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  @@unique([deviceId, date, source])
  @@index([date])
}
```

## Cost Perspective

Example rough scale:

```text
10,000 scans/month    -> trivial
100,000 scans/month   -> still small
1,000,000 scans/month -> needs indexes, retention, and maybe aggregation jobs
```

The expensive scenario is not storing totals. The expensive scenario is keeping unlimited raw events forever while adding heavy metadata and querying them directly for dashboards.

