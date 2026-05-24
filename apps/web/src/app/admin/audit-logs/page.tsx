"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import { AuditLogEntry, listAuditLogs } from "../../../lib/audit-logs";
import { formatDateTime, useI18n } from "../../../lib/i18n";

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
  const { t } = useI18n();

  return (
    <main className="dashboard-shell">
      <p>{t("common.loading")}</p>
    </main>
  );
}

function AuditLogsContent() {
  const searchParams = useSearchParams();
  const { locale, t } = useI18n();
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
        setError(loadError instanceof Error ? loadError.message : t("admin.loadAuditLogsError"));
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
          <p className="eyebrow">{t("common.admin")}</p>
          <h1>{t("common.auditLogs")}</h1>
        </div>
        <Link href="/admin">{t("common.back")}</Link>
      </div>

      <form className="admin-form filter-form" onSubmit={onFilter}>
        <label>
          {t("admin.auditAction")}
          <input onChange={(event) => setAction(event.target.value)} placeholder="ADMIN_DEVICE_UPDATE" value={action} />
        </label>
        <label>
          {t("admin.deviceId")}
          <input onChange={(event) => setDeviceId(event.target.value)} value={deviceId} />
        </label>
        <label>
          {t("admin.businessId")}
          <input onChange={(event) => setBusinessId(event.target.value)} value={businessId} />
        </label>
        <label>
          {t("admin.actorUserId")}
          <input onChange={(event) => setActorUserId(event.target.value)} value={actorUserId} />
        </label>
        <button type="submit">{t("admin.applyFilters")}</button>
      </form>

      {isLoading ? <p>{t("common.loading")}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-list">
        {logs.map((log) => (
          <div className="table-row audit-row" key={log.id}>
            <div>
              <strong>{log.action}</strong>
              <span>{formatDateTime(locale, log.createdAt)}</span>
            </div>
            <div>
              <strong>{log.actor?.email ?? t("common.system")}</strong>
              <span>{log.actor?.role ?? t("common.noActor")}</span>
            </div>
            <div>
              <strong>{log.deviceId ? shortId(log.deviceId) : t("common.device")}</strong>
              <span>{log.businessId ? `${t("common.business")} ${shortId(log.businessId)}` : t("common.noBusiness")}</span>
            </div>
            <div>
              <strong>{t("admin.changes")}</strong>
              <span>{summarizeChanges(log, t)}</span>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && !logs.length ? <p>{t("admin.noAuditLogs")}</p> : null}
    </main>
  );
}

function summarizeChanges(log: AuditLogEntry, t: ReturnType<typeof useI18n>["t"]) {
  if (!log.before || !log.after) {
    return t("admin.noBeforeAfter");
  }

  const keys = Object.keys(log.after).filter((key) => JSON.stringify(log.before?.[key]) !== JSON.stringify(log.after?.[key]));

  if (!keys.length) {
    return t("admin.noChangedFields");
  }

  return keys.slice(0, 4).join(", ");
}

function shortId(value: string) {
  return value.slice(0, 8);
}
