"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { DeviceTypeForm } from "../../../../components/device-type-form";
import { DeviceType, getDeviceType, updateDeviceType } from "../../../../lib/device-types";

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
  const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDeviceType(params.id)
      .then(setDeviceType)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load device type");
      });
  }, [params.id]);

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Edit device type</h1>
        </div>
        <Link href="/admin/device-types">Back</Link>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
      {!deviceType && !error ? <p>Loading...</p> : null}

      {deviceType ? (
        <DeviceTypeForm
          initialValue={deviceType}
          onSubmit={async (input) => {
            const updated = await updateDeviceType(deviceType.id, input);
            setDeviceType(updated);
            router.refresh();
          }}
          submitLabel="Save changes"
        />
      ) : null}
    </main>
  );
}

