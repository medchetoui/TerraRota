// API client for TerraRota backend
import type { RecommendationRequest, RecommendationResponse, CropsResponse } from '../types/api';

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

export async function getCrops(): Promise<CropsResponse> {
  return request<CropsResponse>('/crops/');
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
