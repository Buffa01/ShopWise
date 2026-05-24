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
        setError(loadError instanceof Error ? loadError.message : "Could not load device");
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
      setMessage("Device updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update device");
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
      setMessage("Device assigned.");
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Could not assign device");
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
      setMessage("Device unassigned and configuration cleared.");
    } catch (unassignError) {
      setError(unassignError instanceof Error ? unassignError.message : "Could not unassign device");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>{device?.publicCode ?? "Device detail"}</h1>
        </div>
        <div className="admin-actions">
          <Link href="/admin/devices">Back</Link>
          <Link className="button-secondary" href={`/admin/audit-logs?deviceId=${params.id}`}>
            Audit logs
          </Link>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {!device && !error ? <p>Loading...</p> : null}

      {metrics ? (
        <section className="metric-grid">
          <MetricCard label="Total scans" value={metrics.totalScans} />
          <MetricCard label="QR scans" value={metrics.qrScans} />
          <MetricCard label="NFC taps" value={metrics.nfcTaps} />
          <MetricCard label="Redirects" value={metrics.redirects} />
        </section>
      ) : null}

      {device ? (
        <section className="detail-grid">
          <div>
            <span>Type</span>
            <strong>{device.deviceType.name}</strong>
          </div>
          <div>
            <span>Production</span>
            <strong>{device.productionStatus}</strong>
          </div>
          <div>
            <span>Assignment</span>
            <strong>{device.business?.businessName ?? device.assignmentStatus}</strong>
          </div>
          <div>
            <span>Operation</span>
            <strong>{device.operationalStatus}</strong>
          </div>
          <div>
            <span>QR URL</span>
            <strong>{device.qrUrl}</strong>
          </div>
          <div>
            <span>NFC URL</span>
            <strong>{device.nfcUrl}</strong>
          </div>
          <div>
            <span>Target URL</span>
            <strong>{device.targetUrl ?? "Not configured"}</strong>
          </div>
          <div>
            <span>Owner email</span>
            <strong>{device.business?.owner?.email ?? "No owner"}</strong>
          </div>
          <div>
            <span>Batch</span>
            <strong>{device.batch?.id ?? "Single device"}</strong>
          </div>
          <div>
            <span>Last scan</span>
            <strong>{device.lastScanAt ? new Date(device.lastScanAt).toLocaleString() : "No scans yet"}</strong>
          </div>
          <div>
            <span>QR image</span>
            <strong>{device.qrImageKey ?? "Not generated"}</strong>
          </div>
          <div>
            <span>Print asset</span>
            <strong>{device.printAssets?.[0]?.pdfKey ?? "Not generated"}</strong>
          </div>
        </section>
      ) : null}

      {device ? (
        <form className="admin-form config-form" onSubmit={onSave}>
          <h2>Support configuration</h2>
          <label>
            Alias
            <input maxLength={120} onChange={(event) => setAlias(event.target.value)} value={alias} />
          </label>
          <label>
            Target URL
            <input
              maxLength={2000}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder="https://g.page/r/..."
              type="url"
              value={targetUrl}
            />
          </label>
          <label>
            Production status
            <select onChange={(event) => setProductionStatus(event.target.value as ProductionStatus)} value={productionStatus}>
              <option value="CREATED">Created</option>
              <option value="ASSET_GENERATED">Asset generated</option>
              <option value="DOWNLOADED">Downloaded</option>
              <option value="PRINTED">Printed</option>
              <option value="ERROR">Error</option>
            </select>
          </label>
          <label>
            Operational status
            <select onChange={(event) => setOperationalStatus(event.target.value as OperationalStatus)} value={operationalStatus}>
              <option value="INACTIVE">Inactive</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DISABLED">Disabled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <button disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Save device"}
          </button>
        </form>
      ) : null}

      {device ? (
        <section className="config-form">
          <h2>Owner assignment</h2>
          <div className="admin-form">
            <label>
              Client
              <select onChange={(event) => setAssignBusinessId(event.target.value)} value={assignBusinessId}>
                <option value="">Select client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.businessName} - {client.owner.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-actions">
              <button className="button-link" disabled={isSaving || !assignBusinessId} onClick={onAssign} type="button">
                Assign client
              </button>
              <button className="button-secondary" disabled={isSaving || !device.business} onClick={onUnassign} type="button">
                Unassign
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
            Download sticker PDF
          </button>
        </div>
      ) : null}

      {device ? (
        <section className="events-section">
          <h2>Latest events</h2>
          {device.events?.length ? (
            <div className="table-list">
              {device.events.map((event) => (
                <div className="table-row events-row" key={event.id}>
                  <div>
                    <strong>{event.eventType}</strong>
                    <span>{event.source}</span>
                  </div>
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                  <span>{event.referrer ?? "No referrer"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No events yet.</p>
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
