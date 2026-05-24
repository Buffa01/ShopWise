"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AdminAuthGate } from "../../../../components/admin-auth-gate";
import { createClient } from "../../../../lib/clients";
import { useI18n } from "../../../../lib/i18n";

export default function NewClientPage() {
  return (
    <AdminAuthGate>
      {() => <NewClientContent />}
    </AdminAuthGate>
  );
}

function NewClientContent() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const client = await createClient({
        name,
        email,
        password,
        businessName,
        phone,
        address,
        googleReviewUrl
      });
      router.push(`/admin/clients/${client.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t("admin.createClientError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("admin.newClient")}</h1>
        </div>
        <Link href="/admin/clients">{t("common.back")}</Link>
      </div>

      <form className="admin-form" onSubmit={onSubmit}>
        <label>
          {t("common.name")}
          <input onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <label>
          {t("common.email")}
          <input onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label>
          {t("common.temporaryPassword")}
          <input minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        <label>
          {t("auth.businessName")}
          <input minLength={2} onChange={(event) => setBusinessName(event.target.value)} required value={businessName} />
        </label>
        <label>
          {t("common.phone")}
          <input onChange={(event) => setPhone(event.target.value)} value={phone} />
        </label>
        <label>
          {t("common.address")}
          <input onChange={(event) => setAddress(event.target.value)} value={address} />
        </label>
        <label>
          {t("common.googleReviewUrl")}
          <input onChange={(event) => setGoogleReviewUrl(event.target.value)} type="url" value={googleReviewUrl} />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t("admin.creatingClient") : t("admin.createClient")}
        </button>
      </form>
    </main>
  );
}
