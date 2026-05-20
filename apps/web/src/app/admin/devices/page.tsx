"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { Device, listDevices } from "../../../lib/devices";

export default function DevicesPage() {
  return (
    <AdminAuthGate>
      {() => <DevicesContent />}
    </AdminAuthGate>
  );
}

function DevicesContent() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listDevices()
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
          <p className="eyebrow">Admin</p>
          <h1>Devices</h1>
        </div>
        <div className="admin-actions">
          <Link className="button-link" href="/admin/devices/new">
            New device
          </Link>
          <Link className="button-link" href="/admin/devices/batch">
            New batch
          </Link>
        </div>
      </div>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-list">
        {devices.map((device) => (
          <Link className="table-row devices-row" href={`/admin/devices/${device.id}`} key={device.id}>
            <div>
              <strong>{device.publicCode}</strong>
              <span>{device.deviceType.name}</span>
            </div>
            <span>{device.assignmentStatus}</span>
            <span>{device.operationalStatus}</span>
            <span>{device.createdAt.slice(0, 10)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

