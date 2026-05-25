"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LanguageSelector } from "../../components/language-selector";
import { ThemeToggle } from "../../components/theme-toggle";
import { getHomePathForRole, login, setAccessToken } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { useTheme } from "../../lib/theme";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { theme } = useTheme();
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
    <main className={`auth-shell auth-experience ${theme === "dark" ? "is-dark" : "is-light"}`}>
      <header className="auth-nav">
        <Link aria-label="ShopWise inicio" className="brand-mark" href="/">
          <img alt="ShopWise" src="/brand/logo-shopwise-black.png" />
        </Link>
        <div className="auth-nav-actions">
          <LanguageSelector />
          <ThemeToggle />
          <Link className="auth-home-link" href="/">
            {t("auth.backHome")}
          </Link>
        </div>
      </header>

      <section className="auth-layout">
        <div className="auth-panel">
          <p className="eyebrow">{t("auth.loginEyebrow")}</p>
          <h1>{t("auth.loginTitle")}</h1>
          <p className="auth-subtitle">{t("auth.loginSubtitle")}</p>
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
        </div>

        <aside className="auth-side-panel" aria-label="ShopWise">
          <div className="auth-device-placeholder">
            <span>QR</span>
            <strong>NFC</strong>
          </div>
          <div>
            <p className="eyebrow">ShopWise</p>
            <h2>{t("auth.sideTitle")}</h2>
            <p>{t("auth.sideBody")}</p>
          </div>
          <div className="auth-benefits">
            <span>{t("auth.secureAccess")}</span>
            <span>{t("auth.controlPanel")}</span>
            <span>{t("auth.fastSetup")}</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
