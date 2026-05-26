"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ClientAuthGate } from "../../../../components/client-auth-gate";
import { ClientDashboardShell } from "../../../../components/client-dashboard-shell";
import { AuthUser } from "../../../../lib/auth";
import { Device, getClientDevice, updateClientDevice } from "../../../../lib/devices";
import { formatDateTime, translateStatus, useI18n } from "../../../../lib/i18n";
import { DeviceMetrics, getClientDeviceMetrics } from "../../../../lib/metrics";

type EditableOperationalStatus = "INACTIVE" | "ACTIVE" | "PAUSED";

export default function ClientDeviceDetailPage() {
  return (
    <ClientAuthGate>
      {(user) => <ClientDeviceDetailContent user={user} />}
    </ClientAuthGate>
  );
}

function ClientDeviceDetailContent({ user }: { user: AuthUser }) {
  const params = useParams<{ id: string }>();
  const { locale, t } = useI18n();
  const [device, setDevice] = useState<Device | null>(null);
  const [alias, setAlias] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [operationalStatus, setOperationalStatus] = useState<EditableOperationalStatus>("INACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [metrics, setMetrics] = useState<DeviceMetrics | null>(null);

  useEffect(() => {
    Promise.all([getClientDevice(params.id), getClientDeviceMetrics(params.id)])
      .then(([loadedDevice, loadedMetrics]) => {
        setDevice(loadedDevice);
        setMetrics(loadedMetrics);
        setAlias(loadedDevice.alias ?? "");
        setTargetUrl(loadedDevice.targetUrl ?? "");
        setOperationalStatus(toEditableStatus(loadedDevice.operationalStatus));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("client.loadDeviceError"));
      });
  }, [params.id, t]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const updatedDevice = await updateClientDevice(params.id, {
        alias,
        targetUrl,
        operationalStatus
      });
      setDevice(updatedDevice);
      setAlias(updatedDevice.alias ?? "");
      setTargetUrl(updatedDevice.targetUrl ?? "");
      setOperationalStatus(toEditableStatus(updatedDevice.operationalStatus));
      setMessage(t("client.deviceUpdated"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("client.updateDeviceError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ClientDashboardShell
      actions={
        <Link className="client-secondary-action" href="/app/devices">
          {t("common.back")}
        </Link>
      }
      description={t("client.deviceDetailDescription")}
      eyebrow={t("client.deviceDetail")}
      title={device?.alias || device?.publicCode || t("client.deviceDetail")}
      user={user}
    >
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {!device && !error ? <p className="client-muted">{t("common.loading")}</p> : null}

      {device ? (
        <>
          <section className="client-device-detail-hero">
            <div className="client-device-identity">
              <div className="client-device-badge" aria-hidden="true">
                {device.deviceType.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="client-eyebrow">{device.deviceType.name}</p>
                <h2>{device.alias || device.publicCode}</h2>
                <span>{t("common.code")} {device.publicCode}</span>
              </div>
            </div>

            <div className="client-device-state-grid">
              <DeviceStateCard
                label={t("common.status")}
                tone={device.operationalStatus === "ACTIVE" ? "success" : device.operationalStatus === "PAUSED" ? "warning" : "neutral"}
                value={translateStatus(t, device.operationalStatus)}
              />
              <DeviceStateCard
                label={t("client.destinationStatus")}
                tone={device.targetUrl ? "success" : "warning"}
                value={device.targetUrl ? t("client.destinationReady") : t("client.destinationMissing")}
              />
              <DeviceStateCard
                label={t("common.lastScan")}
                tone={device.lastScanAt ? "success" : "neutral"}
                value={device.lastScanAt ? formatDateTime(locale, device.lastScanAt) : t("common.noScans")}
              />
            </div>
          </section>

          {metrics ? (
            <section className="client-device-metrics-panel">
              <div className="client-section-heading">
                <div>
                  <p className="client-eyebrow">{t("common.metrics")}</p>
                  <h2>{t("client.performanceTitle")}</h2>
                </div>
                <span>{t("client.last30Days")}</span>
              </div>

              <div className="metric-grid">
                <MetricCard label={t("metrics.totalScans")} value={metrics.totalScans} />
                <MetricCard label={t("metrics.qrScans")} value={metrics.qrScans} />
                <MetricCard label={t("metrics.nfcTaps")} value={metrics.nfcTaps} />
                <MetricCard label={t("metrics.redirects")} value={metrics.redirects} />
              </div>

              <ActivityBars emptyLabel={t("metrics.noScans30")} points={metrics.scansByDay.slice(-14)} />
            </section>
          ) : null}

          <section className="client-device-workspace">
            <div className="client-config-card">
              <div className="client-section-heading">
                <div>
                  <p className="client-eyebrow">{t("client.configuration")}</p>
                  <h2>{t("client.configureDestination")}</h2>
                </div>
              </div>
              <p>{t("client.configureDestinationDescription")}</p>

              <form className="admin-form config-form" onSubmit={onSubmit}>
                <label>
                  {t("common.alias")}
                  <input
                    maxLength={120}
                    onChange={(event) => setAlias(event.target.value)}
                    placeholder={t("client.aliasPlaceholder")}
                    value={alias}
                  />
                </label>

                <label>
                  {t("common.targetUrl")}
                  <input
                    maxLength={2000}
                    onChange={(event) => setTargetUrl(event.target.value)}
                    placeholder="https://g.page/r/..."
                    type="url"
                    value={targetUrl}
                  />
                </label>

                <label>
                  {t("common.deviceStatus")}
                  <select
                    onChange={(event) => setOperationalStatus(event.target.value as EditableOperationalStatus)}
                    value={operationalStatus}
                  >
                    <option value="ACTIVE">{t("status.ACTIVE")}</option>
                    <option value="PAUSED">{t("status.PAUSED")}</option>
                    <option value="INACTIVE">{t("status.INACTIVE")}</option>
                  </select>
                </label>

                <button disabled={isSaving} type="submit">
                  {isSaving ? t("common.saving") : t("client.saveConfiguration")}
                </button>
              </form>
            </div>

            <div className="client-device-side-panel">
              <div className="client-side-panel-block">
                <p className="client-eyebrow">{t("client.currentSetup")}</p>
                <dl>
                  <div>
                    <dt>{t("common.type")}</dt>
                    <dd>{device.deviceType.name}</dd>
                  </div>
                  <div>
                    <dt>{t("common.status")}</dt>
                    <dd>{translateStatus(t, device.operationalStatus)}</dd>
                  </div>
                  <div>
                    <dt>{t("common.targetUrl")}</dt>
                    <dd>{device.targetUrl ? t("common.configured") : t("common.noTarget")}</dd>
                  </div>
                </dl>
              </div>

              <div className="client-side-panel-block">
                <p className="client-eyebrow">{t("client.nextStep")}</p>
                <h3>{device.targetUrl ? t("client.readyToUse") : t("client.configureBeforeUse")}</h3>
                <p>{device.targetUrl ? t("client.readyToUseDescription") : t("client.configureBeforeUseDescription")}</p>
              </div>
            </div>
          </section>

          <section className="events-section">
            <div className="client-section-heading">
              <div>
                <p className="client-eyebrow">{t("client.activity")}</p>
                <h2>{t("metrics.latestInteractions")}</h2>
              </div>
            </div>
            {device.events?.length ? (
              <div className="table-list">
                {device.events.map((event) => (
                  <div className="table-row events-row" key={event.id}>
                    <div>
                      <strong>{event.eventType}</strong>
                      <span>{event.source}</span>
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

function DeviceStateCard({
  label,
  tone,
  value
}: {
  label: string;
  tone: "neutral" | "success" | "warning";
  value: string;
}) {
  return (
    <div className={`client-device-state-card is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function ActivityBars({ emptyLabel, points }: { emptyLabel: string; points: { date: string; total: number }[] }) {
  const maxValue = Math.max(...points.map((point) => point.total), 1);
  const hasActivity = points.some((point) => point.total > 0);

  return (
    <div className="client-activity-bars" aria-hidden="true">
      {hasActivity ? (
        points.map((point) => (
          <span key={point.date} style={{ height: `${Math.max(8, (point.total / maxValue) * 100)}%` }} />
        ))
      ) : (
        <p>{emptyLabel}</p>
      )}
    </div>
  );
}

function toEditableStatus(status: Device["operationalStatus"]): EditableOperationalStatus {
  if (status === "ACTIVE" || status === "PAUSED") {
    return status;
  }

  return "INACTIVE";
}
