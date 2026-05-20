"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { AssignmentStatus, Device, OperationalStatus, ProductionStatus, listDevices } from "../../../lib/devices";

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
        setError(loadError instanceof Error ? loadError.message : "Could not load devices");
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

      <form className="admin-form filter-form" onSubmit={onFilter}>
        <label>
          Search
          <input onChange={(event) => setQ(event.target.value)} placeholder="Code, alias, client, URL" value={q} />
        </label>
        <label>
          Assignment
          <select onChange={(event) => setAssignmentStatus(event.target.value)} value={assignmentStatus}>
            <option value="">All</option>
            <option value="UNASSIGNED">Unassigned</option>
            <option value="ASSIGNED">Assigned</option>
          </select>
        </label>
        <label>
          Operation
          <select onChange={(event) => setOperationalStatus(event.target.value)} value={operationalStatus}>
            <option value="">All</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="DISABLED">Disabled</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label>
          Production
          <select onChange={(event) => setProductionStatus(event.target.value)} value={productionStatus}>
            <option value="">All</option>
            <option value="CREATED">Created</option>
            <option value="ASSET_GENERATED">Asset generated</option>
            <option value="DOWNLOADED">Downloaded</option>
            <option value="PRINTED">Printed</option>
            <option value="ERROR">Error</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
      </form>

      <div className="table-list">
        {devices.map((device) => (
          <Link className="table-row devices-row" href={`/admin/devices/${device.id}`} key={device.id}>
            <div>
              <strong>{device.publicCode}</strong>
              <span>{device.alias || device.deviceType.name}</span>
            </div>
            <span>{device.assignmentStatus}</span>
            <span>{device.operationalStatus}</span>
            <span>{device.business?.businessName ?? "No client"}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
