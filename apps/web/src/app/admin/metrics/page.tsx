"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { useI18n } from "../../../lib/i18n";
import { OverviewMetrics, getAdminOverviewMetrics } from "../../../lib/metrics";

export default function AdminMetricsPage() {
  return (
    <AdminAuthGate>
      {() => <AdminMetricsContent />}
    </AdminAuthGate>
  );
}

function AdminMetricsContent() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverviewMetrics()
      .then(setMetrics)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("metrics.loadError"));
      });
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("common.metrics")}</h1>
        </div>
        <Link href="/admin">{t("common.back")}</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!metrics && !error ? <p>{t("common.loading")}</p> : null}

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
  const { t } = useI18n();

  return (
    <section className="metric-grid">
      <MetricCard label={t("metrics.totalDevices")} value={metrics.totalDevices} />
      <MetricCard label={t("metrics.activeDevices")} value={metrics.activeDevices} />
      <MetricCard label={t("metrics.assigned")} value={metrics.assignedDevices} />
      <MetricCard label={t("metrics.unassigned")} value={metrics.unassignedDevices} />
      <MetricCard label={t("metrics.totalScans")} value={metrics.totalScans} />
      <MetricCard label={t("metrics.qrScans")} value={metrics.qrScans} />
      <MetricCard label={t("metrics.nfcTaps")} value={metrics.nfcTaps} />
      <MetricCard label={t("metrics.redirects")} value={metrics.redirects} />
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
  const { t } = useI18n();
  const visiblePoints = points.filter((point) => point.total > 0).slice(-14);

  return (
    <section className="events-section">
      <h2>{t("metrics.scansByDay")}</h2>
      {visiblePoints.length ? (
        <div className="table-list">
          {visiblePoints.map((point) => (
            <div className="table-row metrics-row" key={point.date}>
              <strong>{point.date}</strong>
              <span>{t("metrics.totalScans")} {point.total}</span>
              <span>QR {point.qr}</span>
              <span>NFC {point.nfc}</span>
            </div>
          ))}
        </div>
      ) : (
        <p>{t("metrics.noScans30")}</p>
      )}
    </section>
  );
}

function TopDevices({ devices }: { devices: OverviewMetrics["topDevices"] }) {
  const { t } = useI18n();

  return (
    <section className="events-section">
      <h2>{t("metrics.topDevices")}</h2>
      {devices.length ? (
        <div className="table-list">
          {devices.map((device) => (
            <Link className="table-row metrics-row" href={`/admin/devices/${device.deviceId}`} key={device.deviceId}>
              <div>
                <strong>{device.alias || device.publicCode}</strong>
                <span>{device.businessName ?? device.deviceTypeName ?? t("common.noClient")}</span>
              </div>
              <span>{device.scans} {t("metrics.totalScans")}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p>{t("metrics.noDeviceScans")}</p>
      )}
    </section>
  );
}

function TopClients({ clients }: { clients: NonNullable<OverviewMetrics["topClients"]> }) {
  const { t } = useI18n();

  return (
    <section className="events-section">
      <h2>{t("metrics.topClients")}</h2>
      {clients.length ? (
        <div className="table-list">
          {clients.map((client) => (
            <Link className="table-row metrics-row" href={`/admin/clients/${client.businessId}`} key={client.businessId}>
              <strong>{client.businessName}</strong>
              <span>{client.scans} {t("metrics.totalScans")}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p>{t("metrics.noClientScans")}</p>
      )}
    </section>
  );
}
