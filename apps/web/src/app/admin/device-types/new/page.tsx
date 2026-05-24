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
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">{t("common.admin")}</p>
              <h1>{t("admin.newDeviceType")}</h1>
            </div>
            <Link href="/admin/device-types">{t("common.back")}</Link>
          </div>
          <DeviceTypeForm
            onSubmit={async (input) => {
              const deviceType = await createDeviceType(input);
              router.push(`/admin/device-types/${deviceType.id}`);
            }}
            submitLabel={t("admin.createType")}
          />
        </main>
      )}
    </AdminAuthGate>
  );
}
