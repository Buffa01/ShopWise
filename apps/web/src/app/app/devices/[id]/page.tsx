"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ClientAuthGate } from "../../../../components/client-auth-gate";
import { Device, getClientDevice, updateClientDevice } from "../../../../lib/devices";

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
  const [device, setDevice] = useState<Device | null>(null);
  const [alias, setAlias] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [operationalStatus, setOperationalStatus] = useState<EditableOperationalStatus>("INACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getClientDevice(params.id)
      .then((loadedDevice) => {
        setDevice(loadedDevice);
        setAlias(loadedDevice.alias ?? "");
        setTargetUrl(loadedDevice.targetUrl ?? "");
        setOperationalStatus(toEditableStatus(loadedDevice.operationalStatus));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load device");
      });
  }, [params.id]);

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
      setMessage("Device updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update device");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Client</p>
          <h1>{device?.alias || device?.publicCode || "Device detail"}</h1>
        </div>
        <Link href="/app/devices">Back</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-success">{message}</p> : null}
      {!device && !error ? <p>Loading...</p> : null}

      {device ? (
        <>
          <section className="detail-grid">
            <div>
              <span>Code</span>
              <strong>{device.publicCode}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{device.deviceType.name}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{device.operationalStatus}</strong>
            </div>
            <div>
              <span>Last scan</span>
              <strong>{device.lastScanAt ? new Date(device.lastScanAt).toLocaleString() : "No scans yet"}</strong>
            </div>
            <div>
              <span>QR URL</span>
              <strong>{device.qrUrl}</strong>
            </div>
            <div>
              <span>NFC URL</span>
              <strong>{device.nfcUrl}</strong>
            </div>
          </section>

          <form className="admin-form config-form" onSubmit={onSubmit}>
            <label>
              Alias
              <input
                maxLength={120}
                onChange={(event) => setAlias(event.target.value)}
                placeholder="Front counter"
                value={alias}
              />
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
              Device status
              <select
                onChange={(event) => setOperationalStatus(event.target.value as EditableOperationalStatus)}
                value={operationalStatus}
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>

            <button disabled={isSaving} type="submit">
              {isSaving ? "Saving..." : "Save configuration"}
            </button>
          </form>

          <section className="events-section">
            <h2>Latest interactions</h2>
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
              <p>No interactions yet.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function toEditableStatus(status: Device["operationalStatus"]): EditableOperationalStatus {
  if (status === "ACTIVE" || status === "PAUSED") {
    return status;
  }

  return "INACTIVE";
}
