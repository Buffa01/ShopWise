"use client";

import Link from "next/link";
import { ClientAuthGate } from "../../components/client-auth-gate";
import { ClientDashboardShell } from "../../components/client-dashboard-shell";
import { useI18n } from "../../lib/i18n";

export default function ClientAppPage() {
  const { t } = useI18n();

  return (
    <ClientAuthGate>
      {(user) => (
        <ClientDashboardShell
          description={t("client.overviewDescription")}
          eyebrow={t("common.client")}
          title={t("client.homeTitle")}
          user={user}
        >
          <section className="client-home-hero">
            <div>
              <p className="client-eyebrow">{t("client.quickStart")}</p>
              <h2>{t("client.homeHeroTitle")}</h2>
              <p>{t("client.homeHeroDescription")}</p>
              <div className="client-hero-actions">
                <Link className="client-primary-action" href="/app/devices/add">
                  {t("client.addDevice")}
                </Link>
                <Link className="client-secondary-action" href="/app/devices">
                  {t("client.myDevices")}
                </Link>
              </div>
            </div>
            <div className="client-device-preview" aria-hidden="true">
              <span>QR</span>
              <strong>NFC</strong>
              <small>ShopWise</small>
            </div>
          </section>

          <section className="client-action-grid" aria-label={t("client.quickActions")}>
            <Link className="client-action-card" href="/app/devices">
              <span>{t("common.devices")}</span>
              <strong>{t("client.myDevices")}</strong>
              <p>{t("client.devicesDescription")}</p>
            </Link>
            <Link className="client-action-card" href="/app/devices/add">
              <span>{t("client.scanDeviceEyebrow")}</span>
              <strong>{t("client.addDevice")}</strong>
              <p>{t("client.addDeviceDescription")}</p>
            </Link>
            <Link className="client-action-card" href="/app/metrics">
              <span>{t("common.metrics")}</span>
              <strong>{t("client.metricsTitle")}</strong>
              <p>{t("client.metricsDescription")}</p>
            </Link>
          </section>
        </ClientDashboardShell>
      )}
    </ClientAuthGate>
  );
}
