"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { OverviewMetrics, getAdminOverviewMetrics } from "../../../lib/metrics";

export default function AdminMetricsPage() {
  return (
    <AdminAuthGate>
      {() => <AdminMetricsContent />}
    </AdminAuthGate>
  );
}

function AdminMetricsContent() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverviewMetrics()
      .then(setMetrics)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load metrics");
      });
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Metrics</h1>
        </div>
        <Link href="/admin">Back</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!metrics && !error ? <p>Loading...</p> : null}

      {metrics ? (
        <>
          <MetricCards metrics={metrics} />
          <ScansByDay points={metrics.scansByDay} />
          <TopDevices devices={metrics.topDevices} />
          <TopClients clients={metrics.topClients ?? []} />
        </>
      ) : null}
    </main>
  );
}

function MetricCards({ metrics }: { metrics: OverviewMetrics }) {
  return (
    <section className="metric-grid">
      <MetricCard label="Total devices" value={metrics.totalDevices} />
      <MetricCard label="Active devices" value={metrics.activeDevices} />
      <MetricCard label="Assigned" value={metrics.assignedDevices} />
      <MetricCard label="Unassigned" value={metrics.unassignedDevices} />
      <MetricCard label="Total scans" value={metrics.totalScans} />
      <MetricCard label="QR scans" value={metrics.qrScans} />
      <MetricCard label="NFC taps" value={metrics.nfcTaps} />
      <MetricCard label="Redirects" value={metrics.redirects} />
    </section>
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

function ScansByDay({ points }: { points: OverviewMetrics["scansByDay"] }) {
  const visiblePoints = points.filter((point) => point.total > 0).slice(-14);

  return (
    <section className="events-section">
      <h2>Scans by day</h2>
      {visiblePoints.length ? (
        <div className="table-list">
          {visiblePoints.map((point) => (
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
  );
}

function TopDevices({ devices }: { devices: OverviewMetrics["topDevices"] }) {
  return (
    <section className="events-section">
      <h2>Top devices</h2>
      {devices.length ? (
        <div className="table-list">
          {devices.map((device) => (
            <Link className="table-row metrics-row" href={`/admin/devices/${device.deviceId}`} key={device.deviceId}>
              <div>
                <strong>{device.alias || device.publicCode}</strong>
                <span>{device.businessName ?? device.deviceTypeName ?? "No client"}</span>
              </div>
              <span>{device.scans} scans</span>
            </Link>
          ))}
        </div>
      ) : (
        <p>No device scans yet.</p>
      )}
    </section>
  );
}

function TopClients({ clients }: { clients: NonNullable<OverviewMetrics["topClients"]> }) {
  return (
    <section className="events-section">
      <h2>Top clients</h2>
      {clients.length ? (
        <div className="table-list">
          {clients.map((client) => (
            <Link className="table-row metrics-row" href={`/admin/clients/${client.businessId}`} key={client.businessId}>
              <strong>{client.businessName}</strong>
              <span>{client.scans} scans</span>
            </Link>
          ))}
        </div>
      ) : (
        <p>No client scans yet.</p>
      )}
    </section>
  );
}
