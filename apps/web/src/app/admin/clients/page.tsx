"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    listClients()
      .then(setClients)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadClientsError"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const summary = {
    total: clients.length,
    withDevices: clients.filter((client) => (client._count?.devices ?? 0) > 0).length,
    withoutDevices: clients.filter((client) => (client._count?.devices ?? 0) === 0).length,
    missingReviewUrl: clients.filter((client) => !client.googleReviewUrl).length
  };

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return clients.filter((client) => {
      const devicesCount = client._count?.devices ?? 0;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "withDevices" && devicesCount > 0) ||
        (statusFilter === "withoutDevices" && devicesCount === 0) ||
        (statusFilter === "missingReviewUrl" && !client.googleReviewUrl);

      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;

      return [
        client.businessName,
        client.owner.name,
        client.owner.email,
        client.phone,
        client.address,
        client.googleReviewUrl
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [clients, query, statusFilter]);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  return (
    <main className="dashboard-shell admin-clients-page">
      <section className="admin-clients-hero">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.clientsTitle")}</h1>
          <p>{t("admin.clientsDescription")}</p>
        </div>
        <div className="admin-clients-actions">
          <Link className="admin-primary-action" href="/admin/clients/new">
            {t("admin.newClient")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/devices/new">
            {t("admin.newDevice")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/metrics">
            {t("common.metrics")}
          </Link>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-clients-summary" aria-label={t("admin.clientsSummary")}>
        <AdminClientsStat label={t("admin.totalClients")} value={summary.total} />
        <AdminClientsStat label={t("admin.clientsWithDevices")} value={summary.withDevices} />
        <AdminClientsStat label={t("admin.clientsWithoutDevices")} value={summary.withoutDevices} />
        <AdminClientsStat label={t("admin.clientsMissingReview")} value={summary.missingReviewUrl} />
      </section>

      <section className="admin-clients-panel">
        <div className="admin-clients-panel-heading">
          <div>
            <span>{t("admin.clientDirectory")}</span>
            <strong>{isLoading ? t("common.loading") : `${filteredClients.length} ${t("common.clients").toLowerCase()}`}</strong>
          </div>
          <p>{t("admin.clientsDirectoryDescription")}</p>
        </div>

        <form className="admin-clients-filter-form" onSubmit={onFilter}>
          <label className="admin-clients-search">
            {t("common.search")}
            <input onChange={(event) => setQuery(event.target.value)} placeholder={t("admin.clientsSearchPlaceholder")} value={query} />
          </label>
          <label>
            {t("common.status")}
            <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="all">{t("common.all")}</option>
              <option value="withDevices">{t("admin.clientsWithDevices")}</option>
              <option value="withoutDevices">{t("admin.clientsWithoutDevices")}</option>
              <option value="missingReviewUrl">{t("admin.clientsMissingReview")}</option>
            </select>
          </label>
          <div className="admin-clients-filter-actions">
            <button type="submit">{t("admin.applyFilters")}</button>
            <button onClick={clearFilters} type="button">
              {t("admin.clearFilters")}
            </button>
          </div>
        </form>

        <div className="admin-clients-list">
          {filteredClients.map((client) => {
            const devicesCount = client._count?.devices ?? 0;

            return (
              <article className="admin-client-row" key={client.id}>
                <div className="admin-client-row-main">
                  <div className="admin-client-business">
                    <span>{t("common.business")}</span>
                    <strong>{client.businessName}</strong>
                  </div>
                  <div className="admin-client-meta">
                    <span>{client.owner.name ?? t("common.noName")}</span>
                    <span>{client.owner.email}</span>
                  </div>
                </div>

                <div className="admin-client-statuses">
                  <span className={`admin-status-badge ${devicesCount > 0 ? "is-success" : "is-warning"}`}>
                    {devicesCount} {t("common.devices").toLowerCase()}
                  </span>
                  <span className={`admin-status-badge ${client.googleReviewUrl ? "is-success" : "is-neutral"}`}>
                    {client.googleReviewUrl ? t("admin.reviewConfigured") : t("admin.reviewMissing")}
                  </span>
                </div>

                <div className="admin-client-contact">
                  <span>{client.phone ?? t("common.phoneNotSet")}</span>
                  <span>{client.address ?? t("common.addressNotSet")}</span>
                  <strong>{formatDate(locale, client.createdAt)}</strong>
                </div>

                <div className="admin-client-row-actions">
                  <Link className="admin-secondary-action" href={`/admin/clients/${client.id}`}>
                    {t("common.view")}
                  </Link>
                  <Link className="admin-secondary-action" href={`/admin/audit-logs?businessId=${client.id}`}>
                    {t("common.auditLogs")}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {!isLoading && !filteredClients.length ? (
          <div className="admin-clients-empty">
            <strong>{t("admin.noClientsTitle")}</strong>
            <p>{t("admin.noClientsDescription")}</p>
            <Link className="admin-primary-action" href="/admin/clients/new">
              {t("admin.newClient")}
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function AdminClientsStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-clients-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
