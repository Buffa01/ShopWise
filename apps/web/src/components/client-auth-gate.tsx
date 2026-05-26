"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthUser, clearAccessToken, getAccessToken, getMe } from "../lib/auth";
import { useI18n } from "../lib/i18n";

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

  if (!user) {
    return (
      <main className="client-loading">
        <div className="client-loading-mark">
          <span>shop</span>
          <strong>w</strong>
          <span>ise</span>
        </div>
        <p>{t("common.loading")}</p>
      </main>
    );
  }

  return <>{children(user)}</>;
}
