export const SHOPWISE_API_PREFIX = "/v1";

export const DEVICE_SHORT_PATHS = {
  qr: "/r",
  nfc: "/n"
} as const;

export type DeviceEventSource = "QR" | "NFC" | "UNKNOWN" | "SYSTEM";

