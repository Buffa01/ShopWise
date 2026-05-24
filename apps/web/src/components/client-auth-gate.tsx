"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthUser, clearAccessToken, getAccessToken, getMe } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { LanguageSelector } from "./language-selector";

export function ClientAuthGate({ children }: { children: (user: AuthUser) => ReactNode }) {
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
        if (currentUser.role === "ADMIN") {
          window.location.href = "/admin";
          return;
        }

        setUser(currentUser);
      })
      .catch(() => {
        clearAccessToken();
        window.location.href = "/login";
      });
  }, []);

  function logout() {
    clearAccessToken();
    window.location.href = "/login";
  }

  if (!user) {
    return (
      <main className="dashboard-shell">
        <div className="top-bar">
          <LanguageSelector />
        </div>
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  return (
    <>
      <div className="top-bar dashboard-top-bar">
        <LanguageSelector />
        <button className="button-secondary top-bar-action" onClick={logout} type="button">
          {t("auth.logout")}
        </button>
      </div>
      {children(user)}
    </>
  );
}
