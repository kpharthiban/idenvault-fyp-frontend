// Centralized fetch wrapper for the IdenVault backend API.
// Pages currently call fetch() directly — migrate them to these helpers
// as backend integration solidifies across the project.

import type { ApiResponse } from "@/types/api";
import type { CredentialTemplate, TemplateField } from "@/lib/credentialTemplates";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string,
  ) {
    super(`${status} ${statusText}`);
    this.name = "ApiError";
  }
}

function buildHeaders(walletAddress?: string, hasBody?: boolean): HeadersInit {
  const headers: Record<string, string> = {};
  if (walletAddress) headers["x-wallet-address"] = walletAddress;
  if (hasBody) headers["Content-Type"] = "application/json";
  return headers;
}

async function request<T>(
  method: string,
  path: string,
  walletAddress?: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      method,
      headers: buildHeaders(walletAddress, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let parsed: unknown;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      if (!res.ok) throw new ApiError(res.status, res.statusText, text);
      return { success: true, data: undefined as T };
    }

    if (!res.ok) {
      const msg =
        (parsed as Record<string, unknown>)?.error ??
        (parsed as Record<string, unknown>)?.message ??
        res.statusText;
      return { success: false, error: String(msg) };
    }

    return { success: true, data: parsed as T };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, error: `${err.status}: ${err.body || err.statusText}` };
    }
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}

export function apiGet<T>(path: string, walletAddress?: string) {
  return request<T>("GET", path, walletAddress);
}

export function apiPost<T>(path: string, body: unknown, walletAddress?: string) {
  return request<T>("POST", path, walletAddress, body);
}

export function apiPut<T>(path: string, body: unknown, walletAddress?: string) {
  return request<T>("PUT", path, walletAddress, body);
}

export function apiDelete<T>(path: string, walletAddress?: string) {
  return request<T>("DELETE", path, walletAddress);
}

/* ------------------------------------------------------------------ */
/*  Template CRUD helpers                                              */
/* ------------------------------------------------------------------ */

/* ---- snake_case ↔ camelCase mapping for template objects ---- */

// Row shape the backend actually returns (snake_case DB columns)
interface TemplateRow {
  id: string;
  title: string;
  type: string;
  description: string;
  issuance_mode?: string;
  issuanceMode?: string;
  requires_certificate?: boolean;
  requiresCertificate?: boolean;
  fields: TemplateField[];
  issuer_wallet?: string;
  is_system_default?: boolean;
  isSystemDefault?: boolean;
  [key: string]: unknown; // allow extra columns we don't use
}

function rowToTemplate(row: TemplateRow): CredentialTemplate {
  return {
    id: row.id,
    title: row.title,
    type: row.type as CredentialTemplate["type"],
    description: row.description ?? "",
    issuanceMode:
      (row.issuanceMode ?? row.issuance_mode ?? "single") as CredentialTemplate["issuanceMode"],
    requiresCertificate:
      row.requiresCertificate ?? row.requires_certificate ?? false,
    fields: Array.isArray(row.fields) ? row.fields : [],
    issuer_wallet: row.issuer_wallet,
    isSystemDefault: row.isSystemDefault ?? row.is_system_default ?? false,
  };
}

// Convert camelCase template to the snake_case payload the backend expects
function templateToPayload(
  data: Omit<Partial<CredentialTemplate>, "id" | "isSystemDefault">,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (data.title !== undefined) out.title = data.title;
  if (data.type !== undefined) out.type = data.type;
  if (data.description !== undefined) out.description = data.description;
  if (data.issuanceMode !== undefined) out.issuance_mode = data.issuanceMode;
  if (data.requiresCertificate !== undefined)
    out.requires_certificate = data.requiresCertificate;
  if (data.fields !== undefined) out.fields = data.fields;
  if (data.issuer_wallet !== undefined) out.issuer_wallet = data.issuer_wallet;
  return out;
}

export async function fetchTemplates(
  walletAddress: string,
): Promise<ApiResponse<CredentialTemplate[]>> {
  const res = await apiGet<unknown>("/api/templates", walletAddress);
  if (!res.success) return { success: false, error: res.error };

  // Normalise: the backend may return a raw array OR wrap it in
  // { data: [...] } / { templates: [...] }. Extract the array.
  const raw = res.data as unknown;
  let rows: TemplateRow[];

  if (Array.isArray(raw)) {
    rows = raw;
  } else if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const nested = obj.data ?? obj.templates ?? obj.items;
    if (Array.isArray(nested)) {
      rows = nested;
    } else {
      return { success: false, error: "Unexpected response shape from /api/templates" };
    }
  } else {
    return { success: false, error: "Unexpected response shape from /api/templates" };
  }

  return { success: true, data: rows.map(rowToTemplate) };
}

export function createTemplate(
  walletAddress: string,
  data: Omit<CredentialTemplate, "id" | "isSystemDefault">,
) {
  return apiPost<CredentialTemplate>(
    "/api/templates",
    templateToPayload(data),
    walletAddress,
  );
}

export function updateTemplate(
  walletAddress: string,
  id: string,
  data: Omit<Partial<CredentialTemplate>, "id" | "isSystemDefault">,
) {
  return apiPut<CredentialTemplate>(
    `/api/templates/${id}`,
    templateToPayload(data),
    walletAddress,
  );
}

export function deleteTemplate(walletAddress: string, id: string) {
  return apiDelete<void>(`/api/templates/${id}`, walletAddress);
}

/* ------------------------------------------------------------------ */
/*  Presentation token helpers (time-bound QR verification)            */
/* ------------------------------------------------------------------ */

export function requestPresentationToken(
  walletAddress: string,
  refId: string,
) {
  return apiPost<{ token: string; expiresAt: number }>(
    `/api/credentials/${refId}/present`,
    {},
    walletAddress,
  );
}

export async function verifyPresentationToken(
  token: string,
): Promise<ApiResponse<unknown>> {
  const url = `${BASE_URL}/api/verify/token`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    let parsed: Record<string, unknown> | undefined;
    const text = await res.text();
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      if (!res.ok) throw new ApiError(res.status, res.statusText, text);
      return { success: true, data: undefined };
    }

    if (!res.ok) {
      const msg = String(
        parsed?.error ?? parsed?.message ?? res.statusText,
      );
      const code = parsed?.code ? String(parsed.code) : undefined;
      return { success: false, error: msg, code };
    }

    return { success: true, data: parsed };
  } catch (err) {
    if (err instanceof ApiError) {
      return { success: false, error: `${err.status}: ${err.body || err.statusText}` };
    }
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return { success: false, error: message };
  }
}

export { ApiError, BASE_URL };
