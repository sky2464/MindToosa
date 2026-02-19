/**
 * MindToosa API Client
 *
 * A typed wrapper around fetch for consistent API calls and error handling.
 * Transparently unwraps the standard { data, meta, __envelope } response envelope.
 */

import { ApiError } from "./errors";
import type { PaginationMeta } from "./apiEnvelope";

export interface ListResult<T> {
  data: T;
  meta: PaginationMeta | null;
}

// Internal: detect and unwrap the standard API envelope
function unwrap<T>(json: unknown): T {
  if (
    json !== null &&
    typeof json === "object" &&
    "__envelope" in (json as object) &&
    (json as Record<string, unknown>).__envelope === true
  ) {
    return (json as Record<string, unknown>).data as T;
  }
  return json as T;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let errorData: { error?: string; message?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: "An unexpected error occurred" };
    }
    throw new ApiError(
      errorData.error || errorData.message || response.statusText,
      response.status
    );
  }

  if (response.status === 204) return {} as T;

  const json = await response.json();
  return unwrap<T>(json);
}

async function requestWithMeta<T>(
  url: string,
  options: RequestInit = {}
): Promise<ListResult<T>> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    let errorData: { error?: string; message?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: "An unexpected error occurred" };
    }
    throw new ApiError(
      errorData.error || errorData.message || response.statusText,
      response.status
    );
  }

  const json = await response.json();
  const isEnvelope =
    json !== null &&
    typeof json === "object" &&
    (json as Record<string, unknown>).__envelope === true;

  return {
    data: isEnvelope ? (json as Record<string, unknown>).data as T : json as T,
    meta: isEnvelope ? ((json as Record<string, unknown>).meta as PaginationMeta | null) : null,
  };
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) =>
    request<T>(url, { ...options, method: "GET" }),

  /** Use when you need pagination meta alongside the data array. */
  list: <T>(url: string, options?: RequestInit) =>
    requestWithMeta<T>(url, { ...options, method: "GET" }),

  post: <T>(url: string, body: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: "POST", body: JSON.stringify(body) }),

  patch: <T>(url: string, body: unknown, options?: RequestInit) =>
    request<T>(url, { ...options, method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(url: string, body?: unknown, options?: RequestInit) =>
    request<T>(url, {
      ...options,
      method: "DELETE",
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
};

