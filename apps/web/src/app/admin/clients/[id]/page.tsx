"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { ClientBusiness, getClient } from "../../../../lib/clients";

export default function ClientDetailPage() {
  return (
    <AdminAuthGate>
      {() => <ClientDetailContent />}
    </AdminAuthGate>
  );
}

function ClientDetailContent() {
  const params = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientBusiness | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClient(params.id)
      .then(setClient)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load client");
      });
  }, [params.id]);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>{client?.businessName ?? "Client detail"}</h1>
        </div>
        <Link href="/admin/clients">Back</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!client && !error ? <p>Loading...</p> : null}

      {client ? (
        <>
          <section className="detail-grid">
            <div>
              <span>Business</span>
              <strong>{client.businessName}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{client.owner.name ?? "No name"}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{client.owner.email}</strong>
            </div>
            <div>
              <span>Phone</span>
              <strong>{client.phone ?? "Not set"}</strong>
            </div>
            <div>
              <span>Address</span>
              <strong>{client.address ?? "Not set"}</strong>
            </div>
            <div>
              <span>Google Review URL</span>
              <strong>{client.googleReviewUrl ?? "Not set"}</strong>
            </div>
          </section>

          <section className="events-section">
            <h2>Devices</h2>
            {client.devices?.length ? (
              <div className="table-list">
                {client.devices.map((device) => (
                  <Link className="table-row devices-row" href={`/admin/devices/${device.id}`} key={device.id}>
                    <div>
                      <strong>{device.publicCode}</strong>
                      <span>{device.alias || device.deviceType.name}</span>
                    </div>
                    <span>{device.productionStatus}</span>
                    <span>{device.operationalStatus}</span>
                    <span>{device.lastScanAt ? new Date(device.lastScanAt).toLocaleDateString() : "No scans"}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No devices assigned.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
