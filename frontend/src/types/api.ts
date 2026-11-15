// TerraRota API types — shared TypeScript definitions

export type WaterAccess = 'rainfed' | 'irrigated' | 'partial';
export type SoilType = 'clay' | 'clay_loam' | 'loam' | 'sandy_loam' | 'sandy' | 'unknown';
export type CropId =
  | 'wheat_hard'
  | 'wheat_soft'
  | 'barley'
  | 'olive'
  | 'argan'
  | 'tomato'
  | 'chickpea'
  | 'cactus_pear'
  | 'potato'
  | 'almond'
  | 'lentil'
  | 'faba_bean'
  | 'fallow';

export type DataStatus = 'live' | 'cached' | 'sample' | 'insufficient_data';

export interface FarmerPriorities {
  water_conservation?: number;
  soil_health?: number;
  profitability?: number;
  climate_resilience?: number;
  crop_diversification?: number;
  lower_risk?: number;
}

export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  previous_crop?: CropId | string | null;
  water_access?: WaterAccess | null;
  soil_type?: SoilType;
  field_size_ha?: number | null;
  preferred_crops?: CropId[];
  farmer_priorities?: FarmerPriorities;
  notes?: string;
  farm_name?: string;
  region?: string;
}

export interface Provenance {
  source: string;
  retrieved_at: string;
  period: { start: string; end: string };
  spatial_resolution_deg: number | null;
  variables: string[];
  latitude: number | null;
  longitude: number | null;
}

export interface Indicators {
  annual_rain_mm: number;
  mean_annual_temp_c: number;
  gdd_base10: number;
  frost_days_per_year: number;
  aridity_index: number;
  dry_months: number;
  missing_data_pct: number | null;
}

export interface ScientificEvidence {
  parameter: string;
  value: string;
  scientific_rule: string;
  source: string;
  scientific_rule_en?: string;
  scientific_rule_fr?: string;
}

export interface CropRecommendation {
  crop_id: CropId;
  crop_name_fr: string;
  crop_name_ar: string;
  crop_name_en?: string;
  crop_category: string;
  crop_emoji: string;
  score: number;
  rank: number;
  eligible: boolean;
  reasons: string[];
  reasons_fr?: string[];
  reasons_en?: string[];
  cautions: string[];
  cautions_fr?: string[];
  cautions_en?: string[];
  evidences?: ScientificEvidence[];
  infos: string[];
  rules_applied: string[];
  is_provisional: boolean;
  provisional_note: string | null;
  missing_data: string[];
  priority_adjustment?: number;
}

export interface AbstainedCrop {
  crop_id: CropId;
  crop_name_fr: string;
  crop_name_ar: string;
  reason: string;
}

export interface RecommendationResponse {
  status: 'ok' | 'error';
  data_status: DataStatus;
  provenance: Provenance | null;
  indicators: Indicators | null;
  recommendations: CropRecommendation[];
  abstained_crops: AbstainedCrop[];
  abstention_reason: string | null;
  insufficient_data_reason: string | null;
  sample_note?: string;
  rules_version?: string;
}

export interface Crop {
  id: CropId;
  name_fr: string;
  name_ar: string;
  name_en?: string;
  category: string;
  emoji: string;
}

export interface CropDetail extends Crop {
  scientific_name?: string;
  family?: string;
  cycle_type?: string;
  sowing_season?: string;
  harvest_season?: string;
  water_req_mm?: [number, number];
  temp_opt_c?: [number, number];
  nitrogen_fixation?: boolean;
  soil_effect?: string;
  root_depth_cm?: number;
  source?: string;
}

export interface CropsResponse {
  crops: Crop[];
}

export interface CropsDetailResponse {
  status: string;
  total: number;
  crops: CropDetail[];
}

// ─── Scenarios ──────────────────────────────────────────────

export interface ScenarioStep {
  year: number;
  season: string;
  crop_id: string;
  crop_name_fr: string;
  crop_name_ar: string;
  crop_name_en?: string;
  crop_emoji: string;
}

export interface Scenario {
  id: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  strategy_type: string;
  badge: string;
  crop_sequence: ScenarioStep[];
  water_demand_level: string;
  water_savings_pct: number;
  n_fixation_kg_ha: string;
  soil_health_score: number;
  resilience_score: number;
  profitability_score: number;
  advantages: string[];
  risks: string[];
  scientific_basis: string;
}

export interface ScenariosResponse {
  status: string;
  scenarios: Scenario[];
  indicators: Indicators;
  provenance: Provenance;
}

// ─── What-If ────────────────────────────────────────────────

export interface CropComparison {
  crop_id: string;
  crop_name_fr: string;
  crop_name_ar: string;
  crop_name_en?: string;
  crop_emoji: string;
  score_before: number | null;
  score_after: number | null;
  delta: number | null;
  eligible_before: boolean;
  eligible_after: boolean;
  status_change: 'improved' | 'degraded' | 'unchanged' | 'became_eligible' | 'became_ineligible';
  simulated_reasons: string[];
  simulated_cautions: string[];
}

export interface WhatIfSimulation {
  changes_applied: string[];
  winner_before: string;
  winner_after: string;
  strategy_changed: boolean;
  crop_comparisons: CropComparison[];
  simulated_indicators: Indicators;
  provenance_note: string;
}

export interface WhatIfResponse {
  status: string;
  simulation: WhatIfSimulation;
  provenance: Provenance;
}

// ─── Data Sources ───────────────────────────────────────────

export interface DataSourceVariable {
  code: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  unit: string;
}

export interface DataSource {
  id: string;
  name: string;
  provider: string;
  product_id: string;
  official_url: string;
  api_docs_url?: string;
  status: 'fully_integrated' | 'partially_integrated' | 'investigating' | 'not_integrated';
  spatial_resolution: string;
  temporal_resolution_fr: string;
  temporal_resolution_ar: string;
  temporal_resolution_en: string;
  variables: DataSourceVariable[];
  processing_methods_fr: string[];
  processing_methods_ar: string[];
  processing_methods_en: string[];
  limitations_fr: string;
  limitations_ar: string;
  limitations_en: string;
}
// ─── Farm Plans ─────────────────────────────────────────────

export interface FarmPlan {
  id: number;
  parcel: number;
  user?: number;
  title: string;
  status: 'draft' | 'proposed' | 'approved' | 'modified' | 'rejected';
  recommended_crops: CropRecommendation[];
  selected_crop: string;
  crop_sequence: any[];
  rejection_reason?: string;
  farmer_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmPlanResponse {
  status: string;
  plan: FarmPlan;
}

export interface FarmPlansListResponse {
  status: string;
  plans: FarmPlan[];
}

// ─── Decision Report ────────────────────────────────────────

export interface DecisionReport {
  report_id: string;
  generated_at: string;
  title: string;
  title_en: string;
  title_ar: string;
  competition: string;
  farm: {
    name: string;
    region: string;
    latitude: number;
    longitude: number;
    surface_ha: number;
    water_access: string;
    soil_type: string;
    previous_crop: string;
    previous_crop_name?: string;
  };
  environmental_data: Indicators;
  nasa_provenance: {
    source: string;
    observation_period: { start: string; end: string };
    spatial_resolution: string;
    retrieved_at: string;
    variables_used: string[];
  };
  primary_recommendation: CropRecommendation | null;
  all_recommendations: CropRecommendation[];
  scenarios: Scenario[];
  selected_plan: any;
  scientific_citations: string[];
  limitations_statement: string;
}

export interface DecisionReportResponse {
  status: string;
  report: DecisionReport;
}
