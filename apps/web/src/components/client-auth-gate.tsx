"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthUser, clearAccessToken, getAccessToken, getMe } from "../lib/auth";

export function ClientAuthGate({ children }: { children: (user: AuthUser) => ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

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
      <main className="dashboard-shell">
        <p>Loading...</p>
      </main>
    );
  }

  return children(user);
}
