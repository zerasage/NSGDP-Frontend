import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

// Unlike categories/organisations, the backend builds these response
// objects by hand with camelCase keys already (not a raw TypeORM entity
// passthrough), so there's no snake_case mapping step needed here.

export interface GisFeature<P> {
  type: 'Feature';
  geometry: { type: string; coordinates: unknown } | null;
  properties: P;
}

export interface LgaGisProperties {
  lga: string;
  lgaCode: string | null;
  population: number | null;
  areaSqkm: number | null;
  populationDensity: number | null;
  facilityCount: number;
  facilitiesByLevel: Record<string, number>;
  facilitiesByOwnership: Record<string, number>;
  centroid: [number, number] | null;
}

export interface WardGisProperties {
  lga: string;
  ward: string;
  areaSqkm: number | null;
  facilityCount: number;
  facilitiesByLevel: Record<string, number>;
  centroid: [number, number] | null;
}

export interface LgaGisFeatureCollection {
  type: 'FeatureCollection';
  generatedAt: string;
  cached: boolean;
  totalPopulation: number;
  totalFacilities: number;
  features: GisFeature<LgaGisProperties>[];
}

export interface WardGisFeatureCollection {
  type: 'FeatureCollection';
  generatedAt: string;
  cached: boolean;
  totalWards: number;
  features: GisFeature<WardGisProperties>[];
}

export interface GisFacility {
  name: string;
  ownership: string | null;
  level: string | null;
  lga: string;
  ward: string | null;
  lat: number | null;
  lng: number | null;
}

/** Population, facility distribution and boundary geometry for all 25 LGAs. */
export async function getLgaGisSummary(): Promise<LgaGisFeatureCollection> {
  const response = await apiClient.get<ApiResponse<LgaGisFeatureCollection>>(
    '/gis/lga-summary'
  );
  return response.data.data;
}

/** Facility distribution and boundary geometry for all wards, optionally filtered to one LGA. */
export async function getWardGisSummary(
  lga?: string
): Promise<WardGisFeatureCollection> {
  const response = await apiClient.get<ApiResponse<WardGisFeatureCollection>>(
    '/gis/ward-summary',
    { params: lga ? { lga } : undefined }
  );
  return response.data.data;
}

/** Health facility points, optionally filtered by LGA and/or ward. */
export async function getGisFacilities(filters?: {
  lga?: string;
  ward?: string;
}): Promise<GisFacility[]> {
  const response = await apiClient.get<ApiResponse<GisFacility[]>>(
    '/gis/facilities',
    { params: filters }
  );
  return response.data.data;
}
