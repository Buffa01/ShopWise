"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientAuthGate } from "../../../components/client-auth-gate";
import { Device, listClientDevices } from "../../../lib/devices";
import { formatDate, translateStatus, useI18n } from "../../../lib/i18n";

export default function ClientDevicesPage() {
  return (
    <ClientAuthGate>
      {() => <ClientDevicesContent />}
    </ClientAuthGate>
  );
}

function ClientDevicesContent() {
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
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.client")}</p>
          <h1>{t("client.devicesTitle")}</h1>
        </div>
        <div className="admin-actions">
          <Link href="/app">{t("common.back")}</Link>
          <Link className="button-link" href="/app/devices/add">
            {t("client.addDevice")}
          </Link>
        </div>
      </div>

      {isLoading ? <p>{t("common.loading")}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!isLoading && !devices.length ? <p>{t("client.noDevices")}</p> : null}

      <div className="table-list">
        {devices.map((device) => (
          <Link className="table-row devices-row" href={`/app/devices/${device.id}`} key={device.id}>
            <div>
              <strong>{device.alias || device.publicCode}</strong>
              <span>{device.deviceType.name}</span>
            </div>
            <span>{translateStatus(t, device.operationalStatus)}</span>
            <span>{device.targetUrl ? t("common.configured") : t("common.noTarget")}</span>
            <span>{device.lastScanAt ? formatDate(locale, device.lastScanAt) : t("common.noScans")}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
