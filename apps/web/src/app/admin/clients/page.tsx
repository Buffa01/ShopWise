"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { ClientBusiness, listClients } from "../../../lib/clients";

export default function ClientsPage() {
  return (
    <AdminAuthGate>
      {() => <ClientsContent />}
    </AdminAuthGate>
  );
}

function ClientsContent() {
  const [clients, setClients] = useState<ClientBusiness[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load clients");
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Clients</h1>
        </div>
        <Link className="button-link" href="/admin/clients/new">
          New client
        </Link>
      </div>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-list">
        {clients.map((client) => (
          <Link className="table-row" href={`/admin/clients/${client.id}`} key={client.id}>
            <div>
              <strong>{client.businessName}</strong>
              <span>{client.owner.email}</span>
            </div>
            <span>{client.owner.name ?? "No name"}</span>
            <span>{client._count?.devices ?? 0} devices</span>
            <span>{client.createdAt.slice(0, 10)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
