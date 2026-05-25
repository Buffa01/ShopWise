"use client";

import { useI18n } from "../lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div aria-label={t("common.language")} className="language-selector">
      <span>{t("common.language")}</span>
      <div className="language-options">
        <button
          aria-label={t("common.spanish")}
          aria-pressed={locale === "es"}
          className={locale === "es" ? "is-active" : undefined}
          onClick={() => setLocale("es")}
          type="button"
        >
          ES
        </button>
        <button
          aria-label={t("common.english")}
          aria-pressed={locale === "en"}
          className={locale === "en" ? "is-active" : undefined}
          onClick={() => setLocale("en")}
          type="button"
        >
          EN
        </button>
      </div>
    </div>
  );
}
