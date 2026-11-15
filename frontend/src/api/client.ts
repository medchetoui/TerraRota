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

// ─── Questions du fellah en darija (Membre 3) ───

export interface FellahPhrase {
  id: string;
  darija: string;
  fr: string;
  audio: string | null;
}

export interface FellahParcelle {
  latitude: number;
  longitude: number;
  previous_crop: string;
  water_access: string;
  soil_type: string;
  field_size_ha: number | null;
  data_status: string;
  annual_rain_mm: number | null;
  mean_annual_temp_c: number | null;
}

export interface FellahAnswer {
  question: string;
  scenario: string;
  parcelle: Record<string, string | number | boolean> | null;
  intention: string;
  culture: string | null;
  phrases: FellahPhrase[][];
  texte: string;
  ms: number;
}

export interface FellahTestQuestion {
  id: string;
  a_dire: string;
  ecriture_arabe: string;
  type_attendu: string;
  culture_attendue: string;
  traduction_fr: string;
}

export interface FellahSetup {
  scenarios: { id: string; darija: string; fr: string }[];
  defaut: string;
  suggestions: { question: string; fr: string }[];
  questions_test: FellahTestQuestion[];
  journal: boolean;
  badge: string;
}

export async function getFellahSetup(): Promise<FellahSetup> {
  return request<FellahSetup>('/fellah/scenarios/');
}

export async function askFellah(
  question: string,
  scenario: string,
  parcelle?: FellahParcelle | null,
): Promise<FellahAnswer> {
  return request<FellahAnswer>('/fellah/question/', {
    method: 'POST',
    body: JSON.stringify(parcelle ? { question, parcelle } : { question, scenario }),
  });
}

export async function logFellahVoiceTry(entry: Record<string, unknown>): Promise<void> {
  await request('/fellah/journal/', { method: 'POST', body: JSON.stringify(entry) });
}

// ─── Préparation de la démo (développement seulement) ───

export interface FellahPhraseEtat {
  id: string;
  darija: string;
  fr: string;
  statut: string;
  texte_avant: string;
  demo: boolean;
  present: boolean;
  a_refaire: boolean;
}

export interface FellahValidation {
  id: string;
  darija: string;
  statut: string;
  modifiee: boolean;
  a_refaire: boolean;
  demo: { questions: number; type_correct: number; reponses_avec_chiffres: number };
}

export async function getFellahPhrases(): Promise<{ phrases: FellahPhraseEtat[]; audio_url: string }> {
  return request('/fellah/phrases/');
}

export async function saveFellahClip(id: string, wav: Blob): Promise<{ status: string; audio: string }> {
  const response = await fetch(`${BASE_URL}/fellah/clips/${encodeURIComponent(id)}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'audio/wav' },
    body: wav,
  });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, data };
  return data;
}

export async function validateFellahPhrase(id: string, texte_darija?: string): Promise<FellahValidation> {
  return request<FellahValidation>(`/fellah/phrases/${encodeURIComponent(id)}/`, {
    method: 'POST',
    body: JSON.stringify(texte_darija === undefined ? { action: 'ok' } : { action: 'modifier', texte_darija }),
  });
}
