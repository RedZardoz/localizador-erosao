import { z } from "zod";

export type SeverityLevel = "Moderada" | "Alta" | "Crítica";

export type SoilType =
  | "Latossolo Vermelho Distroférrico"
  | "Latossolo Vermelho Eutroférrico"
  | "Nitossolo Vermelho"
  | "Neossolo Regolítico"
  | "Neossolo Litólico"
  | "Argissolo Vermelho-Amarelo"
  | "Cambissolo Háplico";

export type ErosionFeatureType =
  | "Erosão Laminar Severa"
  | "Sulcos de Erosão Acentuados"
  | "Ravina Ativa"
  | "Voçoroca em Expansão"
  | "Depressão com Escoamento Concentrado";

export interface ErosionPoint {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number; // meters
  slopePercent: number; // %
  slopeDegrees: number; // °
  bsi: number; // Bare Soil Index (-1.0 to 1.0)
  ndvi: number; // Vegetation index (-1.0 to 1.0)
  municipality: string;
  state: string;
  macroRegion: string;
  watershed: string; // Bacia Hidrográfica
  soilType: SoilType | string;
  featureType: ErosionFeatureType | string;
  severity: SeverityLevel;
  estimatedSoilLoss: number; // t/ha/ano (RUSLE)
  priorityScore: number; // 0 to 100
  detectionDate: string;
  notes?: string;
  isCustom?: boolean;
}

export interface RegionPreset {
  id: string;
  name: string;
  state: string;
  country: string;
  description: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch?: number;
  bearing?: number;
  bounds: [[number, number], [number, number]]; // [[minLng, minLat], [maxLng, maxLat]]
  watersheds: string[];
  isCustom?: boolean;
}

export interface AOIPolygon {
  id: string;
  name: string;
  fileName: string;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  areaKm2?: number;
  importedAt: string;
}

export interface NewRegionRequest {
  id: string;
  regionName: string;
  stateOrCountry: string;
  reason: string;
  requesterEmail: string;
  dateRange: { start: string; end: string };
  sensorPreference: "Sentinel-2" | "Landsat-8/9" | "Planet-NICFI" | "SRTM-30m";
  coordinatesBbox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  customPolygon?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  status: "Pendente" | "Processando GEE" | "Concluído";
  createdAt: string;
}

export interface GcpCredentials {
  type: string;
  project_id: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  isValid?: boolean;
  validatedAt?: string;
}

export interface FilterState {
  searchQuery: string;
  minSlope: number;
  maxSlope: number;
  minBsi: number;
  maxBsi: number;
  selectedSeverities: SeverityLevel[];
  selectedWatersheds: string[];
  selectedSoilTypes: string[];
  selectedFeatureTypes: string[];
  topN: number; // Limit to Top N most critical points (0 = all)
  sortBy: "priority" | "bsi" | "slope" | "soilLoss" | "municipality";
  sortOrder: "asc" | "desc";
}

// Zod schemas for backend validation
export const GcpCredentialsSchema = z.object({
  type: z.literal("service_account"),
  project_id: z.string().min(3),
  client_email: z.string().email(),
  private_key: z.string().includes("BEGIN PRIVATE KEY"),
});

export const RegionRequestSchema = z.object({
  regionName: z.string().min(3, "Nome da região é obrigatório"),
  stateOrCountry: z.string().min(2, "Estado ou país é obrigatório"),
  reason: z.string().min(5, "Justificativa é obrigatória"),
  requesterEmail: z.string().email("E-mail inválido"),
  sensorPreference: z.enum(["Sentinel-2", "Landsat-8/9", "Planet-NICFI", "SRTM-30m"]),
});
