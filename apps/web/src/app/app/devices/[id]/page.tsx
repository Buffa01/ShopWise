"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ClientAuthGate } from "../../../../components/client-auth-gate";
import { Device, getClientDevice, updateClientDevice } from "../../../../lib/devices";
import { formatDateTime, translateStatus, useI18n } from "../../../../lib/i18n";
import { DeviceMetrics, getClientDeviceMetrics } from "../../../../lib/metrics";

type EditableOperationalStatus = "INACTIVE" | "ACTIVE" | "PAUSED";

export default function ClientDeviceDetailPage() {
  return (
    <ClientAuthGate>
      {() => <ClientDeviceDetailContent />}
    </ClientAuthGate>
  );
}

function ClientDeviceDetailContent() {
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
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.client")}</p>
          <h1>{device?.alias || device?.publicCode || t("client.deviceDetail")}</h1>
        </div>
        <Link href="/app/devices">{t("common.back")}</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {!device && !error ? <p>{t("common.loading")}</p> : null}

      {device ? (
        <>
          {metrics ? (
            <section className="metric-grid">
              <MetricCard label={t("metrics.totalScans")} value={metrics.totalScans} />
              <MetricCard label={t("metrics.qrScans")} value={metrics.qrScans} />
              <MetricCard label={t("metrics.nfcTaps")} value={metrics.nfcTaps} />
              <MetricCard label={t("metrics.redirects")} value={metrics.redirects} />
            </section>
          ) : null}

          <section className="detail-grid">
            <div>
              <span>{t("common.code")}</span>
              <strong>{device.publicCode}</strong>
            </div>
            <div>
              <span>{t("common.type")}</span>
              <strong>{device.deviceType.name}</strong>
            </div>
            <div>
              <span>{t("common.status")}</span>
              <strong>{translateStatus(t, device.operationalStatus)}</strong>
            </div>
            <div>
              <span>{t("common.lastScan")}</span>
              <strong>{device.lastScanAt ? formatDateTime(locale, device.lastScanAt) : t("common.noScans")}</strong>
            </div>
            <div>
              <span>{t("common.qrUrl")}</span>
              <strong>{device.qrUrl}</strong>
            </div>
            <div>
              <span>{t("common.nfcUrl")}</span>
              <strong>{device.nfcUrl}</strong>
            </div>
          </section>

          <form className="admin-form config-form" onSubmit={onSubmit}>
            <label>
              {t("common.alias")}
              <input
                maxLength={120}
                onChange={(event) => setAlias(event.target.value)}
                placeholder="Front counter"
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

          <section className="events-section">
            <h2>{t("metrics.latestInteractions")}</h2>
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

function toEditableStatus(status: Device["operationalStatus"]): EditableOperationalStatus {
  if (status === "ACTIVE" || status === "PAUSED") {
    return status;
  }

  return "INACTIVE";
}
