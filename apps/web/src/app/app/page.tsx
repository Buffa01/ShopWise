"use client";

import Link from "next/link";
import { ClientAuthGate } from "../../components/client-auth-gate";

export default function ClientAppPage() {
  return (
    <ClientAuthGate>
      {(user) => (
        <main className="dashboard-shell">
          <p className="eyebrow">Client</p>
          <h1>My ShopWise</h1>
          <p>{user.email}</p>
          <div className="admin-actions">
            <Link className="button-link" href="/app/devices">
              My devices
            </Link>
            <Link className="button-link" href="/app/devices/add">
              Add device
            </Link>
            <Link className="button-link" href="/app/metrics">
              Metrics
            </Link>
          </div>
        </main>
      )}
    </ClientAuthGate>
  );
}
