"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { ClientAuthGate } from "../../../../components/client-auth-gate";
import { ClientDashboardShell } from "../../../../components/client-dashboard-shell";
import { AuthUser } from "../../../../lib/auth";
import { claimClientDevice } from "../../../../lib/devices";
import { useI18n } from "../../../../lib/i18n";

type ScannerStatus = "idle" | "starting" | "scanning" | "unsupported" | "error";
type ClaimStatus = "idle" | "validating" | "success";

export default function AddDevicePage() {
  return (
    <ClientAuthGate>
      {(user) => <AddDeviceContent user={user} />}
    </ClientAuthGate>
  );
}

function AddDeviceContent({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const isClaimingRef = useRef(false);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("idle");

  useEffect(() => {
    return () => stopScanner();
  }, []);

  async function claimCode(rawValue: string) {
    if (isClaimingRef.current) return;

    const code = extractDeviceCode(rawValue);
    if (!code) {
      setError(t("client.invalidDeviceCode"));
      return;
    }

    isClaimingRef.current = true;
    setError(null);
    setClaimStatus("validating");
    setIsSubmitting(true);

    try {
      const device = await claimClientDevice(code);
      stopScanner();
      setClaimStatus("success");
      window.setTimeout(() => router.push(`/app/devices/${device.id}`), 450);
    } catch (claimError) {
      setError(getClaimErrorMessage(claimError, t));
      setClaimStatus("idle");
      isClaimingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await claimCode(codeInput);
  }

  async function startScanner() {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerStatus("unsupported");
      setError(t("client.cameraUnsupported"));
      return;
    }

    setScannerStatus("starting");

    try {
      const video = videoRef.current;
      if (!video) return;

      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" }
          }
        },
        video,
        (result) => {
          const text = result?.getText();
          if (text) {
            void claimCode(text);
          }
        }
      );
      scannerControlsRef.current = controls;
      setScannerStatus("scanning");
    } catch {
      setScannerStatus("error");
      setError(t("client.cameraPermissionError"));
      stopScanner();
    }
  }

  function stopScanner() {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setScannerStatus("idle");
  }

  const isScanning = scannerStatus === "starting" || scannerStatus === "scanning";
  const extractedCode = codeInput ? extractDeviceCode(codeInput) : "";

  return (
    <ClientDashboardShell
      actions={
        <Link className="client-secondary-action" href="/app/devices">
          {t("common.back")}
        </Link>
      }
      description={t("client.addDeviceDescription")}
      eyebrow={t("client.scanDeviceEyebrow")}
      title={t("client.addDeviceTitle")}
      user={user}
    >
      <section className="client-claim-flow">
        <div className="client-claim-steps" aria-label={t("client.claimStepsLabel")}>
          <div>
            <span>1</span>
            <strong>{t("client.claimStepScan")}</strong>
          </div>
          <div>
            <span>2</span>
            <strong>{t("client.claimStepValidate")}</strong>
          </div>
          <div>
            <span>3</span>
            <strong>{t("client.claimStepConfigure")}</strong>
          </div>
        </div>

        <div className="client-claim-grid">
          <section className="scanner-panel">
            <div>
              <p className="client-eyebrow">{t("client.scanDeviceEyebrow")}</p>
              <h2>{t("client.scanDeviceTitle")}</h2>
              <p>{t("client.scanDeviceDescription")}</p>
            </div>

            <div className={`scanner-frame is-${scannerStatus}`}>
              <video aria-label={t("client.cameraPreview")} muted playsInline ref={videoRef} />
              {!isScanning ? (
                <div className="scanner-placeholder">
                  <span>{scannerStatus === "unsupported" || scannerStatus === "error" ? "!" : "QR"}</span>
                  <strong>{getScannerTitle(scannerStatus, t)}</strong>
                  <small>{getScannerDescription(scannerStatus, t)}</small>
                </div>
              ) : null}
              {scannerStatus === "starting" ? (
                <div className="scanner-placeholder">
                  <span>...</span>
                  <strong>{t("client.cameraStarting")}</strong>
                </div>
              ) : null}
              {scannerStatus === "scanning" ? <div className="scanner-reticle" /> : null}
            </div>

            <div className="scanner-actions">
              {!isScanning ? (
                <button className="client-primary-action" disabled={isSubmitting} onClick={startScanner} type="button">
                  {t("client.scanQr")}
                </button>
              ) : (
                <button className="client-secondary-action" onClick={stopScanner} type="button">
                  {t("common.cancel")}
                </button>
              )}
            </div>
          </section>

          <section className="client-manual-claim">
            <div>
              <p className="client-eyebrow">{t("client.manualClaimEyebrow")}</p>
              <h2>{t("client.manualClaimTitle")}</h2>
              <p>{t("client.manualClaimDescription")}</p>
            </div>

            <form className="admin-form claim-form" onSubmit={onSubmit}>
              <label>
                {t("client.deviceCodeOrUrl")}
                <input
                  autoComplete="off"
                  onChange={(event) => {
                    setCodeInput(event.target.value);
                    setError(null);
                  }}
                  placeholder="A000001 o http://192.168.1.13:3001/r/A000001"
                  required
                  value={codeInput}
                />
              </label>

              {extractedCode ? (
                <div className="client-code-preview">
                  <span>{t("client.detectedCode")}</span>
                  <strong>{extractedCode}</strong>
                </div>
              ) : null}

              {error ? <p className="form-error">{error}</p> : null}
              {claimStatus === "success" ? <p className="form-success">{t("client.claimDeviceSuccess")}</p> : null}

              <button disabled={isSubmitting} type="submit">
                {isSubmitting ? t("client.claimingDevice") : t("client.claimDevice")}
              </button>
            </form>
          </section>
        </div>
      </section>
    </ClientDashboardShell>
  );
}

function getScannerTitle(status: ScannerStatus, t: ReturnType<typeof useI18n>["t"]) {
  if (status === "unsupported" || status === "error") return t("client.cameraFallbackTitle");
  return t("client.cameraReadyTitle");
}

function getScannerDescription(status: ScannerStatus, t: ReturnType<typeof useI18n>["t"]) {
  if (status === "unsupported") return t("client.cameraUnsupported");
  if (status === "error") return t("client.cameraPermissionError");
  return t("client.cameraReady");
}

function getClaimErrorMessage(error: unknown, t: ReturnType<typeof useI18n>["t"]) {
  const message = error instanceof Error ? error.message : "";

  if (/already has an owner|DEVICE_ALREADY_ASSIGNED/i.test(message)) {
    return t("client.claimAlreadyAssigned");
  }

  if (/not found|DEVICE_NOT_FOUND/i.test(message)) {
    return t("client.claimNotFound");
  }

  if (/cannot be claimed|DEVICE_NOT_CLAIMABLE/i.test(message)) {
    return t("client.claimNotClaimable");
  }

  return message || t("client.claimDeviceError");
}

function extractDeviceCode(value: string) {
  const trimmed = value.trim().toUpperCase();

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const shortLinkIndex = segments.findIndex((segment) => segment === "R" || segment === "N");
    const code = shortLinkIndex >= 0 ? segments[shortLinkIndex + 1] : segments.at(-1);

    if (code) {
      return code.replace(/[^A-Z0-9]/g, "");
    }
  } catch {
    // Plain codes are accepted below.
  }

  return trimmed.replace(/[^A-Z0-9]/g, "");
}
