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

      {!isLoading && !devices.length ? (
        <section className="client-empty-state">
          <div className="client-empty-icon">+</div>
          <p className="client-eyebrow">{t("client.noDevicesEyebrow")}</p>
          <h2>{t("client.noDevicesTitle")}</h2>
          <p>{t("client.noDevicesDescription")}</p>
          <Link className="client-primary-action" href="/app/devices/add">
            {t("client.addDevice")}
          </Link>
        </section>
      ) : null}

      {devices.length ? (
        <div className="client-device-grid">
          {devices.map((device) => (
            <Link className="client-device-card" href={`/app/devices/${device.id}`} key={device.id}>
              <div>
                <strong>{device.alias || device.publicCode}</strong>
                <span>{device.deviceType.name}</span>
              </div>
              <dl>
                <div>
                  <dt>{t("common.status")}</dt>
                  <dd>{translateStatus(t, device.operationalStatus)}</dd>
                </div>
                <div>
                  <dt>{t("common.targetUrl")}</dt>
                  <dd>{device.targetUrl ? t("common.configured") : t("common.noTarget")}</dd>
                </div>
                <div>
                  <dt>{t("common.lastScan")}</dt>
                  <dd>{device.lastScanAt ? formatDate(locale, device.lastScanAt) : t("common.noScans")}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : null}
    </ClientDashboardShell>
  );
}
