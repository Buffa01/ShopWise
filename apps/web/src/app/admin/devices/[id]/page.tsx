"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { Device, getDevice } from "../../../../lib/devices";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDevice(params.id)
      .then(setDevice)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load device");
      });
  }, [params.id]);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>{device?.publicCode ?? "Device detail"}</h1>
        </div>
        <Link href="/admin/devices">Back</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!device && !error ? <p>Loading...</p> : null}

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
            <strong>{device.assignmentStatus}</strong>
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
            <span>Batch</span>
            <strong>{device.batch?.id ?? "Single device"}</strong>
          </div>
        </section>
      ) : null}
    </main>
  );
}

