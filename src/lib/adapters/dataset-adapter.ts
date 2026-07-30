import type { Dataset as BackendDataset } from '../api/datasets';
import type { Dataset as FrontendDataset, HealthCategory, FileFormat } from '@/types';
import type { Category } from '../api/categories';
import type { Organisation } from '../api/organisations';

/**
 * Transform backend dataset to frontend dataset format
 * This adapter bridges the gap between backend API structure (UUIDs, snake_case)
 * and frontend UI expectations (nested objects, camelCase)
 */
export function transformDataset(
  backendDataset: BackendDataset,
  categories?: Category[],
  organisations?: Organisation[]
): FrontendDataset {
  // Find related category
  const category = categories?.find((c) => c.id === backendDataset.category_id);
  
  // Find related organisation
  const organisation = organisations?.find((o) => o.id === backendDataset.organisation_id);

  // Map backend category to frontend health category
  // Backend uses category slugs, frontend uses health category enum
  const healthCategoryMap: Record<string, HealthCategory> = {
    'disease-surveillance': 'disease',
    'health-facilities': 'facilities',
    'population-health': 'population',
    'disease-data': 'disease',
    'surveillance': 'surveillance',
  };

  return {
    id: backendDataset.id,
    slug: backendDataset.slug,
    title: backendDataset.title,
    description: backendDataset.description || undefined,
    
    // Transform organisation - provide fallback if not found
    organisation: organisation
      ? {
          id: organisation.id,
          slug: organisation.slug,
          name: organisation.name,
          logoUrl: organisation.logoUrl || undefined,
        }
      : {
          id: backendDataset.organisation_id || '',
          slug: 'unknown',
          name: 'Unknown Organisation',
          logoUrl: undefined,
        },
    
    // Groups are not yet implemented in backend, provide empty array
    groups: [],
    
    // Transform health category
    healthCategory: category
      ? (healthCategoryMap[category.slug] || 'disease')
      : 'disease',
    
    visibility: backendDataset.visibility,
    
    // Use backend status directly (no mapping needed anymore)
    status: backendDataset.status as FrontendDataset['status'],
    
    // Backend has single format, frontend expects array
    formats: [backendDataset.format.toUpperCase() as FileFormat],
    
    // Geographic coverage
    lgaCoverage: backendDataset.geographic_coverage || [],
    
    downloadCount: backendDataset.download_count,
    updatedAt: backendDataset.updated_at,

    // The backend only exposes the current/primary file inline on the
    // dataset itself (file_path/file_size), not a nested files array — build
    // a single-item resources list from that so the Data Files & Resources
    // section (and its download/request-access action) actually renders.
    resources: backendDataset.file_path
      ? [
          {
            id: backendDataset.id,
            name: backendDataset.file_path.split('/').pop() || backendDataset.title,
            format: backendDataset.format.toUpperCase() as FileFormat,
            sizeBytes: backendDataset.file_size ?? 0,
            updatedAt: backendDataset.updated_at,
          },
        ]
      : [],

    // Extended metadata
    custodian: undefined, // Not in backend yet
    dateCollected: backendDataset.temporal_coverage_start || undefined,
    updateFrequency: undefined, // Not in backend yet
    methodology: backendDataset.methodology || undefined,
    citation: undefined, // Not in backend yet
    dataType: backendDataset.has_spatial_data ? 'spatial' : 'attribute',
    source: undefined, // Not in backend yet
    portalSource: undefined, // Not in backend yet
    keyAttributes: (backendDataset.key_attributes as unknown) as FrontendDataset['keyAttributes'] || undefined,
    programId: backendDataset.programme_id || undefined,
    
    // Governance metadata
    responsibleDept: undefined, // Not in backend yet
    contactPerson: undefined, // Not in backend yet
    geographicCoverage: backendDataset.geographic_coverage?.join(', ') || undefined,
    reportingPeriod: backendDataset.temporal_coverage_start && backendDataset.temporal_coverage_end
      ? `${backendDataset.temporal_coverage_start} – ${backendDataset.temporal_coverage_end}`
      : undefined,
    datePublished: backendDataset.created_at,
    dataLicense: backendDataset.license || undefined,
    tags: backendDataset.tags || undefined,
    
    // Advanced filter metadata
    disease: backendDataset.disease_indicators?.[0] || undefined,
    reportingYear: backendDataset.temporal_coverage_start
      ? new Date(backendDataset.temporal_coverage_start).getFullYear()
      : undefined,
    wardCoverage: undefined, // Not in backend yet
    facilityScope: undefined, // Not in backend yet
    linkedProgram: backendDataset.programme_id || undefined,
    
    // Lifecycle
    lifecycleStage: mapStatusToLifecycleStage(backendDataset.status),
    versions: undefined, // DatasetDetailModal fetches real version history itself via useDatasetVersions(slug)
    archiveInfo: backendDataset.status === 'archived'
      ? {
          archivedAt: backendDataset.updated_at,
          archivedBy: 'System',
          reason: 'Archived',
        }
      : undefined,
  };
}

/**
 * Map backend status to lifecycle stage
 * Backend statuses: draft, pending, under_review, approved, rejected, archived
 */
function mapStatusToLifecycleStage(
  backendStatus: string
): FrontendDataset['lifecycleStage'] {
  const lifecycleMap: Record<string, FrontendDataset['lifecycleStage']> = {
    draft: 'draft',
    pending: 'submitted',
    under_review: 'under_review',
    approved: 'approved',
    rejected: 'archived', // Map rejected to archived since there's no rejected lifecycle stage
    archived: 'archived',
  };
  
  return lifecycleMap[backendStatus] || 'draft';
}

/**
 * Transform a list of backend datasets to frontend format
 */
export function transformDatasets(
  backendDatasets: BackendDataset[],
  categories?: Category[],
  organisations?: Organisation[]
): FrontendDataset[] {
  return backendDatasets.map((dataset) =>
    transformDataset(dataset, categories, organisations)
  );
}
