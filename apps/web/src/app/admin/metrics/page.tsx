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
    <main className="dashboard-shell admin-metrics-page">
      <section className="admin-metrics-hero">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("common.metrics")}</h1>
        </div>
        <Link className="admin-secondary-action" href="/admin">{t("common.back")}</Link>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {!metrics && !error ? <p>{t("common.loading")}</p> : null}

      {metrics ? (
        <>
          <MetricCards metrics={metrics} />
          <section className="admin-metrics-grid">
            <ScansByDay points={metrics.scansByDay} />
            <TopDevices devices={metrics.topDevices} />
            <TopClients clients={metrics.topClients ?? []} />
          </section>
        </>
      ) : null}
    </main>
  );
}

function MetricCards({ metrics }: { metrics: OverviewMetrics }) {
  const { t } = useI18n();

  return (
    <section className="admin-metrics-summary">
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
    <div className="admin-metrics-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScansByDay({ points }: { points: OverviewMetrics["scansByDay"] }) {
  const { t } = useI18n();
  const visiblePoints = points.filter((point) => point.total > 0).slice(-14);

  return (
    <section className="admin-metrics-panel admin-metrics-panel-wide">
      <div className="admin-metrics-panel-heading">
        <span>{t("metrics.scansByDay")}</span>
        <strong>{visiblePoints.length}</strong>
      </div>
      {visiblePoints.length ? (
        <div className="admin-metrics-list">
          {visiblePoints.map((point) => (
            <div className="admin-metrics-row admin-metrics-day-row" key={point.date}>
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
    <section className="admin-metrics-panel">
      <div className="admin-metrics-panel-heading">
        <span>{t("metrics.topDevices")}</span>
        <strong>{devices.length}</strong>
      </div>
      {devices.length ? (
        <div className="admin-metrics-list">
          {devices.map((device) => (
            <Link className="admin-metrics-row admin-metrics-link-row" href={`/admin/devices/${device.deviceId}`} key={device.deviceId}>
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
    <section className="admin-metrics-panel">
      <div className="admin-metrics-panel-heading">
        <span>{t("metrics.topClients")}</span>
        <strong>{clients.length}</strong>
      </div>
      {clients.length ? (
        <div className="admin-metrics-list">
          {clients.map((client) => (
            <Link className="admin-metrics-row admin-metrics-link-row" href={`/admin/clients/${client.businessId}`} key={client.businessId}>
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
