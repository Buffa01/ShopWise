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
    <main className="dashboard-shell admin-device-type-edit-page">
      <section className="admin-device-type-edit-hero">
        <div>
          <p className="eyebrow">{t("admin.templatesAndPrint")}</p>
          <h1>{deviceType?.name ?? t("admin.editDeviceType")}</h1>
          <p>{t("admin.editDeviceTypeDescription")}</p>
        </div>
        <div className="admin-device-type-edit-actions">
          <Link className="admin-secondary-action" href="/admin/device-types">
            {t("common.back")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/production">
            {t("admin.production")}
          </Link>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}
      {!deviceType && !error ? <p>{t("common.loading")}</p> : null}

      {deviceType ? (
        <section className="admin-device-type-overview">
          <DeviceTypeFact label={t("admin.slug")} value={deviceType.slug} />
          <DeviceTypeFact label={t("admin.defaultPrefix")} value={deviceType.defaultPrefix ?? t("admin.noPrefix")} />
          <DeviceTypeFact label={t("admin.designAsset")} value={deviceType.baseDesignKey ? t("admin.designReady") : t("admin.designMissing")} />
          <DeviceTypeFact label={t("common.devices")} value={`${deviceType._count?.devices ?? 0}`} />
        </section>
      ) : null}

      {deviceType ? (
        <section className="admin-device-type-edit-grid">
          <DeviceTypeForm
            initialValue={deviceType}
            onSubmit={async (input) => {
              const updated = await updateDeviceType(deviceType.id, input);
              setDeviceType(updated);
              router.refresh();
            }}
            submitLabel={t("admin.saveChanges")}
          />
          <StickerTemplateEditor deviceType={deviceType} onChange={setDeviceType} />
        </section>
      ) : null}
    </main>
  );
}

function DeviceTypeFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-device-type-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
