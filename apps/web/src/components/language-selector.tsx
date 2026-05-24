"use client";

import { useI18n } from "../lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="language-selector">
      <span>{t("common.language")}</span>
      <select onChange={(event) => setLocale(event.target.value as "es" | "en")} value={locale}>
        <option value="es">{t("common.spanish")}</option>
        <option value="en">{t("common.english")}</option>
      </select>
    </label>
  );
}
