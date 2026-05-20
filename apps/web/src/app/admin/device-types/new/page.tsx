"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceTypeForm } from "../../../../components/device-type-form";
import { createDeviceType } from "../../../../lib/device-types";

export default function NewDeviceTypePage() {
  const router = useRouter();

  return (
    <AdminAuthGate>
      {() => (
        <main className="dashboard-shell">
          <div className="page-header">
            <div>
              <p className="eyebrow">Admin</p>
              <h1>New device type</h1>
            </div>
            <Link href="/admin/device-types">Back</Link>
          </div>
          <DeviceTypeForm
            onSubmit={async (input) => {
              const deviceType = await createDeviceType(input);
              router.push(`/admin/device-types/${deviceType.id}`);
            }}
            submitLabel="Create type"
          />
        </main>
      )}
    </AdminAuthGate>
  );
}

