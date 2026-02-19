/**
 * MindToosa API Client
 * 
 * A typed wrapper around fetch for consistent API calls and error handling.
 */

import { ApiError } from "./errors";

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: 'An unexpected error occurred' };
        }

        throw new ApiError(
            errorData.error || errorData.message || response.statusText,
            response.status
        );
    }

    if (response.status === 204) return {} as T;

    return response.json();
}

export const apiClient = {
    get: <T>(url: string, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'GET' }),

    post: <T>(url: string, body: unknown, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),

    patch: <T>(url: string, body: unknown, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

    delete: <T>(url: string, body?: unknown, options?: RequestInit) =>
        request<T>(url, { ...options, method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) }),
};
