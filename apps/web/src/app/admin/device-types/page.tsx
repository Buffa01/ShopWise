"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { DeviceType, listDeviceTypes } from "../../../lib/device-types";
import { useI18n } from "../../../lib/i18n";

export default function DeviceTypesPage() {
  return (
    <AdminAuthGate>
      {() => <DeviceTypesContent />}
    </AdminAuthGate>
  );
}

function DeviceTypesContent() {
  const { t } = useI18n();
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listDeviceTypes()
      .then(setDeviceTypes)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadDeviceTypesError"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const summary = {
    total: deviceTypes.length,
    active: deviceTypes.filter((deviceType) => deviceType.isActive).length,
    withDesign: deviceTypes.filter((deviceType) => Boolean(deviceType.baseDesignKey)).length,
    withDevices: deviceTypes.filter((deviceType) => (deviceType._count?.devices ?? 0) > 0).length
  };

  const filteredDeviceTypes = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return deviceTypes;

    return deviceTypes.filter((deviceType) =>
      [deviceType.name, deviceType.slug, deviceType.description, deviceType.defaultPrefix, deviceType.templateKey]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized))
    );
  }, [deviceTypes, query]);

  return (
    <main className="dashboard-shell admin-device-types-page">
      <section className="admin-device-types-hero">
        <div>
          <p className="eyebrow">{t("admin.templatesAndPrint")}</p>
          <h1>{t("admin.deviceTypesTitle")}</h1>
          <p>{t("admin.deviceTypesDescription")}</p>
        </div>
        <div className="admin-device-types-actions">
          <Link className="admin-primary-action" href="/admin/device-types/new">
            {t("admin.newType")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/production">
            {t("admin.production")}
          </Link>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-device-types-summary" aria-label={t("admin.deviceTypesSummary")}>
        <DeviceTypeStat label={t("admin.totalTypes")} value={summary.total} />
        <DeviceTypeStat label={t("admin.activeTypes")} value={summary.active} />
        <DeviceTypeStat label={t("admin.withPrintDesign")} value={summary.withDesign} />
        <DeviceTypeStat label={t("admin.usedByDevices")} value={summary.withDevices} />
      </section>

      <section className="admin-device-types-panel">
        <div className="admin-device-types-panel-heading">
          <div>
            <span>{t("admin.templateLibrary")}</span>
            <strong>{isLoading ? t("common.loading") : `${filteredDeviceTypes.length} ${t("admin.deviceTypes").toLowerCase()}`}</strong>
          </div>
          <p>{t("admin.templateLibraryDescription")}</p>
        </div>

        <label className="admin-device-types-search">
          {t("common.search")}
          <input onChange={(event) => setQuery(event.target.value)} placeholder={t("admin.deviceTypesSearchPlaceholder")} value={query} />
        </label>

        <div className="admin-device-types-list">
          {filteredDeviceTypes.map((deviceType) => (
            <Link className="admin-device-type-card" href={`/admin/device-types/${deviceType.id}`} key={deviceType.id}>
              <div className="admin-device-type-card-main">
                <span>{deviceType.slug}</span>
                <strong>{deviceType.name}</strong>
                <p>{deviceType.description ?? t("admin.noDeviceTypeDescription")}</p>
              </div>
              <div className="admin-device-type-badges">
                <span className={`admin-status-badge ${deviceType.isActive ? "is-success" : "is-neutral"}`}>
                  {deviceType.isActive ? t("status.ACTIVE") : t("status.INACTIVE")}
                </span>
                <span className={`admin-status-badge ${deviceType.baseDesignKey ? "is-success" : "is-warning"}`}>
                  {deviceType.baseDesignKey ? t("admin.designReady") : t("admin.designMissing")}
                </span>
                <span className="admin-status-badge is-neutral">
                  {deviceType._count?.devices ?? 0} {t("common.devices").toLowerCase()}
                </span>
              </div>
              <div className="admin-device-type-card-meta">
                <div>
                  <span>{t("admin.defaultPrefix")}</span>
                  <strong>{deviceType.defaultPrefix ?? t("admin.noPrefix")}</strong>
                </div>
                <div>
                  <span>{t("admin.templateKey")}</span>
                  <strong>{deviceType.templateKey ?? t("common.notSet")}</strong>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && !filteredDeviceTypes.length ? (
          <div className="admin-device-types-empty">
            <div>
              <strong>{t("admin.noDeviceTypesTitle")}</strong>
              <p>{t("admin.noDeviceTypesDescription")}</p>
            </div>
            <Link className="admin-primary-action" href="/admin/device-types/new">
              {t("admin.newType")}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function DeviceTypeStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-device-types-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
