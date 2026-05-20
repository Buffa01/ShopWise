"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientAuthGate } from "../../../components/client-auth-gate";
import { Device, listClientDevices } from "../../../lib/devices";

export default function ClientDevicesPage() {
  return (
    <ClientAuthGate>
      {() => <ClientDevicesContent />}
    </ClientAuthGate>
  );
}

function ClientDevicesContent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listClientDevices()
      .then(setDevices)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load devices");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Client</p>
          <h1>My devices</h1>
        </div>
        <div className="admin-actions">
          <Link href="/app">Back</Link>
          <Link className="button-link" href="/app/devices/add">
            Add device
          </Link>
        </div>
      </div>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      {!isLoading && !devices.length ? <p>No devices claimed yet.</p> : null}

      <div className="table-list">
        {devices.map((device) => (
          <Link className="table-row devices-row" href={`/app/devices/${device.id}`} key={device.id}>
            <div>
              <strong>{device.alias || device.publicCode}</strong>
              <span>{device.deviceType.name}</span>
            </div>
            <span>{device.operationalStatus}</span>
            <span>{device.targetUrl ? "Configured" : "No target"}</span>
            <span>{device.lastScanAt ? new Date(device.lastScanAt).toLocaleDateString() : "No scans"}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
