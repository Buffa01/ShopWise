"use client";

import Link from "next/link";
import { ClientAuthGate } from "../../components/client-auth-gate";
import { useI18n } from "../../lib/i18n";

export default function ClientAppPage() {
  const { t } = useI18n();

  return (
    <ClientAuthGate>
      {(user) => (
        <main className="dashboard-shell">
          <p className="eyebrow">{t("common.client")}</p>
          <h1>{t("client.homeTitle")}</h1>
          <p>{user.email}</p>
          <div className="admin-actions">
            <Link className="button-link" href="/app/devices">
              {t("client.myDevices")}
            </Link>
            <Link className="button-link" href="/app/devices/add">
              {t("client.addDevice")}
            </Link>
            <Link className="button-link" href="/app/metrics">
              {t("common.metrics")}
            </Link>
          </div>
        </main>
      )}
    </ClientAuthGate>
  );
}
