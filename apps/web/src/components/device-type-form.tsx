"use client";

import { FormEvent, useMemo, useState } from "react";
import type { DeviceType, DeviceTypeInput } from "../lib/device-types";
import { useI18n } from "../lib/i18n";

interface DeviceTypeFormProps {
  initialValue?: DeviceType;
  submitLabel: string;
  onSubmit: (input: DeviceTypeInput) => Promise<void>;
}

export function DeviceTypeForm({ initialValue, submitLabel, onSubmit }: DeviceTypeFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialValue?.name ?? "");
  const [slug, setSlug] = useState(initialValue?.slug ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [isActive, setIsActive] = useState(initialValue?.isActive ?? true);
  const [defaultPrefix, setDefaultPrefix] = useState(initialValue?.defaultPrefix ?? "");
  const [templateKey, setTemplateKey] = useState(initialValue?.templateKey ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const derivedSlug = useMemo(() => slugify(name), [name]);

  function fillSlug() {
    if (!slug) {
      setSlug(derivedSlug);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        name,
        slug,
        description: description || undefined,
        isActive,
        defaultPrefix: defaultPrefix || undefined,
        templateKey: templateKey || undefined
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("admin.saveDeviceTypeError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label>
        {t("common.name")}
        <input
          onBlur={fillSlug}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>

      <label>
        {t("admin.slug")}
        <input
          onChange={(event) => setSlug(event.target.value)}
          pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
          required
          value={slug}
        />
      </label>

      <label>
        {t("common.description")}
        <textarea onChange={(event) => setDescription(event.target.value)} rows={3} value={description} />
      </label>

      <label className="checkbox-row">
        <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
        {t("common.active")}
      </label>

      <label>
        {t("admin.defaultPrefix")}
        <input
          maxLength={12}
          onChange={(event) => setDefaultPrefix(event.target.value.toUpperCase())}
          pattern="^[A-Z0-9]*$"
          value={defaultPrefix}
        />
      </label>

      <label>
        {t("admin.templateKey")}
        <input onChange={(event) => setTemplateKey(event.target.value)} value={templateKey} />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? t("common.saving") : submitLabel}
      </button>
    </form>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
