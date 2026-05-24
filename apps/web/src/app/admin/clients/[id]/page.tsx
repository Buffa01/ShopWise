"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { ClientBusiness, getClient } from "../../../../lib/clients";
import { formatDate, translateStatus, useI18n } from "../../../../lib/i18n";

export default function ClientDetailPage() {
  return (
    <AdminAuthGate>
      {() => <ClientDetailContent />}
    </AdminAuthGate>
  );
}

function ClientDetailContent() {
  const params = useParams<{ id: string }>();
  const { locale, t } = useI18n();
  const [client, setClient] = useState<ClientBusiness | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClient(params.id)
      .then(setClient)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadClientError"));
      });
  }, [params.id]);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{client?.businessName ?? t("admin.clientDetail")}</h1>
        </div>
        <div className="admin-actions">
          <Link href="/admin/clients">{t("common.back")}</Link>
          <Link className="button-secondary" href={`/admin/audit-logs?businessId=${params.id}`}>
            {t("common.auditLogs")}
          </Link>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!client && !error ? <p>{t("common.loading")}</p> : null}

      {client ? (
        <>
          <section className="detail-grid">
            <div>
              <span>{t("common.business")}</span>
              <strong>{client.businessName}</strong>
            </div>
            <div>
              <span>{t("common.owner")}</span>
              <strong>{client.owner.name ?? t("common.noName")}</strong>
            </div>
            <div>
              <span>{t("common.email")}</span>
              <strong>{client.owner.email}</strong>
            </div>
            <div>
              <span>{t("common.phone")}</span>
              <strong>{client.phone ?? t("common.notSet")}</strong>
            </div>
            <div>
              <span>{t("common.address")}</span>
              <strong>{client.address ?? t("common.notSet")}</strong>
            </div>
            <div>
              <span>{t("common.googleReviewUrl")}</span>
              <strong>{client.googleReviewUrl ?? t("common.notSet")}</strong>
            </div>
          </section>

          <section className="events-section">
            <h2>{t("common.devices")}</h2>
            {client.devices?.length ? (
              <div className="table-list">
                {client.devices.map((device) => (
                  <Link className="table-row devices-row" href={`/admin/devices/${device.id}`} key={device.id}>
                    <div>
                      <strong>{device.publicCode}</strong>
                      <span>{device.alias || device.deviceType.name}</span>
                    </div>
                    <span>{translateStatus(t, device.productionStatus)}</span>
                    <span>{translateStatus(t, device.operationalStatus)}</span>
                    <span>{device.lastScanAt ? formatDate(locale, device.lastScanAt) : t("common.noScans")}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>{t("admin.noDevicesAssigned")}</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
