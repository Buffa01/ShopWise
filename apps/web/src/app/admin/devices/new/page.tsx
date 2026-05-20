"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceCreateForm } from "../../../../components/device-create-form";
import { createDevice } from "../../../../lib/devices";

export default function NewDevicePage() {
  const router = useRouter();

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>New device</h1>
            </div>
            <Link href="/admin/devices">Back</Link>
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
            submitLabel="Create device"
          />
        </main>
      )}
    </AdminAuthGate>
  );
}

