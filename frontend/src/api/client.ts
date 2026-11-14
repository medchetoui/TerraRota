// API client for TerraRota backend
import type { 
  RecommendationRequest, 
  RecommendationResponse, 
  CropsResponse,
  CropsDetailResponse,
  ScenariosResponse,
  WhatIfResponse,
  DataSourcesResponse,
  FarmPlan,
  FarmPlanResponse,
  FarmPlansListResponse,
  DecisionReportResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function getToken(): string | null {
  return localStorage.getItem('terrarota_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('terrarota_token', token);
  } else {
    localStorage.removeItem('terrarota_token');
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return data as T;
}

export async function getRecommendations(
  payload: RecommendationRequest,
): Promise<RecommendationResponse> {
  return request<RecommendationResponse>('/recommendations/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getScenarios(
  payload: RecommendationRequest,
): Promise<ScenariosResponse> {
  return request<ScenariosResponse>('/scenarios/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function runWhatIf(
  payload: {
    latitude: number;
    longitude: number;
    previous_crop?: string | null;
    water_access?: string | null;
    soil_type?: string;
    field_size_ha?: number;
    simulated_changes: Record<string, any>;
  },
): Promise<WhatIfResponse> {
  return request<WhatIfResponse>('/whatif/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCrops(): Promise<CropsResponse> {
  return request<CropsResponse>('/crops/');
}

export async function getCropsDetail(): Promise<CropsDetailResponse> {
  return request<CropsDetailResponse>('/crops/detail/');
}

export async function getDataSources(): Promise<DataSourcesResponse> {
  return request<DataSourcesResponse>('/data-sources/');
}

export async function getDecisionReport(
  payload: RecommendationRequest,
): Promise<DecisionReportResponse> {
  return request<DecisionReportResponse>('/reports/decision-report/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getHealth(): Promise<{ status: string; nasa_power_reachable: boolean }> {
  return request('/health/');
}

// ─── Auth & Parcels ──────────────────────────────────────────

export interface UserProfile {
  id: number;
  username: string;
  email: string;
}

export interface ParcelItem {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  water_access: string;
  soil_type: string;
  field_size_ha: number | null;
  notes?: string;
  created_at: string;
}

export async function loginUser(credentials: { username: string; password: string }) {
  const res = await request<{ access: string; refresh: string }>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setToken(res.access);
  return res;
}

export async function registerUser(userData: { username: string; email?: string; password: string }) {
  const res = await request<{ access: string; refresh: string; user: UserProfile }>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  setToken(res.access);
  return res;
}

export async function getMe(): Promise<{ status: string; user: UserProfile }> {
  return request('/auth/me/');
}

export async function getParcels(): Promise<{ status: string; parcels: ParcelItem[] }> {
  return request('/parcels/');
}

export async function createParcel(parcel: Partial<ParcelItem>): Promise<{ status: string; parcel: ParcelItem }> {
  return request('/parcels/', {
    method: 'POST',
    body: JSON.stringify(parcel),
  });
}

export async function deleteParcel(id: number): Promise<{ status: string }> {
  return request(`/parcels/${id}/`, {
    method: 'DELETE',
  });
}

// ─── Plans ───────────────────────────────────────────────────

export async function getPlans(): Promise<FarmPlansListResponse> {
  return request<FarmPlansListResponse>('/plans/');
}

export async function createPlan(plan: Partial<FarmPlan>): Promise<FarmPlanResponse> {
  return request<FarmPlanResponse>('/plans/', {
    method: 'POST',
    body: JSON.stringify(plan),
  });
}

export async function updatePlan(id: number, patch: Partial<FarmPlan>): Promise<FarmPlanResponse> {
  return request<FarmPlanResponse>(`/plans/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deletePlan(id: number): Promise<{ status: string }> {
  return request(`/plans/${id}/`, {
    method: 'DELETE',
  });
}
