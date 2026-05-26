"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AuthUser, clearAccessToken } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { LanguageSelector } from "./language-selector";
import { ThemeToggle } from "./theme-toggle";

interface AdminDashboardShellProps {
  children: ReactNode;
  user: AuthUser;
}

export function AdminDashboardShell({ children, user }: AdminDashboardShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { theme } = useTheme();

  function logout() {
    clearAccessToken();
    window.location.href = "/login";
  }

  const navItems = [
    { href: "/admin", label: t("admin.navOverview") },
    { href: "/admin/devices", label: t("common.devices") },
    { href: "/admin/clients", label: t("common.clients") },
    { href: "/admin/production", label: t("admin.production") },
    { href: "/admin/device-types", label: t("admin.deviceTypes") },
    { href: "/admin/metrics", label: t("common.metrics") },
    { href: "/admin/audit-logs", label: t("common.auditLogs") }
  ];

  return (
    <div className={`admin-shell ${theme === "dark" ? "is-dark" : ""}`}>
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>shop</span>
          <strong>w</strong>
          <span>ise</span>
        </Link>

        <nav className="admin-nav" aria-label={t("admin.navLabel")}>
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link className={isActive ? "is-active" : ""} href={item.href} key={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-account">
          <span>{t("common.admin")}</span>
          <strong>{user.name || user.email}</strong>
          <small>{user.email}</small>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <Link className="admin-mobile-brand" href="/admin">
            <span>shop</span>
            <strong>w</strong>
            <span>ise</span>
          </Link>
          <div className="admin-topbar-actions">
            <LanguageSelector />
            <ThemeToggle />
            <button className="admin-logout" onClick={logout} type="button">
              {t("auth.logout")}
            </button>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
