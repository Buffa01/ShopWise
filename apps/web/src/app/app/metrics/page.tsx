"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientAuthGate } from "../../../components/client-auth-gate";
import { OverviewMetrics, getClientOverviewMetrics } from "../../../lib/metrics";

export default function ClientMetricsPage() {
  return (
    <ClientAuthGate>
      {() => <ClientMetricsContent />}
    </ClientAuthGate>
  );
}

function ClientMetricsContent() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClientOverviewMetrics()
      .then(setMetrics)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load metrics");
      });
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Client</p>
          <h1>Metrics</h1>
        </div>
        <Link href="/app">Back</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!metrics && !error ? <p>Loading...</p> : null}

      {metrics ? (
        <>
          <section className="metric-grid">
            <MetricCard label="My devices" value={metrics.totalDevices} />
            <MetricCard label="Active devices" value={metrics.activeDevices} />
            <MetricCard label="Total scans" value={metrics.totalScans} />
            <MetricCard label="QR scans" value={metrics.qrScans} />
            <MetricCard label="NFC taps" value={metrics.nfcTaps} />
            <MetricCard label="Redirects" value={metrics.redirects} />
          </section>

          <section className="events-section">
            <h2>Top devices</h2>
            {metrics.topDevices.length ? (
              <div className="table-list">
                {metrics.topDevices.map((device) => (
                  <Link className="table-row metrics-row" href={`/app/devices/${device.deviceId}`} key={device.deviceId}>
                    <div>
                      <strong>{device.alias || device.publicCode}</strong>
                      <span>{device.deviceTypeName ?? "Device"}</span>
                    </div>
                    <span>{device.scans} scans</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No device scans yet.</p>
            )}
          </section>

          <section className="events-section">
            <h2>Scans by day</h2>
            {metrics.scansByDay.some((point) => point.total > 0) ? (
              <div className="table-list">
                {metrics.scansByDay
                  .filter((point) => point.total > 0)
                  .slice(-14)
                  .map((point) => (
                    <div className="table-row metrics-row" key={point.date}>
                      <strong>{point.date}</strong>
                      <span>Total {point.total}</span>
                      <span>QR {point.qr}</span>
                      <span>NFC {point.nfc}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p>No scans in the last 30 days.</p>
            )}
          </section>

          <section className="events-section">
            <h2>Latest interactions</h2>
            {metrics.latestEvents?.length ? (
              <div className="table-list">
                {metrics.latestEvents.map((event) => (
                  <div className="table-row events-row" key={event.id}>
                    <div>
                      <strong>{event.eventType}</strong>
                      <span>{event.device?.alias || event.device?.publicCode || event.source}</span>
                    </div>
                    <span>{new Date(event.createdAt).toLocaleString()}</span>
                    <span>{event.referrer ?? "No referrer"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No interactions yet.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
