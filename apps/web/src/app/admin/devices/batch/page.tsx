"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceCreateForm } from "../../../../components/device-create-form";
import { createDeviceBatch, DeviceBatch, getBatchPrintSheetUrl } from "../../../../lib/devices";
import { getAccessToken } from "../../../../lib/auth";
import { translateStatus, useI18n } from "../../../../lib/i18n";

export default function NewDeviceBatchPage() {
  const [batch, setBatch] = useState<DeviceBatch | null>(null);
  const { t } = useI18n();

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">{t("common.admin")}</p>
              <h1>{t("admin.newDeviceBatch")}</h1>
            </div>
            <Link href="/admin/devices">{t("common.back")}</Link>
          </div>
          <DeviceCreateForm
            mode="batch"
            onSubmit={async (input) => {
              const createdBatch = await createDeviceBatch({
                deviceTypeId: input.deviceTypeId,
                prefix: input.prefix,
                quantity: input.quantity ?? 1
              });
              setBatch(createdBatch);
            }}
            submitLabel={t("admin.createBatch")}
          />
          {batch ? (
            <section className="events-section">
              <h2>{t("admin.batchCreated")}</h2>
              <div className="detail-grid">
                <div>
                  <span>{t("common.quantity")}</span>
                  <strong>{batch.devices.length}</strong>
                </div>
                <div>
                  <span>{t("common.status")}</span>
                  <strong>{translateStatus(t, batch.status)}</strong>
                </div>
                <div>
                  <span>{t("admin.firstDevice")}</span>
                  <strong>{batch.devices[0]?.publicCode ?? t("admin.noDevices")}</strong>
                </div>
              </div>
              <div className="asset-actions admin-actions">
                {batch.devices[0] ? (
                  <Link className="button-secondary" href={`/admin/devices/${batch.devices[0].id}`}>
                    {t("admin.openFirstDevice")}
                  </Link>
                ) : null}
                <button className="button-link" onClick={() => downloadBatchSheet(batch)} type="button">
                  {t("admin.downloadPrintSheet")}
                </button>
              </div>
            </section>
          ) : null}
        </main>
      )}
    </AdminAuthGate>
  );
}

function downloadBatchSheet(batch: DeviceBatch) {
  const token = getAccessToken();
  if (!token) return;

  void fetch(getBatchPrintSheetUrl(batch.id), {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((response) => response.blob())
    .then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `batch-${batch.id}-sheet.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
}
