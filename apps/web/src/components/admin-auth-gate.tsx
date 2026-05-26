"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthUser, clearAccessToken, getAccessToken, getMe } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { AdminDashboardShell } from "./admin-dashboard-shell";

export function AdminAuthGate({ children }: { children: (user: AuthUser) => ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    getMe(token)
      .then((currentUser) => {
        if (currentUser.role !== "ADMIN") {
          window.location.href = "/app";
          return;
        }

        setUser(currentUser);
      })
      .catch(() => {
        clearAccessToken();
        window.location.href = "/login";
      });
  }, []);

  if (!user) {
    return (
      <main className="admin-loading">
        <div className="admin-loading-mark">
          <span>shop</span>
          <strong>w</strong>
          <span>ise</span>
        </div>
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  return <AdminDashboardShell user={user}>{children(user)}</AdminDashboardShell>;
}
