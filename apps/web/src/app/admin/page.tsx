"use client";

import Link from "next/link";
import { AdminAuthGate } from "../../components/admin-auth-gate";

export default function AdminPage() {
  return (
    <AdminAuthGate>
      {(user) => (
        <main className="dashboard-shell">
          <p className="eyebrow">Admin</p>
          <h1>ShopWise Admin</h1>
          <p>{user.email}</p>
          <div className="admin-actions">
            <Link className="button-link" href="/admin/device-types">
              Device types
            </Link>
          </div>
        </main>
      )}
    </AdminAuthGate>
  );
}
