"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { AuditLogEntry, listAuditLogs } from "../../../lib/audit-logs";

export default function AuditLogsPage() {
  return (
    <AdminAuthGate>
      {() => (
        <Suspense fallback={<AuditLogsLoading />}>
          <AuditLogsContent />
        </Suspense>
      )}
    </AdminAuthGate>
  );
}

function AuditLogsLoading() {
  return (
    <main className="dashboard-shell">
      <p>Loading...</p>
    </main>
  );
}

function AuditLogsContent() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [action, setAction] = useState(searchParams.get("action") ?? "");
  const [deviceId, setDeviceId] = useState(searchParams.get("deviceId") ?? "");
  const [businessId, setBusinessId] = useState(searchParams.get("businessId") ?? "");
  const [actorUserId, setActorUserId] = useState(searchParams.get("actorUserId") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function loadLogs() {
    setIsLoading(true);
    setError(null);
    listAuditLogs({
      action,
      deviceId,
      businessId,
      actorUserId
    })
      .then(setLogs)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load audit logs");
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadLogs();
  }

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Audit logs</h1>
        </div>
        <Link href="/admin">Back</Link>
      </div>

      <form className="admin-form filter-form" onSubmit={onFilter}>
        <label>
          Action
          <input onChange={(event) => setAction(event.target.value)} placeholder="ADMIN_DEVICE_UPDATE" value={action} />
        </label>
        <label>
          Device ID
          <input onChange={(event) => setDeviceId(event.target.value)} value={deviceId} />
        </label>
        <label>
          Business ID
          <input onChange={(event) => setBusinessId(event.target.value)} value={businessId} />
        </label>
        <label>
          Actor user ID
          <input onChange={(event) => setActorUserId(event.target.value)} value={actorUserId} />
        </label>
        <button type="submit">Apply filters</button>
      </form>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-list">
        {logs.map((log) => (
          <div className="table-row audit-row" key={log.id}>
            <div>
              <strong>{log.action}</strong>
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <strong>{log.actor?.email ?? "System"}</strong>
              <span>{log.actor?.role ?? "No actor"}</span>
            </div>
            <div>
              <strong>{log.deviceId ? shortId(log.deviceId) : "No device"}</strong>
              <span>{log.businessId ? `Business ${shortId(log.businessId)}` : "No business"}</span>
            </div>
            <div>
              <strong>Changes</strong>
              <span>{summarizeChanges(log)}</span>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && !logs.length ? <p>No audit logs found.</p> : null}
    </main>
  );
}

function summarizeChanges(log: AuditLogEntry) {
  if (!log.before || !log.after) {
    return "No before/after data";
  }

  const keys = Object.keys(log.after).filter((key) => JSON.stringify(log.before?.[key]) !== JSON.stringify(log.after?.[key]));

  if (!keys.length) {
    return "No changed fields";
  }

  return keys.slice(0, 4).join(", ");
}

function shortId(value: string) {
  return value.slice(0, 8);
}
