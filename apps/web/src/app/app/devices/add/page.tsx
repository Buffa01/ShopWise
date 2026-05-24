"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientAuthGate } from "../../../../components/client-auth-gate";
import { claimClientDevice } from "../../../../lib/devices";
import { useI18n } from "../../../../lib/i18n";

export default function AddDevicePage() {
  return (
    <ClientAuthGate>
      {() => <AddDeviceContent />}
    </ClientAuthGate>
  );
}

function AddDeviceContent() {
  const router = useRouter();
  const { t } = useI18n();
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const device = await claimClientDevice(extractDeviceCode(codeInput));
      router.push(`/app/devices/${device.id}`);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : t("client.claimDeviceError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.client")}</p>
          <h1>{t("client.addDeviceTitle")}</h1>
        </div>
        <Link href="/app/devices">{t("common.back")}</Link>
      </div>

      <form className="admin-form" onSubmit={onSubmit}>
        <label>
          {t("client.deviceCodeOrUrl")}
          <input
            autoComplete="off"
            onChange={(event) => setCodeInput(event.target.value)}
            placeholder="A000001 or https://sw.uy/r/A000001"
            required
            value={codeInput}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t("client.claimingDevice") : t("client.claimDevice")}
        </button>
      </form>
    </main>
  );
}

function extractDeviceCode(value: string) {
  const trimmed = value.trim().toUpperCase();

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const shortLinkIndex = segments.findIndex((segment) => segment === "R" || segment === "N");
    const code = shortLinkIndex >= 0 ? segments[shortLinkIndex + 1] : segments.at(-1);

    if (code) {
      return code.replace(/[^A-Z0-9]/g, "");
    }
  } catch {
    // Plain codes are accepted below.
  }

  return trimmed.replace(/[^A-Z0-9]/g, "");
}
