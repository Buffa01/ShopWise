"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminAuthGate } from "../../../components/admin-auth-gate";
import {
  ProductionBatchItem,
  ProductionDeviceItem,
  ProductionOverview,
  cleanupExpiredAssets,
  deleteDeviceAssetFiles,
  getBatchPrintSheetUrl,
  getLatestPrintAssetUrl,
  listProduction,
  markBatchDownloaded,
  markBatchPrinted,
  markDeviceAssetDownloaded,
  markDevicePrinted,
  regenerateDeviceAssets
} from "../../../lib/devices";
import { Locale, formatDate, translateStatus, useI18n } from "../../../lib/i18n";

type ProductionTab = "singles" | "batches";
type TFunction = ReturnType<typeof useI18n>["t"];

export default function AdminProductionPage() {
  return (
    <AdminAuthGate>
      {() => <AdminProductionContent />}
    </AdminAuthGate>
  );
}

function AdminProductionContent() {
  const { locale, t } = useI18n();
  const [overview, setOverview] = useState<ProductionOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState<string | null>(null);
  const [tab, setTab] = useState<ProductionTab>("batches");
  const [query, setQuery] = useState("");

  function load() {
    setIsLoading(true);
    listProduction()
      .then(setOverview)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : t("admin.productionLoadError"));
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (overview && !overview.batches.length && overview.singles.length) {
      setTab("singles");
    }
  }, [overview]);

  const filteredSingles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!overview || !normalized) return overview?.singles ?? [];

    return overview.singles.filter((device) => productionDeviceMatches(device, normalized));
  }, [overview, query]);

  const filteredBatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!overview || !normalized) return overview?.batches ?? [];

    return overview.batches.filter((batch) => {
      return (
        batch.id.toLowerCase().includes(normalized) ||
        (batch.prefix ?? "").toLowerCase().includes(normalized) ||
        batch.devices.some((device) => productionDeviceMatches(device, normalized))
      );
    });
  }, [overview, query]);

  async function runMutation(key: string, action: () => Promise<unknown>) {
    setIsMutating(key);
    setError(null);
    try {
      await action();
      load();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : t("common.notSet"));
    } finally {
      setIsMutating(null);
    }
  }

  async function downloadDevicePdf(device: ProductionDeviceItem) {
    await runMutation(`download-${device.id}`, async () => {
      const response = await fetch(getLatestPrintAssetUrl(device.id), {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("shopwise_access_token") ?? ""}`
        }
      });

      if (!response.ok) throw new Error(t("admin.productionDownloadError"));

      const blob = await response.blob();
      triggerDownload(blob, `${device.publicCode}-device.pdf`);
      await markDeviceAssetDownloaded(device.id);
    });
  }

  async function downloadBatchSheet(batch: ProductionBatchItem) {
    await runMutation(`batch-download-${batch.id}`, async () => {
      const response = await fetch(getBatchPrintSheetUrl(batch.id), {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("shopwise_access_token") ?? ""}`
        }
      });

      if (!response.ok) throw new Error(t("admin.productionDownloadError"));

      const blob = await response.blob();
      triggerDownload(blob, `batch-${batch.id}-sheet.pdf`);
      await markBatchDownloaded(batch.id);
    });
  }

  const storageUsagePercent = overview
    ? Math.min(100, Math.round((Number(overview.storage.usedBytes) / Number(overview.storage.totalLimitBytes || "1")) * 100))
    : 0;

  return (
    <main className="dashboard-shell admin-production-page">
      <section className="admin-production-hero">
        <div>
          <p className="eyebrow">{t("admin.productionCenter")}</p>
          <h1>{t("admin.productionTitle")}</h1>
          <p>{t("admin.productionDescription")}</p>
        </div>
        <div className="admin-production-actions">
          <Link className="admin-primary-action" href="/admin/devices/new">
            {t("admin.newDevice")}
          </Link>
          <Link className="admin-secondary-action" href="/admin/devices/batch">
            {t("admin.newBatch")}
          </Link>
          <button
            className="admin-secondary-action"
            disabled={isMutating === "cleanup"}
            onClick={() => runMutation("cleanup", () => cleanupExpiredAssets(overview?.storage.retentionDays))}
            type="button"
          >
            {isMutating === "cleanup" ? t("common.loading") : t("admin.cleanupExpiredAssets")}
          </button>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="admin-production-summary" aria-label={t("admin.productionSummary")}>
        <AdminProductionStat label={t("admin.productionItems")} value={overview?.summary.totalItems} />
        <AdminProductionStat label={t("metrics.totalDevices")} value={overview?.summary.totalDevices} />
        <AdminProductionStat label={t("admin.productionGenerated")} value={overview?.summary.generatedDevices} />
        <AdminProductionStat label={t("admin.productionPrinted")} value={overview?.summary.printedDevices} />
      </section>

      <section className="admin-production-storage">
        <div>
          <span>{t("admin.assetRetentionPolicy")}</span>
        <strong>{overview ? `${overview.storage.retentionDays} ${t("common.days")}` : t("common.loading")}</strong>
          <p>{t("admin.assetRetentionDescription")}</p>
        </div>
        <div className="admin-production-storage-meter">
          <div>
            <span>{t("admin.storageUsage")}</span>
            <strong>{formatBytes(overview?.storage.usedBytes)} / {formatBytes(overview?.storage.totalLimitBytes)}</strong>
          </div>
          <div className="admin-production-meter-track">
            <span style={{ width: `${storageUsagePercent}%` }} />
          </div>
          <small>{storageUsagePercent}%</small>
        </div>
      </section>

      <section className="admin-production-panel">
        <div className="admin-production-panel-heading">
          <div>
            <span>{t("admin.productionQueue")}</span>
            <strong>{isLoading ? t("common.loading") : tab === "batches" ? `${filteredBatches.length} ${t("admin.batches").toLowerCase()}` : `${filteredSingles.length} ${t("common.devices").toLowerCase()}`}</strong>
          </div>
          <p>{t("admin.productionQueueDescription")}</p>
        </div>

        <div className="admin-production-toolbar">
          <div className="admin-production-tabs">
            <button className={tab === "batches" ? "is-active" : ""} onClick={() => setTab("batches")} type="button">
              {t("admin.batches")}
            </button>
            <button className={tab === "singles" ? "is-active" : ""} onClick={() => setTab("singles")} type="button">
              {t("admin.singleCreations")}
            </button>
          </div>
          <label>
            {t("common.search")}
            <input onChange={(event) => setQuery(event.target.value)} placeholder={t("admin.productionSearchPlaceholder")} value={query} />
          </label>
        </div>

        {tab === "batches" ? (
          <div className="admin-production-list">
            {filteredBatches.map((batch) => (
              <ProductionBatchCard
                batch={batch}
                isMutating={isMutating}
                key={batch.id}
                locale={locale}
                onDownload={() => downloadBatchSheet(batch)}
                onMarkPrinted={() => runMutation(`batch-print-${batch.id}`, () => markBatchPrinted(batch.id))}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="admin-production-list">
            {filteredSingles.map((device) => (
              <ProductionDeviceCard
                device={device}
                isMutating={isMutating}
                key={device.id}
                locale={locale}
                onDeleteAssets={() => runMutation(`delete-${device.id}`, () => deleteDeviceAssetFiles(device.id))}
                onDownload={() => downloadDevicePdf(device)}
                onMarkPrinted={() => runMutation(`print-${device.id}`, () => markDevicePrinted(device.id))}
                onRegenerate={() => runMutation(`regen-${device.id}`, () => regenerateDeviceAssets(device.id))}
                t={t}
              />
            ))}
          </div>
        )}

        {!isLoading && tab === "batches" && !filteredBatches.length ? <ProductionEmpty t={t} /> : null}
        {!isLoading && tab === "singles" && !filteredSingles.length ? <ProductionEmpty t={t} /> : null}
      </section>
    </main>
  );
}

function ProductionBatchCard({
  batch,
  isMutating,
  locale,
  onDownload,
  onMarkPrinted,
  t
}: {
  batch: ProductionBatchItem;
  isMutating: string | null;
  locale: Locale;
  onDownload: () => void;
  onMarkPrinted: () => void;
  t: TFunction;
}) {
  return (
    <article className="admin-production-card">
      <div className="admin-production-card-main">
        <span>{t("admin.batch")}</span>
        <strong>{batch.prefix ? `${batch.prefix} · ${batch.id.slice(0, 8)}` : batch.id.slice(0, 8)}</strong>
        <p>{batch.quantity} {t("common.devices").toLowerCase()} · {formatDate(locale, batch.createdAt)}</p>
      </div>
      <ProductionProgress counts={batch.counts} t={t} />
      <div className="admin-production-card-actions">
        <button className="admin-secondary-action" disabled={isMutating === `batch-download-${batch.id}`} onClick={onDownload} type="button">
          {t("admin.downloadPrintSheet")}
        </button>
        <button className="admin-secondary-action" disabled={isMutating === `batch-print-${batch.id}`} onClick={onMarkPrinted} type="button">
          {t("admin.markPrinted")}
        </button>
      </div>
    </article>
  );
}

function ProductionDeviceCard({
  device,
  isMutating,
  locale,
  onDeleteAssets,
  onDownload,
  onMarkPrinted,
  onRegenerate,
  t
}: {
  device: ProductionDeviceItem;
  isMutating: string | null;
  locale: Locale;
  onDeleteAssets: () => void;
  onDownload: () => void;
  onMarkPrinted: () => void;
  onRegenerate: () => void;
  t: TFunction;
}) {
  return (
    <article className="admin-production-card">
      <div className="admin-production-card-main">
        <span>{device.deviceTypeName}</span>
        <strong>{device.publicCode}</strong>
        <p>{device.businessName ?? t("common.noClient")} · {formatDate(locale, device.createdAt)}</p>
      </div>
      <div className="admin-production-status-line">
        <ProductionStep active label={t("status.CREATED")} />
        <ProductionStep active={device.hasAsset} label={t("status.ASSET_GENERATED")} />
        <ProductionStep active={device.productionStatus === "DOWNLOADED" || device.productionStatus === "PRINTED"} label={t("status.DOWNLOADED")} />
        <ProductionStep active={device.productionStatus === "PRINTED"} label={t("status.PRINTED")} />
        <ProductionStep active={device.isConfigured} label={t("common.configured")} />
      </div>
      <div className="admin-production-asset-meta">
        <span>{translateStatus(t, device.productionStatus)}</span>
        <span>{device.latestAsset?.pdfKey ?? t("admin.assetCanRegenerate")}</span>
      </div>
      <div className="admin-production-card-actions">
        <Link className="admin-secondary-action" href={`/admin/devices/${device.id}`}>
          {t("common.view")}
        </Link>
        <button className="admin-secondary-action" disabled={!device.hasAsset || isMutating === `download-${device.id}`} onClick={onDownload} type="button">
          {t("admin.downloadPdf")}
        </button>
        <button className="admin-secondary-action" disabled={isMutating === `print-${device.id}`} onClick={onMarkPrinted} type="button">
          {t("admin.markPrinted")}
        </button>
        <button className="admin-secondary-action" disabled={isMutating === `regen-${device.id}`} onClick={onRegenerate} type="button">
          {t("admin.regenerateAsset")}
        </button>
        <button className="admin-danger-action" disabled={!device.hasAsset || isMutating === `delete-${device.id}`} onClick={onDeleteAssets} type="button">
          {t("admin.deleteAssets")}
        </button>
      </div>
    </article>
  );
}

function ProductionProgress({ counts, t }: { counts: ProductionBatchItem["counts"]; t: TFunction }) {
  return (
    <div className="admin-production-progress">
      <ProductionRatio label={t("admin.productionGenerated")} total={counts.total} value={counts.generated} />
      <ProductionRatio label={t("admin.productionDownloaded")} total={counts.total} value={counts.downloaded} />
      <ProductionRatio label={t("admin.productionPrinted")} total={counts.total} value={counts.printed} />
      <ProductionRatio label={t("common.configured")} total={counts.total} value={counts.configured} />
    </div>
  );
}

function ProductionRatio({ label, total, value }: { label: string; total: number; value: number }) {
  return (
    <div className="admin-production-ratio">
      <span>{label}</span>
      <strong>{value}/{total}</strong>
    </div>
  );
}

function ProductionStep({ active, label }: { active: boolean; label: string }) {
  return <span className={active ? "is-active" : ""}>{label}</span>;
}

function AdminProductionStat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="admin-production-stat">
      <span>{label}</span>
      <strong>{typeof value === "number" ? value : "..."}</strong>
    </div>
  );
}

function ProductionEmpty({ t }: { t: TFunction }) {
  return (
    <div className="admin-production-empty">
      <strong>{t("admin.productionEmptyTitle")}</strong>
      <p>{t("admin.productionEmptyDescription")}</p>
      <Link className="admin-primary-action" href="/admin/devices/new">
        {t("admin.newDevice")}
      </Link>
    </div>
  );
}

function productionDeviceMatches(device: ProductionDeviceItem, normalized: string) {
  return [device.publicCode, device.deviceTypeName, device.businessName, device.latestAsset?.pdfKey]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalized));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatBytes(value: string | undefined) {
  if (!value) return "...";
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return "...";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
