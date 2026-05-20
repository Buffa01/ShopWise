"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceCreateForm } from "../../../../components/device-create-form";
import { createDeviceBatch } from "../../../../lib/devices";

export default function NewDeviceBatchPage() {
  const router = useRouter();

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>New device batch</h1>
            </div>
            <Link href="/admin/devices">Back</Link>
          </div>
          <DeviceCreateForm
            mode="batch"
            onSubmit={async (input) => {
              const batch = await createDeviceBatch({
                deviceTypeId: input.deviceTypeId,
                prefix: input.prefix,
                quantity: input.quantity ?? 1
              });
              router.push(`/admin/devices/${batch.devices[0]?.id ?? ""}`);
            }}
            submitLabel="Create batch"
          />
        </main>
      )}
    </AdminAuthGate>
  );
}

