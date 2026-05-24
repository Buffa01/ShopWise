"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LanguageSelector } from "../../components/language-selector";
import { getHomePathForRole, register, setAccessToken } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await register({
        name: name || undefined,
        businessName,
        email,
        password
      });
      setAccessToken(response.accessToken);
      router.push(getHomePathForRole(response.user.role));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("auth.registerError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="top-bar">
        <LanguageSelector />
      </div>
      <section className="auth-panel">
        <p className="eyebrow">ShopWise</p>
        <h1>{t("auth.registerTitle")}</h1>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            {t("common.name")}
            <input
              autoComplete="name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              type="text"
              value={name}
            />
          </label>
          <label>
            {t("auth.businessName")}
            <input
              autoComplete="organization"
              minLength={2}
              name="businessName"
              onChange={(event) => setBusinessName(event.target.value)}
              required
              type="text"
              value={businessName}
            />
          </label>
          <label>
            {t("common.email")}
            <input
              autoComplete="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            {t("common.password")}
            <input
              autoComplete="new-password"
              minLength={8}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
          </button>
        </form>
        <p className="auth-alt">
          {t("auth.alreadyHaveAccount")} <Link href="/login">{t("auth.loginAction")}</Link>
        </p>
      </section>
    </main>
  );
}
