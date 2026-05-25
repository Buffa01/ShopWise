"use client";

import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      aria-label={t("common.theme")}
      aria-pressed={isDark}
      className="public-theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span>{isDark ? "☾" : "☀"}</span>
      <strong>{isDark ? t("common.lightMode") : t("common.darkMode")}</strong>
    </button>
  );
}
