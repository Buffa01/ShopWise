"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientAuthGate } from "../../../components/client-auth-gate";
import { ClientDashboardShell } from "../../../components/client-dashboard-shell";
import { AuthUser } from "../../../lib/auth";
import { Device, listClientDevices } from "../../../lib/devices";
import { formatDate, translateStatus, useI18n } from "../../../lib/i18n";

export default function ClientDevicesPage() {
  return (
    <ClientAuthGate>
      {(user) => <ClientDevicesContent user={user} />}
    </ClientAuthGate>
  );
}

function ClientDevicesContent({ user }: { user: AuthUser }) {
  const { locale, t } = useI18n();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listClientDevices()
      .then(setDevices)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("client.loadDevicesError"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const activeDevices = devices.filter((device) => device.operationalStatus === "ACTIVE").length;
  const pendingSetupDevices = devices.filter((device) => !device.targetUrl).length;
  const devicesWithActivity = devices.filter((device) => device.lastScanAt).length;

  return (
    <ClientDashboardShell
      actions={
        <Link className="client-primary-action" href="/app/devices/add">
          {t("client.addDevice")}
        </Link>
      }
      description={t("client.devicesDescription")}
      eyebrow={t("common.devices")}
      title={t("client.devicesTitle")}
      user={user}
    >
      {isLoading ? <p className="client-muted">{t("common.loading")}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {devices.length ? (
        <section className="client-devices-overview" aria-label={t("client.devicesSummary")}>
          <DeviceSummaryCard label={t("metrics.totalDevices")} value={devices.length} />
          <DeviceSummaryCard label={t("metrics.activeDevices")} value={activeDevices} />
          <DeviceSummaryCard label={t("client.pendingSetup")} value={pendingSetupDevices} />
          <DeviceSummaryCard label={t("client.withActivity")} value={devicesWithActivity} />
        </section>
      ) : null}

      {!isLoading && !devices.length ? (
        <section className="client-empty-state">
          <div className="client-empty-visual" aria-hidden="true">
            <div className="client-empty-device">QR</div>
            <div className="client-empty-signal">NFC</div>
          </div>
          <div>
            <p className="client-eyebrow">{t("client.noDevicesEyebrow")}</p>
            <h2>{t("client.noDevicesTitle")}</h2>
            <p>{t("client.noDevicesDescription")}</p>
          </div>
          <div className="client-empty-actions">
            <Link className="client-primary-action" href="/app/devices/add">
              {t("client.addDevice")}
            </Link>
            <span>{t("client.addDeviceHint")}</span>
          </div>
        </section>
      ) : null}

      {devices.length ? (
        <div className="client-device-grid">
          {devices.map((device) => (
            <Link className="client-device-card" href={`/app/devices/${device.id}`} key={device.id}>
              <div className="client-device-card-header">
                <div className="client-device-card-icon" aria-hidden="true">
                  {device.publicCode.slice(0, 1)}
                </div>
                <div>
                  <strong>{device.alias || device.publicCode}</strong>
                  <span>{device.deviceType.name}</span>
                </div>
                <DeviceStatusBadge device={device} />
              </div>

              <dl>
                <div>
                  <dt>{t("common.code")}</dt>
                  <dd>{device.publicCode}</dd>
                </div>
                <div>
                  <dt>{t("client.destinationStatus")}</dt>
                  <dd>{device.targetUrl ? t("client.destinationReady") : t("client.destinationMissing")}</dd>
                </div>
                <div>
                  <dt>{t("common.lastScan")}</dt>
                  <dd>{device.lastScanAt ? formatDate(locale, device.lastScanAt) : t("common.noScans")}</dd>
                </div>
              </dl>

              <div className="client-device-card-footer">
                <span>{getDeviceNextStep(device, t)}</span>
                <strong>{device.targetUrl ? t("client.viewConfiguration") : t("client.configureDestinationShort")}</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </ClientDashboardShell>
  );
}

function DeviceSummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="client-device-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DeviceStatusBadge({ device }: { device: Device }) {
  const { t } = useI18n();
  const tone = getDeviceTone(device);

  return (
    <span className={`client-device-status-badge is-${tone}`}>
      {translateStatus(t, device.operationalStatus)}
    </span>
  );
}

function getDeviceTone(device: Device) {
  if (device.operationalStatus === "ACTIVE" && device.targetUrl) return "success";
  if (device.operationalStatus === "PAUSED" || device.operationalStatus === "INACTIVE") return "warning";
  if (!device.targetUrl) return "setup";
  return "neutral";
}

function getDeviceNextStep(device: Device, t: ReturnType<typeof useI18n>["t"]) {
  if (!device.targetUrl) return t("client.needsDestination");
  if (device.operationalStatus === "PAUSED") return t("client.devicePaused");
  if (device.operationalStatus === "ACTIVE") return t("client.readyToUse");
  return t("client.reviewDeviceStatus");
}
