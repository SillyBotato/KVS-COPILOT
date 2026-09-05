import type {
  UploadResponse,
  AllRecordsResponse,
  ApprovedRecordsResponse,
  ApproveResponse,
  FieldsResponse,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://kvs-copilot-production-010b.up.railway.app";
export const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://kvs-copilot-demo-5q9e.vercel.app";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function uploadExcel(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch<UploadResponse>(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
}

export function getFields(): Promise<FieldsResponse> {
  return apiFetch<FieldsResponse>(`${API_BASE}/fields`);
}

export function getAllRecords(
  sessionId = "default"
): Promise<AllRecordsResponse> {
  return apiFetch<AllRecordsResponse>(
    `${API_BASE}/api/records/${sessionId}`
  );
}

export function getApprovedRecords(
  sessionId = "default"
): Promise<ApprovedRecordsResponse> {
  return apiFetch<ApprovedRecordsResponse>(
    `${API_BASE}/api/approved/${sessionId}`
  );
}

export function approveRecord(
  recordId: string,
  sessionId = "default"
): Promise<ApproveResponse> {
  return apiFetch<ApproveResponse>(
    `${API_BASE}/approve/${sessionId}/${recordId}`,
    { method: "POST" }
  );
}
