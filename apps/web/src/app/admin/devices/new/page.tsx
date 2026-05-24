"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceCreateForm } from "../../../../components/device-create-form";
import { createDevice } from "../../../../lib/devices";
import { useI18n } from "../../../../lib/i18n";

export default function NewDevicePage() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">{t("common.admin")}</p>
              <h1>{t("admin.newDevice")}</h1>
            </div>
            <Link href="/admin/devices">{t("common.back")}</Link>
          </div>
          <DeviceCreateForm
            mode="single"
            onSubmit={async (input) => {
              const device = await createDevice({
                deviceTypeId: input.deviceTypeId,
                prefix: input.prefix
              });
              router.push(`/admin/devices/${device.id}`);
            }}
            submitLabel={t("admin.createDevice")}
          />
        </main>
      )}
    </AdminAuthGate>
  );
}
