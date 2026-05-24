import type { Metadata } from "next";
import { I18nProvider } from "../lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopWise",
  description: "Connected QR and NFC device platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
