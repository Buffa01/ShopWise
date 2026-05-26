"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { AssignmentStatus, Device, OperationalStatus, ProductionStatus, listDevices } from "../../../lib/devices";
import { formatDateTime, translateStatus, useI18n } from "../../../lib/i18n";

export default function DevicesPage() {
  return (
    <AdminAuthGate>
      {() => <DevicesContent />}
    </AdminAuthGate>
  );
}

function DevicesContent() {
  const { locale, t } = useI18n();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [operationalStatus, setOperationalStatus] = useState("");
  const [productionStatus, setProductionStatus] = useState("");

  function loadDevices(query = {
    q,
    assignmentStatus,
    operationalStatus,
    productionStatus
  }) {
    setIsLoading(true);
    listDevices({
      q: query.q,
      assignmentStatus: query.assignmentStatus as AssignmentStatus | undefined,
      operationalStatus: query.operationalStatus as OperationalStatus | undefined,
      productionStatus: query.productionStatus as ProductionStatus | undefined
    })
      .then(setDevices)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadDevicesError"));
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadDevices();
  }

  function clearFilters() {
    setQ("");
    setAssignmentStatus("");
    setOperationalStatus("");
    setProductionStatus("");
    loadDevices({ q: "", assignmentStatus: "", operationalStatus: "", productionStatus: "" });
  }

  const summary = {
    total: devices.length,
    active: devices.filter((device) => device.operationalStatus === "ACTIVE").length,
    unassigned: devices.filter((device) => device.assignmentStatus === "UNASSIGNED").length,
    pendingPrint: devices.filter((device) => ["CREATED", "ASSET_GENERATED"].includes(device.productionStatus)).length
  };

  return (
    <main className="dashboard-shell admin-devices-page">
      <section className="admin-devices-hero">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.devicesTitle")}</h1>
          <p>{t("admin.devicesDescription")}</p>
        </div>
        <div className="admin-devices-actions">
          <Link className="admin-primary-action" href="/admin/devices/new">
            {t("admin.newDevice")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/devices/batch">
            {t("admin.newBatch")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/device-types">
            {t("admin.deviceTypes")}
          </Link>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-devices-summary" aria-label={t("admin.devicesSummary")}>
        <AdminDevicesStat label={t("metrics.totalDevices")} value={summary.total} />
        <AdminDevicesStat label={t("metrics.activeDevices")} value={summary.active} />
        <AdminDevicesStat label={t("metrics.unassigned")} value={summary.unassigned} />
        <AdminDevicesStat label={t("admin.pendingPrint")} value={summary.pendingPrint} />
      </section>

      <section className="admin-devices-panel">
        <div className="admin-devices-panel-heading">
          <div>
            <span>{t("admin.inventory")}</span>
            <strong>{isLoading ? t("common.loading") : `${devices.length} ${t("common.devices").toLowerCase()}`}</strong>
          </div>
          <p>{t("admin.devicesInventoryDescription")}</p>
        </div>

        <form className="admin-devices-filter-form" onSubmit={onFilter}>
          <label className="admin-devices-search">
            {t("common.search")}
            <input onChange={(event) => setQ(event.target.value)} placeholder={t("admin.searchPlaceholder")} value={q} />
          </label>
          <label>
            {t("admin.assignment")}
            <select onChange={(event) => setAssignmentStatus(event.target.value)} value={assignmentStatus}>
              <option value="">{t("common.all")}</option>
              <option value="UNASSIGNED">{t("status.UNASSIGNED")}</option>
              <option value="ASSIGNED">{t("status.ASSIGNED")}</option>
            </select>
          </label>
          <label>
            {t("admin.operation")}
            <select onChange={(event) => setOperationalStatus(event.target.value)} value={operationalStatus}>
              <option value="">{t("common.all")}</option>
              <option value="INACTIVE">{t("status.INACTIVE")}</option>
              <option value="ACTIVE">{t("status.ACTIVE")}</option>
              <option value="PAUSED">{t("status.PAUSED")}</option>
              <option value="DISABLED">{t("status.DISABLED")}</option>
              <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
            </select>
          </label>
          <label>
            {t("admin.production")}
            <select onChange={(event) => setProductionStatus(event.target.value)} value={productionStatus}>
              <option value="">{t("common.all")}</option>
              <option value="CREATED">{t("status.CREATED")}</option>
              <option value="ASSET_GENERATED">{t("status.ASSET_GENERATED")}</option>
              <option value="DOWNLOADED">{t("status.DOWNLOADED")}</option>
              <option value="PRINTED">{t("status.PRINTED")}</option>
              <option value="ERROR">{t("status.ERROR")}</option>
            </select>
          </label>
          <div className="admin-devices-filter-actions">
            <button type="submit">{t("admin.applyFilters")}</button>
            <button onClick={clearFilters} type="button">
              {t("admin.clearFilters")}
            </button>
          </div>
        </form>

        <div className="admin-devices-list">
          {devices.map((device) => (
            <Link className="admin-device-row" href={`/admin/devices/${device.id}`} key={device.id}>
              <div className="admin-device-row-main">
                <div className="admin-device-code">
                  <span>{device.deviceType.name}</span>
                  <strong>{device.publicCode}</strong>
                </div>
                <div className="admin-device-meta">
                  <span>{device.alias || t("common.noName")}</span>
                  <span>{device.business?.businessName ?? t("common.noClient")}</span>
                </div>
              </div>

              <div className="admin-device-statuses">
                <AdminStatusBadge label={translateStatus(t, device.assignmentStatus)} tone={device.assignmentStatus === "ASSIGNED" ? "success" : "warning"} />
                <AdminStatusBadge label={translateStatus(t, device.operationalStatus)} tone={getOperationalTone(device.operationalStatus)} />
                <AdminStatusBadge label={translateStatus(t, device.productionStatus)} tone={getProductionTone(device.productionStatus)} />
              </div>

              <div className="admin-device-row-side">
                <span>{t("common.lastScan")}</span>
                <strong>{device.lastScanAt ? formatDateTime(locale, device.lastScanAt) : t("common.noScans")}</strong>
              </div>
            </Link>
          ))}
        </div>

        {!isLoading && !devices.length ? (
          <div className="admin-devices-empty">
            <strong>{t("admin.noDevicesTitle")}</strong>
            <p>{t("admin.noDevicesDescription")}</p>
            <Link className="admin-primary-action" href="/admin/devices/new">
              {t("admin.newDevice")}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function AdminDevicesStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-devices-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminStatusBadge({ label, tone }: { label: string; tone: "danger" | "neutral" | "success" | "warning" }) {
  return <span className={`admin-status-badge is-${tone}`}>{label}</span>;
}

function getOperationalTone(status: OperationalStatus): "danger" | "neutral" | "success" | "warning" {
  if (status === "ACTIVE") return "success";
  if (status === "PAUSED" || status === "INACTIVE") return "warning";
  if (status === "DISABLED" || status === "ARCHIVED") return "danger";
  return "neutral";
}

function getProductionTone(status: ProductionStatus): "danger" | "neutral" | "success" | "warning" {
  if (status === "PRINTED" || status === "DOWNLOADED") return "success";
  if (status === "ERROR") return "danger";
  if (status === "CREATED" || status === "ASSET_GENERATED") return "warning";
  return "neutral";
}
