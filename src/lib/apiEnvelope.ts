import { NextResponse } from "next/server";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: PaginationMeta | null;
  error: null;
  __envelope: true;
}

export interface ApiErrorEnvelope {
  data: null;
  error: string;
  meta: null;
  __envelope: true;
}

/**
 * Wraps a successful API response in the standard envelope.
 * Use for all list and single-resource responses.
 *
 * `apiClient.get<T>()` auto-unwraps this transparently, so callers don't change.
 * `apiClient.list<T>()` returns `{data, meta}` for callers that need pagination info.
 */
export function jsonEnvelope<T>(data: T, meta?: PaginationMeta, status = 200): NextResponse {
  const body: ApiEnvelope<T> = {
    data,
    meta: meta ?? null,
    error: null,
    __envelope: true,
  };
  return NextResponse.json(body, { status });
}
