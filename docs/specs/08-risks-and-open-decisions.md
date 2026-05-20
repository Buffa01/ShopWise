# Risks and Open Decisions

## Technical Risks

### Redirect Availability

The public redirect endpoint is business-critical. Downtime makes physical devices feel broken.

Mitigation:

- Keep redirect path simple and fast.
- Add monitoring early.
- Use managed database with backups.
- Consider edge caching only for fallback pages, not redirects that need analytics.

### Analytics Write Load

Every scan writes events. A popular deployment can create high write volume.

Mitigation:

- Start with PostgreSQL events.
- Index carefully.
- Add async queue or buffered ingestion if needed.
- Add aggregate tables later.

### NFC URL Length and Compatibility

NFC tags should contain short, stable URLs.

Mitigation:

- Use `https://sw.uy/n/{code}`.
- Avoid query strings.
- Validate written NFC data during production.

### QR Print Reliability

Print artifacts can fail if QR contrast, sizing, or quiet zone are poor.

Mitigation:

- Define QR minimum size.
- Validate with real printed samples.
- Use deterministic template rendering.

### Claim Abuse

Someone could claim a device they scan before the real owner.

Mitigation options:

- V1: allow claim only for unassigned devices and provide support recovery.
- Better: add claim codes or activation windows for shipped orders.
- Future: associate batches to orders before delivery.

### Privacy

Analytics can accidentally store personal data.

Mitigation:

- Hash or truncate IP addresses.
- Avoid storing full query strings from referrers if not needed.
- Do not expose raw user agents to clients unless necessary.
- Document retention policy.

## Pending Decisions

- Final deployment provider.
- Whether admin and client auth share one login surface.
- Whether to add refresh token rotation in v1 or after MVP.
- Whether batch asset generation runs inline initially or through a queue.
- Final Figma-to-template workflow.
- Initial claim protection level.
- Whether `sw.uy` serves only redirects or also fallback pages.
- Final observability stack.

