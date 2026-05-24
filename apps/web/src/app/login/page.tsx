"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LanguageSelector } from "../../components/language-selector";
import { getHomePathForRole, login, setAccessToken } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login(email, password);
      setAccessToken(response.accessToken);
      router.push(getHomePathForRole(response.user.role));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("auth.loginError"));
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
        <h1>{t("auth.loginTitle")}</h1>
        <form onSubmit={onSubmit} className="auth-form">
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
              autoComplete="current-password"
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
            {isSubmitting ? t("auth.loggingIn") : t("auth.loginAction")}
          </button>
        </form>
        <p className="auth-alt">
          {t("auth.newToShopWise")} <Link href="/register">{t("auth.createAccount")}</Link>
        </p>
      </section>
    </main>
  );
}
