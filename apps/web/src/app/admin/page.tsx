"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { useI18n } from "../../lib/i18n";
import { OverviewMetrics, getAdminOverviewMetrics } from "../../lib/metrics";

export default function AdminPage() {
  const { t } = useI18n();

  return (
    <AdminAuthGate>
      {() => <AdminHome />}
    </AdminAuthGate>
  );
}

function AdminHome() {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverviewMetrics()
      .then(setMetrics)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("metrics.loadError"));
      });
  }, []);

  return (
    <main className="dashboard-shell admin-home">
      <section className="admin-home-hero">
        <div>
          <p className="admin-eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.homeTitle")}</h1>
          <p>{t("admin.homeDescription")}</p>
        </div>
        <div className="admin-home-actions">
          <Link className="admin-primary-action" href="/admin/devices/new">
            {t("admin.newDevice")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/devices/batch">
            {t("admin.newBatch")}
          </Link>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-overview-grid" aria-label={t("admin.overviewLabel")}>
        <AdminStatCard label={t("metrics.totalDevices")} value={metrics?.totalDevices} />
        <AdminStatCard label={t("metrics.activeDevices")} value={metrics?.activeDevices} />
        <AdminStatCard label={t("metrics.assigned")} value={metrics?.assignedDevices} />
        <AdminStatCard label={t("metrics.totalScans")} value={metrics?.totalScans} />
      </section>

      <section className="admin-module-grid">
        <AdminModuleCard
          description={t("admin.devicesModuleDescription")}
          href="/admin/devices"
          label={t("common.devices")}
          meta={metrics ? `${metrics.unassignedDevices} ${t("metrics.unassigned").toLowerCase()}` : t("common.loading")}
        />
        <AdminModuleCard
          description={t("admin.clientsModuleDescription")}
          href="/admin/clients"
          label={t("common.clients")}
          meta={metrics ? `${metrics.topClients?.length ?? 0} ${t("metrics.topClients").toLowerCase()}` : t("common.loading")}
        />
        <AdminModuleCard
          description={t("admin.deviceTypesModuleDescription")}
          href="/admin/device-types"
          label={t("admin.deviceTypes")}
          meta={t("admin.templatesAndPrint")}
        />
        <AdminModuleCard
          description={t("admin.metricsModuleDescription")}
          href="/admin/metrics"
          label={t("common.metrics")}
          meta={metrics ? `${metrics.qrScans} QR / ${metrics.nfcTaps} NFC` : t("common.loading")}
        />
        <AdminModuleCard
          description={t("admin.auditModuleDescription")}
          href="/admin/audit-logs"
          label={t("common.auditLogs")}
          meta={t("admin.traceability")}
        />
      </section>
    </main>
  );
}

function AdminStatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="admin-stat-card">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value : "..."}</strong>
    </div>
  );
}

function AdminModuleCard({
  description,
  href,
  label,
  meta
}: {
  description: string;
  href: string;
  label: string;
  meta: string;
}) {
  return (
    <Link className="admin-module-card" href={href}>
      <span>{meta}</span>
      <strong>{label}</strong>
      <p>{description}</p>
    </Link>
  );
}
