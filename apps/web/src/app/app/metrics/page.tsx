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

      {metrics ? <ClientMetricsDashboard metrics={metrics} /> : null}
    </ClientDashboardShell>
  );
}

function ClientMetricsDashboard({ metrics }: { metrics: OverviewMetrics }) {
  const { locale, t } = useI18n();
  const last14Days = metrics.scansByDay.slice(-14);
  const maxDailyTotal = Math.max(...last14Days.map((point) => point.total), 1);
  const hasScans = metrics.scansByDay.some((point) => point.total > 0);
  const latestEvents = metrics.latestEvents ?? [];
  const interactionTotal = metrics.totalScans + metrics.redirects;

  return (
    <>
      <section className="client-metrics-hero">
        <div>
          <p className="client-eyebrow">{t("metrics.last30Days")}</p>
          <h2>{interactionTotal}</h2>
          <p>{t("metrics.interactionsDescription")}</p>
        </div>
        <div className="client-metrics-hero-stats">
          <MetricCard label={t("metrics.totalScans")} value={metrics.totalScans} />
          <MetricCard label={t("metrics.redirects")} value={metrics.redirects} />
        </div>
      </section>

      <section className="client-metrics-summary">
        <MetricCard label={t("metrics.myDevices")} value={metrics.totalDevices} />
        <MetricCard label={t("metrics.activeDevices")} value={metrics.activeDevices} />
        <MetricCard label={t("metrics.qrScans")} value={metrics.qrScans} />
        <MetricCard label={t("metrics.nfcTaps")} value={metrics.nfcTaps} />
      </section>

      <section className="client-metrics-panel">
        <div className="client-section-heading">
          <div>
            <p className="client-eyebrow">{t("metrics.activity")}</p>
            <h2>{t("metrics.scansByDay")}</h2>
          </div>
          <span>{t("metrics.last14Days")}</span>
        </div>

        {hasScans ? (
          <div className="client-metrics-chart" aria-label={t("metrics.scansByDay")}>
            {last14Days.map((point) => (
              <div className="client-metrics-bar" key={point.date}>
                <span style={{ height: `${Math.max((point.total / maxDailyTotal) * 100, point.total > 0 ? 8 : 0)}%` }} />
                <small>{formatShortDay(locale, point.date)}</small>
                <strong>{point.total}</strong>
              </div>
            ))}
          </div>
        ) : (
          <MetricsEmptyState title={t("metrics.noScansTitle")} body={t("metrics.noScans30")} />
        )}
      </section>

      <section className="client-metrics-split">
        <div className="client-metrics-panel">
          <div className="client-section-heading">
            <div>
              <p className="client-eyebrow">{t("metrics.ranking")}</p>
              <h2>{t("metrics.topDevices")}</h2>
            </div>
          </div>

          {metrics.topDevices.length ? (
            <div className="client-top-device-list">
              {metrics.topDevices.map((device, index) => (
                <Link
                  className="client-top-device-row"
                  href={device.deviceId ? `/app/devices/${device.deviceId}` : "/app/devices"}
                  key={device.deviceId ?? device.publicCode}
                >
                  <span>{index + 1}</span>
                  <div>
                    <strong>{device.alias || device.publicCode}</strong>
                    <small>{device.deviceTypeName ?? t("common.device")}</small>
                  </div>
                  <b>{device.scans}</b>
                </Link>
              ))}
            </div>
          ) : (
            <MetricsEmptyState title={t("metrics.noDeviceScansTitle")} body={t("metrics.noDeviceScans")} />
          )}
        </div>

        <div className="client-metrics-panel">
          <div className="client-section-heading">
            <div>
              <p className="client-eyebrow">{t("metrics.liveActivity")}</p>
              <h2>{t("metrics.latestInteractions")}</h2>
            </div>
          </div>

          {latestEvents.length ? (
            <div className="client-interaction-list">
              {latestEvents.map((event) => (
                <div className="client-interaction-row" key={event.id}>
                  <span>{getEventShortLabel(event.eventType, event.source)}</span>
                  <div>
                    <strong>{getEventLabel(event.eventType, t)}</strong>
                    <small>{event.device?.alias || event.device?.publicCode || t("common.device")}</small>
                  </div>
                  <time>{formatDateTime(locale, event.createdAt)}</time>
                </div>
              ))}
            </div>
          ) : (
            <MetricsEmptyState title={t("metrics.noInteractionsTitle")} body={t("metrics.noInteractions")} />
          )}
        </div>
      </section>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="client-metrics-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricsEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="client-metrics-empty">
      <span>0</span>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function formatShortDay(locale: string, date: string) {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00Z`));
}

function getEventShortLabel(eventType: string, source: string) {
  if (eventType === "QR_SCAN") return "QR";
  if (eventType === "NFC_TAP") return "NFC";
  if (eventType === "REDIRECT") return "GO";
  return source.slice(0, 3);
}

function getEventLabel(eventType: string, t: ReturnType<typeof useI18n>["t"]) {
  if (eventType === "QR_SCAN") return t("metrics.eventQrScan");
  if (eventType === "NFC_TAP") return t("metrics.eventNfcTap");
  if (eventType === "REDIRECT") return t("metrics.eventRedirect");
  if (eventType === "CLAIM") return t("metrics.eventClaim");
  if (eventType === "CONFIG_UPDATE") return t("metrics.eventConfigUpdate");
  return eventType.replaceAll("_", " ");
}
