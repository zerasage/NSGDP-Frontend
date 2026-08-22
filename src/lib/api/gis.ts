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

export interface StateBoundaryFeature {
  type: 'Feature';
  generatedAt: string;
  cached: boolean;
  properties: { name: string };
  geometry: { type: string; coordinates: unknown } | null;
}

export interface GisSettlement {
  name: string;
  primaryName: string | null;
  lga: string;
  ward: string | null;
  accessibility: string | null;
  securityCompromised: boolean;
  hardToReach: boolean;
  highRisk: boolean;
  slum: boolean;
  denselyPopulated: boolean;
  riverine: boolean;
  nomadic: boolean;
  border: boolean;
  habitationalStatus: string | null;
  population: number | null;
  households: number | null;
  lat: number;
  lng: number;
}

export interface SettlementFilters {
  [key: string]: string | undefined;
  lga?: string;
  ward?: string;
  accessibility?: string;
  hardToReach?: 'Y' | 'N';
  securityCompromised?: 'Y' | 'N';
  highRisk?: 'Y' | 'N';
  slums?: 'Y' | 'N';
  riverine?: 'Y' | 'N';
  nomadic?: 'Y' | 'N';
  border?: 'Y' | 'N';
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

/** Niger State outline, dissolved server-side from the 25 LGA boundaries. */
export async function getStateBoundary(): Promise<StateBoundaryFeature> {
  const response = await apiClient.get<ApiResponse<StateBoundaryFeature>>(
    '/gis/state-boundary'
  );
  return response.data.data;
}

/** Settlement-level access/vulnerability points from the MLoS master list. */
export async function getGisSettlements(
  filters: SettlementFilters
): Promise<GisSettlement[]> {
  const response = await apiClient.get<ApiResponse<GisSettlement[]>>(
    '/gis/settlements',
    { params: filters }
  );
  return response.data.data;
}

export interface DiseaseBurdenGisProperties {
  lgaName: string;
  lgaCode: string;
  totalCases: number;
  incidencePer1000: number;
}

export interface DiseaseBurdenFeatureCollection {
  type: 'FeatureCollection';
  features: GisFeature<DiseaseBurdenGisProperties>[];
}

/** Choropleth polygons coloured by disease-burden case counts per LGA. */
export async function getDiseaseBurdenSimplified(
  indicator: string,
  year?: number
): Promise<DiseaseBurdenFeatureCollection> {
  const response = await apiClient.get<ApiResponse<DiseaseBurdenFeatureCollection>>(
    '/gis/disease-burden/simplified',
    { params: { indicator, ...(year != null ? { year } : {}) } }
  );
  return response.data.data;
}
