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
  | 'cactus_pear';

export type DataStatus = 'live' | 'cached' | 'sample' | 'insufficient_data';

export interface RecommendationRequest {
  latitude: number;
  longitude: number;
  previous_crop?: CropId | null;
  water_access?: WaterAccess | null;
  soil_type?: SoilType;
  field_size_ha?: number | null;
  preferred_crops?: CropId[];
  notes?: string;
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

export interface CropRecommendation {
  crop_id: CropId;
  crop_name_fr: string;
  crop_name_ar: string;
  crop_category: string;
  crop_emoji: string;
  score: number;
  rank: number;
  eligible: boolean;
  reasons: string[];
  cautions: string[];
  infos: string[];
  rules_applied: string[];
  is_provisional: boolean;
  provisional_note: string | null;
  missing_data: string[];
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
  category: string;
  emoji: string;
}

export interface CropsResponse {
  crops: Crop[];
}
