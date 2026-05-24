"use client";

import Link from "next/link";
import { AdminAuthGate } from "../../components/admin-auth-gate";
import { useI18n } from "../../lib/i18n";

export default function AdminPage() {
  const { t } = useI18n();

  return (
    <AdminAuthGate>
      {(user) => (
        <main className="dashboard-shell">
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.homeTitle")}</h1>
          <p>{user.email}</p>
          <div className="admin-actions">
            <Link className="button-link" href="/admin/device-types">
              {t("admin.deviceTypes")}
            </Link>
            <Link className="button-link" href="/admin/devices">
              {t("common.devices")}
            </Link>
            <Link className="button-link" href="/admin/clients">
              {t("common.clients")}
            </Link>
            <Link className="button-link" href="/admin/metrics">
              {t("common.metrics")}
            </Link>
            <Link className="button-link" href="/admin/audit-logs">
              {t("common.auditLogs")}
            </Link>
          </div>
        </main>
      )}
    </AdminAuthGate>
  );
}
