export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/v1";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const fallback: ApiError = {
      error: {
        code: "REQUEST_FAILED",
        message: "Request failed"
      }
    };
    const payload = (await response.json().catch(() => fallback)) as ApiError;
    throw new Error(payload.error?.message ?? fallback.error.message);
  }

  return response.json() as Promise<TResponse>;
}

