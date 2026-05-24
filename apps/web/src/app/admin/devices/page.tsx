"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { AssignmentStatus, Device, OperationalStatus, ProductionStatus, listDevices } from "../../../lib/devices";
import { translateStatus, useI18n } from "../../../lib/i18n";

export default function DevicesPage() {
  return (
    <AdminAuthGate>
      {() => <DevicesContent />}
    </AdminAuthGate>
  );
}

function DevicesContent() {
  const { t } = useI18n();
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("");
  const [operationalStatus, setOperationalStatus] = useState("");
  const [productionStatus, setProductionStatus] = useState("");

  function loadDevices() {
    setIsLoading(true);
    listDevices({
      q,
      assignmentStatus: assignmentStatus as AssignmentStatus | undefined,
      operationalStatus: operationalStatus as OperationalStatus | undefined,
      productionStatus: productionStatus as ProductionStatus | undefined
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

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.devicesTitle")}</h1>
        </div>
        <div className="admin-actions">
          <Link className="button-link" href="/admin/devices/new">
            {t("admin.newDevice")}
          </Link>
          <Link className="button-link" href="/admin/devices/batch">
            {t("admin.newBatch")}
          </Link>
        </div>
      </div>

      {isLoading ? <p>{t("common.loading")}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <form className="admin-form filter-form" onSubmit={onFilter}>
        <label>
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
        <button type="submit">{t("admin.applyFilters")}</button>
      </form>

      <div className="table-list">
        {devices.map((device) => (
          <Link className="table-row devices-row" href={`/admin/devices/${device.id}`} key={device.id}>
            <div>
              <strong>{device.publicCode}</strong>
              <span>{device.alias || device.deviceType.name}</span>
            </div>
            <span>{translateStatus(t, device.assignmentStatus)}</span>
            <span>{translateStatus(t, device.operationalStatus)}</span>
            <span>{device.business?.businessName ?? t("common.noClient")}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
