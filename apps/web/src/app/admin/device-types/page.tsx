"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { DeviceType, listDeviceTypes } from "../../../lib/device-types";

export default function DeviceTypesPage() {
  return (
    <AdminAuthGate>
      {() => <DeviceTypesContent />}
    </AdminAuthGate>
  );
}

function DeviceTypesContent() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listDeviceTypes()
      .then(setDeviceTypes)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load device types");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Device types</h1>
        </div>
        <Link className="button-link" href="/admin/device-types/new">
          New type
        </Link>
      </div>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-list">
        {deviceTypes.map((deviceType) => (
          <Link className="table-row" href={`/admin/device-types/${deviceType.id}`} key={deviceType.id}>
            <div>
              <strong>{deviceType.name}</strong>
              <span>{deviceType.slug}</span>
            </div>
            <span>{deviceType.defaultPrefix ?? "No prefix"}</span>
            <span>{deviceType.isActive ? "Active" : "Inactive"}</span>
            <span>{deviceType._count?.devices ?? 0} devices</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

