"use client";

import { PointerEvent, useEffect, useRef, useState } from "react";
import {
  DeviceType,
  StickerQrPosition,
  getDeviceTypeDesignUrl,
  updateDeviceType,
  uploadDeviceTypeDesign
} from "../lib/device-types";
import { useI18n } from "../lib/i18n";

const DEFAULT_STICKER_SIZE_MM = 100;
const DEFAULT_QR_SIZE_MM = 32;

interface StickerTemplateEditorProps {
  deviceType: DeviceType;
  onChange: (deviceType: DeviceType) => void;
}

export function StickerTemplateEditor({ deviceType, onChange }: StickerTemplateEditorProps) {
  const { t } = useI18n();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDesignUrl, setSelectedDesignUrl] = useState<string | null>(null);
  const [stickerSizeMm, setStickerSizeMm] = useState(getInitialPosition(deviceType).sticker.widthMm);
  const [qrWidthMm, setQrWidthMm] = useState(getInitialPosition(deviceType).qr.widthMm);
  const [qrHeightMm, setQrHeightMm] = useState(getInitialPosition(deviceType).qr.heightMm);
  const [xMm, setXMm] = useState(getInitialPosition(deviceType).qr.xMm);
  const [yMm, setYMm] = useState(getInitialPosition(deviceType).qr.yMm);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    if (!deviceType.baseDesignKey) {
      setDesignUrl(null);
      return;
    }

    getDeviceTypeDesignUrl(deviceType.id)
      .then((url) => {
        objectUrl = url;
        setDesignUrl(url);
      })
      .catch(() => setDesignUrl(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [deviceType.baseDesignKey, deviceType.id]);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedDesignUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setSelectedDesignUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const qrStyle = {
    left: `${(xMm / stickerSizeMm) * 100}%`,
    top: `${(yMm / stickerSizeMm) * 100}%`,
    width: `${(qrWidthMm / stickerSizeMm) * 100}%`,
    height: `${(qrHeightMm / stickerSizeMm) * 100}%`
  };

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!(event.buttons & 1)) {
      return;
    }

    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const nextX = ((event.clientX - bounds.left) / bounds.width) * stickerSizeMm - qrWidthMm / 2;
    const nextY = ((event.clientY - bounds.top) / bounds.height) * stickerSizeMm - qrHeightMm / 2;

    setXMm(roundMm(clamp(nextX, 0, stickerSizeMm - qrWidthMm)));
    setYMm(roundMm(clamp(nextY, 0, stickerSizeMm - qrHeightMm)));
  }

  function onStickerSizeChange(value: string) {
    const nextSize = clamp(Number(value), 20, 300);
    setStickerSizeMm(nextSize);
    setXMm((current) => roundMm(clamp(current, 0, nextSize - qrWidthMm)));
    setYMm((current) => roundMm(clamp(current, 0, nextSize - qrHeightMm)));
  }

  function onQrWidthChange(value: string) {
    const nextWidth = clamp(Number(value), 5, stickerSizeMm);
    setQrWidthMm(nextWidth);
    setXMm((current) => roundMm(clamp(current, 0, stickerSizeMm - nextWidth)));
  }

  function onQrHeightChange(value: string) {
    const nextHeight = clamp(Number(value), 5, stickerSizeMm);
    setQrHeightMm(nextHeight);
    setYMm((current) => roundMm(clamp(current, 0, stickerSizeMm - nextHeight)));
  }

  async function saveTemplate() {
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      let updated = deviceType;

      if (selectedFile) {
        updated = await uploadDeviceTypeDesign(deviceType.id, {
          contentType: toSupportedContentType(selectedFile.type, t("template.unsupportedType")),
          fileName: selectedFile.name,
          dataUrl: await readFileAsDataUrl(selectedFile)
        });
      }

      updated = await updateDeviceType(updated.id, {
        qrPosition: buildQrPosition({
          stickerSizeMm,
          qrWidthMm,
          qrHeightMm,
          xMm,
          yMm
        })
      });

      setSelectedFile(null);
      onChange(updated);
      setSuccessMessage(t("template.saved"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("template.saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="template-editor">
      <div className="template-editor-heading">
        <div>
          <p className="eyebrow">{t("template.title")}</p>
          <h2>{t("template.qrPlacement")}</h2>
        </div>
        <p>{t("template.editorDescription")}</p>
      </div>

      <div className="template-editor-grid">
        <div className="template-preview-panel">
          <div className="template-preview-toolbar">
            <div>
              <span>{t("template.printPreview")}</span>
              <strong>{stickerSizeMm}mm x {stickerSizeMm}mm</strong>
            </div>
            <span>{selectedFile ? t("template.localPreview") : designUrl ? t("template.savedDesign") : t("template.noDesign")}</span>
          </div>

          <div className="template-preview-stage">
            <div className="template-preview" ref={previewRef}>
              {selectedDesignUrl ? (
                <img alt={t("template.uploadDesign")} src={selectedDesignUrl} />
              ) : designUrl ? (
                <img alt={t("template.title")} src={designUrl} />
              ) : (
                <div className="template-preview-empty">
                  <span>{t("template.uploadDesign")}</span>
                  <small>{t("template.uploadDesignHint")}</small>
                </div>
              )}
              <div
                className="qr-placement-box"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                role="presentation"
                style={qrStyle}
              >
                <span>QR</span>
              </div>
            </div>
          </div>

          <div className="template-preview-facts">
            <TemplateFact label="X" value={`${xMm}mm`} />
            <TemplateFact label="Y" value={`${yMm}mm`} />
            <TemplateFact label={t("template.qrSize")} value={`${qrWidthMm} x ${qrHeightMm}mm`} />
          </div>
        </div>

        <div className="admin-form template-controls">
          <div className="template-controls-heading">
            <span>{t("template.controls")}</span>
            <strong>{t("template.printSetup")}</strong>
            <p>{t("template.controlsDescription")}</p>
          </div>

          <label>
            {t("template.baseDesign")}
            <input
              accept="image/png,image/jpeg"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>

          {selectedFile ? (
            <div className="template-selected-file">
              <span>{t("template.selectedFile")}</span>
              <strong>{selectedFile.name}</strong>
            </div>
          ) : null}

          <div className="template-controls-grid">
            <label>
              {t("template.deviceDiameter")}
              <input min={20} onChange={(event) => onStickerSizeChange(event.target.value)} type="number" value={stickerSizeMm} />
            </label>
            <label>
              {t("template.qrWidth")}
              <input min={5} onChange={(event) => onQrWidthChange(event.target.value)} type="number" value={qrWidthMm} />
            </label>
            <label>
              {t("template.qrHeight")}
              <input min={5} onChange={(event) => onQrHeightChange(event.target.value)} type="number" value={qrHeightMm} />
            </label>
          </div>

          <div className="template-controls-actions">
            <button className="admin-secondary-action" onClick={() => centerQr(stickerSizeMm, qrWidthMm, qrHeightMm, setXMm, setYMm)} type="button">
              {t("template.centerQr")}
            </button>
            <button className="admin-primary-action" disabled={isSaving} onClick={saveTemplate} type="button">
              {isSaving ? t("common.saving") : t("template.save")}
            </button>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}

function TemplateFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getInitialPosition(deviceType: DeviceType): StickerQrPosition {
  const parsed = deviceType.qrPosition as Partial<StickerQrPosition> | null;
  if (parsed?.unit === "mm" && parsed.sticker && parsed.qr) {
    return {
      unit: "mm",
      sticker: {
        shape: parsed.sticker.shape === "rectangle" ? "rectangle" : "circle",
        widthMm: Number(parsed.sticker.widthMm) || DEFAULT_STICKER_SIZE_MM,
        heightMm: Number(parsed.sticker.heightMm) || DEFAULT_STICKER_SIZE_MM,
        diameterMm: Number(parsed.sticker.diameterMm) || DEFAULT_STICKER_SIZE_MM
      },
      qr: {
        xMm: Number(parsed.qr.xMm) || 34,
        yMm: Number(parsed.qr.yMm) || 34,
        widthMm: Number(parsed.qr.widthMm) || DEFAULT_QR_SIZE_MM,
        heightMm: Number(parsed.qr.heightMm) || DEFAULT_QR_SIZE_MM
      }
    };
  }

  return buildQrPosition({
    stickerSizeMm: DEFAULT_STICKER_SIZE_MM,
    qrWidthMm: DEFAULT_QR_SIZE_MM,
    qrHeightMm: DEFAULT_QR_SIZE_MM,
    xMm: 34,
    yMm: 34
  });
}

function buildQrPosition(input: {
  stickerSizeMm: number;
  qrWidthMm: number;
  qrHeightMm: number;
  xMm: number;
  yMm: number;
}): StickerQrPosition {
  return {
    unit: "mm",
    sticker: {
      shape: "circle",
      widthMm: input.stickerSizeMm,
      heightMm: input.stickerSizeMm,
      diameterMm: input.stickerSizeMm
    },
    qr: {
      xMm: input.xMm,
      yMm: input.yMm,
      widthMm: input.qrWidthMm,
      heightMm: input.qrHeightMm
    }
  };
}

function centerQr(
  stickerSizeMm: number,
  qrWidthMm: number,
  qrHeightMm: number,
  setXMm: (value: number) => void,
  setYMm: (value: number) => void
) {
  setXMm(roundMm((stickerSizeMm - qrWidthMm) / 2));
  setYMm(roundMm((stickerSizeMm - qrHeightMm) / 2));
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), Math.max(min, max));
}

function roundMm(value: number) {
  return Math.round(value * 10) / 10;
}

function toSupportedContentType(value: string, errorMessage: string): "image/png" | "image/jpeg" {
  if (value === "image/png" || value === "image/jpeg") {
    return value;
  }

  throw new Error(errorMessage);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
