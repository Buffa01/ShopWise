"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientAuthGate } from "../../../components/client-auth-gate";
import { ClientDashboardShell } from "../../../components/client-dashboard-shell";
import { AuthUser } from "../../../lib/auth";
import { formatDateTime, useI18n } from "../../../lib/i18n";
import { OverviewMetrics, getClientOverviewMetrics } from "../../../lib/metrics";

export default function ClientMetricsPage() {
  return (
    <ClientAuthGate>
      {(user) => <ClientMetricsContent user={user} />}
    </ClientAuthGate>
  );
}

function ClientMetricsContent({ user }: { user: AuthUser }) {
  const { locale, t } = useI18n();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClientOverviewMetrics()
      .then(setMetrics)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("metrics.loadError"));
      });
  }, []);

  return (
    <ClientDashboardShell
      actions={
        <Link className="client-secondary-action" href="/app">
          {t("common.back")}
        </Link>
      }
      description={t("client.metricsDescription")}
      eyebrow={t("common.metrics")}
      title={t("client.metricsTitle")}
      user={user}
    >
      {error ? <p className="form-error">{error}</p> : null}
      {!metrics && !error ? <p className="client-muted">{t("common.loading")}</p> : null}

      {metrics ? (
        <>
          <section className="metric-grid">
            <MetricCard label={t("metrics.myDevices")} value={metrics.totalDevices} />
            <MetricCard label={t("metrics.activeDevices")} value={metrics.activeDevices} />
            <MetricCard label={t("metrics.totalScans")} value={metrics.totalScans} />
            <MetricCard label={t("metrics.qrScans")} value={metrics.qrScans} />
            <MetricCard label={t("metrics.nfcTaps")} value={metrics.nfcTaps} />
            <MetricCard label={t("metrics.redirects")} value={metrics.redirects} />
          </section>

          <section className="events-section">
            <h2>{t("metrics.topDevices")}</h2>
            {metrics.topDevices.length ? (
              <div className="table-list">
                {metrics.topDevices.map((device) => (
                  <Link className="table-row metrics-row" href={`/app/devices/${device.deviceId}`} key={device.deviceId}>
                    <div>
                      <strong>{device.alias || device.publicCode}</strong>
                      <span>{device.deviceTypeName ?? t("common.device")}</span>
                    </div>
                    <span>{device.scans} {t("metrics.totalScans")}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>{t("metrics.noDeviceScans")}</p>
            )}
          </section>

          <section className="events-section">
            <h2>{t("metrics.scansByDay")}</h2>
            {metrics.scansByDay.some((point) => point.total > 0) ? (
              <div className="table-list">
                {metrics.scansByDay
                  .filter((point) => point.total > 0)
                  .slice(-14)
                  .map((point) => (
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

          <section className="events-section">
            <h2>{t("metrics.latestInteractions")}</h2>
            {metrics.latestEvents?.length ? (
              <div className="table-list">
                {metrics.latestEvents.map((event) => (
                  <div className="table-row events-row" key={event.id}>
                    <div>
                      <strong>{event.eventType}</strong>
                      <span>{event.device?.alias || event.device?.publicCode || event.source}</span>
                    </div>
                    <span>{formatDateTime(locale, event.createdAt)}</span>
                    <span>{event.referrer ?? t("common.noReferrer")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>{t("metrics.noInteractions")}</p>
            )}
          </section>
        </>
      ) : null}
    </ClientDashboardShell>
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
