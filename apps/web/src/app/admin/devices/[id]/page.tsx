"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { Device, getDevice, getLatestPrintAssetUrl } from "../../../../lib/devices";
import { getAccessToken } from "../../../../lib/auth";

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
