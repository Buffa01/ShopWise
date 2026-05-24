"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceCreateForm } from "../../../../components/device-create-form";
import { createDeviceBatch, DeviceBatch, getBatchPrintSheetUrl } from "../../../../lib/devices";
import { getAccessToken } from "../../../../lib/auth";

export default function NewDeviceBatchPage() {
  const [batch, setBatch] = useState<DeviceBatch | null>(null);

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>New device batch</h1>
            </div>
            <Link href="/admin/devices">Back</Link>
          </div>
          <DeviceCreateForm
            mode="batch"
            onSubmit={async (input) => {
              const createdBatch = await createDeviceBatch({
                deviceTypeId: input.deviceTypeId,
                prefix: input.prefix,
                quantity: input.quantity ?? 1
              });
              setBatch(createdBatch);
            }}
            submitLabel="Create batch"
          />
          {batch ? (
            <section className="events-section">
              <h2>Batch created</h2>
              <div className="detail-grid">
                <div>
                  <span>Quantity</span>
                  <strong>{batch.devices.length}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{batch.status}</strong>
                </div>
                <div>
                  <span>First device</span>
                  <strong>{batch.devices[0]?.publicCode ?? "No devices"}</strong>
                </div>
              </div>
              <div className="asset-actions admin-actions">
                {batch.devices[0] ? (
                  <Link className="button-secondary" href={`/admin/devices/${batch.devices[0].id}`}>
                    Open first device
                  </Link>
                ) : null}
                <button className="button-link" onClick={() => downloadBatchSheet(batch)} type="button">
                  Download print sheet PDF
                </button>
              </div>
            </section>
          ) : null}
        </main>
      )}
    </AdminAuthGate>
  );
}

function downloadBatchSheet(batch: DeviceBatch) {
  const token = getAccessToken();
  if (!token) return;

  void fetch(getBatchPrintSheetUrl(batch.id), {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batch.id}-sheet.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
}
