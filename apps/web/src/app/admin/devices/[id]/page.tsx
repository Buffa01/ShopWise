"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { ClientBusiness, listClients } from "../../../../lib/clients";
import {
  Device,
  OperationalStatus,
  ProductionStatus,
  assignAdminDevice,
  getDevice,
  getLatestPrintAssetUrl,
  unassignAdminDevice,
  updateAdminDevice
} from "../../../../lib/devices";
import { getAccessToken } from "../../../../lib/auth";
import { formatDateTime, translateStatus, useI18n } from "../../../../lib/i18n";
import { DeviceMetrics, getAdminDeviceMetrics } from "../../../../lib/metrics";

export default function DeviceDetailPage() {
  return (
    <AdminAuthGate>
      {() => <DeviceDetailContent />}
    </AdminAuthGate>
  );
}

function DeviceDetailContent() {
  const params = useParams<{ id: string }>();
  const { locale, t } = useI18n();
  const [device, setDevice] = useState<Device | null>(null);
  const [clients, setClients] = useState<ClientBusiness[]>([]);
  const [alias, setAlias] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>("CREATED");
  const [operationalStatus, setOperationalStatus] = useState<OperationalStatus>("INACTIVE");
  const [assignBusinessId, setAssignBusinessId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [metrics, setMetrics] = useState<DeviceMetrics | null>(null);

  useEffect(() => {
    Promise.all([getDevice(params.id), listClients(), getAdminDeviceMetrics(params.id)])
      .then(([loadedDevice, loadedClients, loadedMetrics]) => {
        setDevice(loadedDevice);
        setClients(loadedClients);
        setMetrics(loadedMetrics);
        hydrateForm(loadedDevice);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadDeviceError"));
      });
  }, [params.id]);

  function hydrateForm(nextDevice: Device) {
    setAlias(nextDevice.alias ?? "");
    setTargetUrl(nextDevice.targetUrl ?? "");
    setProductionStatus(nextDevice.productionStatus);
    setOperationalStatus(nextDevice.operationalStatus);
    setAssignBusinessId(nextDevice.business?.id ?? "");
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const updated = await updateAdminDevice(params.id, {
        alias,
        targetUrl,
        productionStatus,
        operationalStatus
      });
      setDevice(updated);
      hydrateForm(updated);
      setMessage(t("admin.deviceUpdated"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("admin.updateDeviceError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onAssign() {
    if (!assignBusinessId) return;

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const updated = await assignAdminDevice(params.id, assignBusinessId);
      setDevice(updated);
      hydrateForm(updated);
      setMessage(t("admin.deviceAssigned"));
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : t("admin.assignDeviceError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onUnassign() {
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const updated = await unassignAdminDevice(params.id);
      setDevice(updated);
      hydrateForm(updated);
      setMessage(t("admin.deviceUnassigned"));
    } catch (unassignError) {
      setError(unassignError instanceof Error ? unassignError.message : t("admin.unassignDeviceError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{device?.publicCode ?? t("admin.deviceDetail")}</h1>
        </div>
        <div className="admin-actions">
          <Link href="/admin/devices">{t("common.back")}</Link>
          <Link className="button-secondary" href={`/admin/audit-logs?deviceId=${params.id}`}>
            {t("common.auditLogs")}
          </Link>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {!device && !error ? <p>{t("common.loading")}</p> : null}

      {metrics ? (
        <section className="metric-grid">
          <MetricCard label={t("metrics.totalScans")} value={metrics.totalScans} />
          <MetricCard label={t("metrics.qrScans")} value={metrics.qrScans} />
          <MetricCard label={t("metrics.nfcTaps")} value={metrics.nfcTaps} />
          <MetricCard label={t("metrics.redirects")} value={metrics.redirects} />
        </section>
      ) : null}

      {device ? (
        <section className="detail-grid">
          <div>
            <span>{t("common.type")}</span>
            <strong>{device.deviceType.name}</strong>
          </div>
          <div>
            <span>{t("admin.production")}</span>
            <strong>{translateStatus(t, device.productionStatus)}</strong>
          </div>
          <div>
            <span>{t("admin.assignment")}</span>
            <strong>{device.business?.businessName ?? translateStatus(t, device.assignmentStatus)}</strong>
          </div>
          <div>
            <span>{t("admin.operation")}</span>
            <strong>{translateStatus(t, device.operationalStatus)}</strong>
          </div>
          <div>
            <span>{t("common.qrUrl")}</span>
            <strong>{device.qrUrl}</strong>
          </div>
          <div>
            <span>{t("common.nfcUrl")}</span>
            <strong>{device.nfcUrl}</strong>
          </div>
          <div>
            <span>{t("common.targetUrl")}</span>
            <strong>{device.targetUrl ?? t("common.notSet")}</strong>
          </div>
          <div>
            <span>{t("admin.ownerEmail")}</span>
            <strong>{device.business?.owner?.email ?? t("common.noOwner")}</strong>
          </div>
          <div>
            <span>{t("admin.batch")}</span>
            <strong>{device.batch?.id ?? t("common.singleDevice")}</strong>
          </div>
          <div>
            <span>{t("common.lastScan")}</span>
            <strong>{device.lastScanAt ? formatDateTime(locale, device.lastScanAt) : t("common.noScans")}</strong>
          </div>
          <div>
            <span>{t("admin.qrImage")}</span>
            <strong>{device.qrImageKey ?? t("common.notGenerated")}</strong>
          </div>
          <div>
            <span>{t("admin.printAsset")}</span>
            <strong>{device.printAssets?.[0]?.pdfKey ?? t("common.notGenerated")}</strong>
          </div>
        </section>
      ) : null}

      {device ? (
        <form className="admin-form config-form" onSubmit={onSave}>
          <h2>{t("admin.supportConfiguration")}</h2>
          <label>
            {t("common.alias")}
            <input maxLength={120} onChange={(event) => setAlias(event.target.value)} value={alias} />
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
            {t("admin.productionStatus")}
            <select onChange={(event) => setProductionStatus(event.target.value as ProductionStatus)} value={productionStatus}>
              <option value="CREATED">{t("status.CREATED")}</option>
              <option value="ASSET_GENERATED">{t("status.ASSET_GENERATED")}</option>
              <option value="DOWNLOADED">{t("status.DOWNLOADED")}</option>
              <option value="PRINTED">{t("status.PRINTED")}</option>
              <option value="ERROR">{t("status.ERROR")}</option>
            </select>
          </label>
          <label>
            {t("admin.operationalStatus")}
            <select onChange={(event) => setOperationalStatus(event.target.value as OperationalStatus)} value={operationalStatus}>
              <option value="INACTIVE">{t("status.INACTIVE")}</option>
              <option value="ACTIVE">{t("status.ACTIVE")}</option>
              <option value="PAUSED">{t("status.PAUSED")}</option>
              <option value="DISABLED">{t("status.DISABLED")}</option>
              <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
            </select>
          </label>
          <button disabled={isSaving} type="submit">
            {isSaving ? t("common.saving") : t("admin.saveDevice")}
          </button>
        </form>
      ) : null}

      {device ? (
        <section className="config-form">
          <h2>{t("admin.ownerAssignment")}</h2>
          <div className="admin-form">
            <label>
              {t("common.client")}
              <select onChange={(event) => setAssignBusinessId(event.target.value)} value={assignBusinessId}>
                <option value="">{t("admin.selectClient")}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName} - {client.owner.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-actions">
              <button className="button-link" disabled={isSaving || !assignBusinessId} onClick={onAssign} type="button">
                {t("admin.assignClient")}
              </button>
              <button className="button-secondary" disabled={isSaving || !device.business} onClick={onUnassign} type="button">
                {t("admin.unassign")}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {device?.latestPrintAssetId ? (
        <div className="asset-actions">
          <button
            className="button-link"
            onClick={() => {
              const token = getAccessToken();
              if (!token) return;
              void fetch(getLatestPrintAssetUrl(device.id), {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then((response) => response.blob())
                .then((blob) => {
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${device.publicCode}-sticker.pdf`;
                  link.click();
                  window.URL.revokeObjectURL(url);
                });
            }}
            type="button"
          >
            {t("admin.downloadStickerPdf")}
          </button>
        </div>
      ) : null}

      {device ? (
        <section className="events-section">
          <h2>{t("admin.latestEvents")}</h2>
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
            <p>{t("admin.noEvents")}</p>
          )}
        </section>
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
