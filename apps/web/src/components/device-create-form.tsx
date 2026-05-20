"use client";

import { FormEvent, useEffect, useState } from "react";
import { DeviceType, listDeviceTypes } from "../lib/device-types";

interface DeviceCreateFormProps {
  mode: "single" | "batch";
  submitLabel: string;
  onSubmit: (input: { deviceTypeId: string; prefix?: string; quantity?: number }) => Promise<void>;
}

export function DeviceCreateForm({ mode, submitLabel, onSubmit }: DeviceCreateFormProps) {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listDeviceTypes()
      .then((types) => {
        const activeTypes = types.filter((type) => type.isActive);
        setDeviceTypes(activeTypes);
        setDeviceTypeId(activeTypes[0]?.id ?? "");
        setPrefix(activeTypes[0]?.defaultPrefix ?? "");
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load device types");
      });
  }, []);

  function handleDeviceTypeChange(nextId: string) {
    setDeviceTypeId(nextId);
    const selectedType = deviceTypes.find((type) => type.id === nextId);
    setPrefix(selectedType?.defaultPrefix ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        deviceTypeId,
        prefix: prefix || undefined,
        quantity: mode === "batch" ? quantity : undefined
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create device");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label>
        Device type
        <select
          onChange={(event) => handleDeviceTypeChange(event.target.value)}
          required
          value={deviceTypeId}
        >
          {deviceTypes.map((deviceType) => (
            <option key={deviceType.id} value={deviceType.id}>
              {deviceType.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Prefix
        <input
          maxLength={12}
          onChange={(event) => setPrefix(event.target.value.toUpperCase())}
          pattern="^[A-Z0-9]*$"
          value={prefix}
        />
      </label>

      {mode === "batch" ? (
        <label>
          Quantity
          <input
            max={500}
            min={1}
            onChange={(event) => setQuantity(Number(event.target.value))}
            required
            type="number"
            value={quantity}
          />
        </label>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <button disabled={isSubmitting || !deviceTypeId} type="submit">
        {isSubmitting ? "Creating..." : submitLabel}
      </button>
    </form>
  );
}

