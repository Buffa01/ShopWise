"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { ClientAuthGate } from "../../../../components/client-auth-gate";
import { claimClientDevice } from "../../../../lib/devices";
import { useI18n } from "../../../../lib/i18n";

type ScannerStatus = "idle" | "starting" | "scanning" | "unsupported" | "error";

export default function AddDevicePage() {
  return (
    <ClientAuthGate>
      {() => <AddDeviceContent />}
    </ClientAuthGate>
  );
}

function AddDeviceContent() {
  const router = useRouter();
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const isClaimingRef = useRef(false);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>("idle");

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
    setIsSubmitting(true);

    try {
      const device = await claimClientDevice(code);
      stopScanner();
      router.push(`/app/devices/${device.id}`);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : t("client.claimDeviceError"));
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

  return (
    <main className="dashboard-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">{t("common.client")}</p>
          <h1>{t("client.addDeviceTitle")}</h1>
        </div>
        <Link href="/app/devices">{t("common.back")}</Link>
      </div>

      <section className="scanner-panel">
        <div>
          <p className="eyebrow">{t("client.scanDeviceEyebrow")}</p>
          <h2>{t("client.scanDeviceTitle")}</h2>
          <p>{t("client.scanDeviceDescription")}</p>
        </div>

        <div className="scanner-frame">
          <video aria-label={t("client.cameraPreview")} muted playsInline ref={videoRef} />
          {!isScanning ? <div className="scanner-placeholder">{t("client.cameraReady")}</div> : null}
          {scannerStatus === "starting" ? <div className="scanner-placeholder">{t("client.cameraStarting")}</div> : null}
          {scannerStatus === "scanning" ? <div className="scanner-reticle" /> : null}
        </div>

        <div className="scanner-actions">
          {!isScanning ? (
            <button className="button-link" disabled={isSubmitting} onClick={startScanner} type="button">
              {t("client.scanQr")}
            </button>
          ) : (
            <button className="button-secondary" onClick={stopScanner} type="button">
              {t("common.cancel")}
            </button>
          )}
        </div>
      </section>

      <form className="admin-form claim-form" onSubmit={onSubmit}>
        <label>
          {t("client.deviceCodeOrUrl")}
          <input
            autoComplete="off"
            onChange={(event) => setCodeInput(event.target.value)}
            placeholder="A000001 o http://192.168.1.13:3001/r/A000001"
            required
            value={codeInput}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? t("client.claimingDevice") : t("client.claimDevice")}
        </button>
      </form>
    </main>
  );
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
