"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceTypeForm } from "../../../../components/device-type-form";
import { createDeviceType } from "../../../../lib/device-types";
import { useI18n } from "../../../../lib/i18n";

export default function NewDeviceTypePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell admin-device-type-edit-page">
          <section className="admin-device-type-edit-hero">
            <div>
              <p className="eyebrow">{t("admin.templatesAndPrint")}</p>
              <h1>{t("admin.newDeviceType")}</h1>
              <p>{t("admin.newDeviceTypeDescription")}</p>
            </div>
            <Link className="admin-secondary-action" href="/admin/device-types">
              {t("common.back")}
            </Link>
          </section>
          <section className="admin-device-type-edit-grid is-single">
            <DeviceTypeForm
              onSubmit={async (input) => {
                const deviceType = await createDeviceType(input);
                router.push(`/admin/device-types/${deviceType.id}`);
              }}
              submitLabel={t("admin.createType")}
            />
          </section>
        </main>
      )}
    </AdminAuthGate>
  );
}
