type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  event: string;
  [key: string]: unknown;
}

export class StructuredLogger {
  info(payload: LogPayload) {
    this.write("info", payload);
  }

  warn(payload: LogPayload) {
    this.write("warn", payload);
  }

  error(payload: LogPayload) {
    this.write("error", payload);
  }

  private write(level: LogLevel, payload: LogPayload) {
    const entry = {
      level,
      timestamp: new Date().toISOString(),
      service: "shopwise-api",
      ...payload
    };

    const message = JSON.stringify(entry);

    if (level === "error") {
      console.error(message);
      return;
    }

    if (level === "warn") {
      console.warn(message);
      return;
    }

    console.log(message);
  }
}

export const structuredLogger = new StructuredLogger();
