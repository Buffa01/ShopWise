"use client";

import { ReactNode, useEffect, useState } from "react";
import { AuthUser, clearAccessToken, getAccessToken, getMe } from "../lib/auth";

export function AdminAuthGate({ children }: { children: (user: AuthUser) => ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState("Loading...");

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
      <main className="dashboard-shell">
        <p>{status}</p>
      </main>
    );
  }

  return children(user);
}

