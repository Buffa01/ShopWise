"use client";

import { useEffect, useState } from "react";
import { AuthUser, clearAccessToken, getAccessToken, getMe } from "../../lib/auth";

export default function AdminPage() {
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
        setStatus("Authenticated");
      })
      .catch(() => {
        clearAccessToken();
        window.location.href = "/login";
      });
  }, []);

  return (
    <main className="dashboard-shell">
      <p className="eyebrow">Admin</p>
      <h1>ShopWise Admin</h1>
      <p>{status}</p>
      {user ? <p>{user.email}</p> : null}
    </main>
  );
}

