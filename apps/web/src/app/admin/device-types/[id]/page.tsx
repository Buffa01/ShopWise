"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceTypeForm } from "../../../../components/device-type-form";
import { StickerTemplateEditor } from "../../../../components/sticker-template-editor";
import { DeviceType, getDeviceType, updateDeviceType } from "../../../../lib/device-types";
import { useI18n } from "../../../../lib/i18n";

export default function EditDeviceTypePage() {
  return (
    <AdminAuthGate>
      {() => <EditDeviceTypeContent />}
    </AdminAuthGate>
  );
}

function EditDeviceTypeContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeviceType(params.id)
      .then(setDeviceType)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.loadDeviceTypeError"));
      });
  }, [params.id]);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.editDeviceType")}</h1>
        </div>
        <Link href="/admin/device-types">{t("common.back")}</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!deviceType && !error ? <p>{t("common.loading")}</p> : null}

      {deviceType ? (
        <DeviceTypeForm
          initialValue={deviceType}
          onSubmit={async (input) => {
            const updated = await updateDeviceType(deviceType.id, input);
            setDeviceType(updated);
            router.refresh();
          }}
          submitLabel={t("admin.saveChanges")}
        />
      ) : null}

      {deviceType ? <StickerTemplateEditor deviceType={deviceType} onChange={setDeviceType} /> : null}
    </main>
  );
}
