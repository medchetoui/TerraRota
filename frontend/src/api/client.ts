// API client for TerraRota backend
import type { RecommendationRequest, RecommendationResponse, CropsResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    // Pass structured error through
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
