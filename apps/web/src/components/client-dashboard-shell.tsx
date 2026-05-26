"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { clearAccessToken, AuthUser } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { LanguageSelector } from "./language-selector";
import { ThemeToggle } from "./theme-toggle";

interface ClientDashboardShellProps {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
  user: AuthUser;
}

export function ClientDashboardShell({
  actions,
  children,
  description,
  eyebrow,
  title,
  user
}: ClientDashboardShellProps) {
  const { t } = useI18n();
  const { theme } = useTheme();

  function logout() {
    clearAccessToken();
    window.location.href = "/login";
  }

  const navItems = [
    { href: "/app", label: t("client.navOverview") },
    { href: "/app/devices", label: t("client.myDevices") },
    { href: "/app/metrics", label: t("common.metrics") },
    { href: "/app/devices/add", label: t("client.addDevice") }
  ];

  return (
    <div className={`client-shell ${theme === "dark" ? "is-dark" : ""}`}>
      <aside className="client-sidebar">
        <Link className="client-brand" href="/app">
          <span>shop</span>
          <strong>w</strong>
          <span>ise</span>
        </Link>

        <nav className="client-nav" aria-label={t("client.navLabel")}>
          {navItems.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="client-account">
          <span>{t("client.account")}</span>
          <strong>{user.name || user.email}</strong>
          <small>{user.email}</small>
        </div>
      </aside>

      <div className="client-main">
        <header className="client-topbar">
          <div className="client-mobile-brand">
            <span>shop</span>
            <strong>w</strong>
            <span>ise</span>
          </div>
          <div className="client-topbar-actions">
            <LanguageSelector />
            <ThemeToggle />
            <button className="client-logout" onClick={logout} type="button">
              {t("auth.logout")}
            </button>
          </div>
        </header>

        <main className="client-content">
          <div className="client-page-heading">
            <div>
              {eyebrow ? <p className="client-eyebrow">{eyebrow}</p> : null}
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>
            {actions ? <div className="client-heading-actions">{actions}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
