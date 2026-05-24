"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { ClientBusiness, listClients } from "../../../lib/clients";
import { formatDate, useI18n } from "../../../lib/i18n";

export default function ClientsPage() {
  return (
    <AdminAuthGate>
      {() => <ClientsContent />}
    </AdminAuthGate>
  );
}

function ClientsContent() {
  const { locale, t } = useI18n();
  const [clients, setClients] = useState<ClientBusiness[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadClientsError"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.clientsTitle")}</h1>
        </div>
        <Link className="button-link" href="/admin/clients/new">
          {t("admin.newClient")}
        </Link>
      </div>

      {isLoading ? <p>{t("common.loading")}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-list">
        {clients.map((client) => (
          <Link className="table-row" href={`/admin/clients/${client.id}`} key={client.id}>
            <div>
              <strong>{client.businessName}</strong>
              <span>{client.owner.email}</span>
            </div>
            <span>{client.owner.name ?? t("common.noName")}</span>
            <span>
              {client._count?.devices ?? 0} {t("common.devices")}
            </span>
            <span>{formatDate(locale, client.createdAt)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
