import type { BackendSearchResult } from '../api/search';
import type { Dataset as BackendDataset, DatasetFormat, DatasetVisibility, DatasetStatus } from '../api/datasets';
import type { Organisation as BackendOrganisation } from '../api/organisations';
import { transformDataset } from './dataset-adapter';
import type { Dataset, Organisation } from '@/types';

/** Shape of the `metadata` object search.service.ts attaches to a dataset hit */
interface SearchDatasetMetadata {
  category_id?: string | null;
  organisation_id?: string | null;
  organisation?: { name: string; slug: string; logoUrl?: string | null };
  visibility?: DatasetVisibility;
  status?: DatasetStatus;
  created_at?: string;
  format?: DatasetFormat;
  download_count?: number;
  view_count?: number;
  updated_at?: string;
  license?: string | null;
  geographic_coverage?: string[] | null;
  tags?: string[] | null;
  has_spatial_data?: boolean;
}

/** Shape of the `metadata` object search.service.ts attaches to an org hit */
interface SearchOrganisationMetadata {
  type?: string;
  acronym?: string;
  logoUrl?: string | null;
  datasetCount?: number;
  created_at?: string;
}

/**
 * The global search endpoint returns a flat summary per result (not a full
 * record), enriched with just enough fields to render a real card. These
 * adapters bridge that summary into the same `Dataset`/`Organisation` shapes
 * the rest of the app already renders via `DatasetCard`/`OrgCard` — some
 * fields the full detail page would have (owner, methodology, file info,
 * etc.) simply aren't available from a search hit and are left at safe
 * defaults.
 */
export function adaptSearchResultToDataset(result: BackendSearchResult): Dataset {
  const m = (result.metadata ?? {}) as SearchDatasetMetadata;

  const backendDataset: BackendDataset = {
    id: result.id,
    title: result.title,
    slug: result.slug ?? result.id,
    description: result.description ?? '',
    category_id: m.category_id ?? null,
    organisation_id: m.organisation_id ?? null,
    owner_id: '',
    format: m.format ?? 'other',
    visibility: m.visibility ?? 'public',
    status: m.status ?? 'approved',
    tags: m.tags ?? null,
    temporal_coverage_start: null,
    temporal_coverage_end: null,
    geographic_coverage: m.geographic_coverage ?? null,
    disease_indicators: null,
    file_path: null,
    file_size: null,
    file_hash: null,
    version: 1,
    download_count: m.download_count ?? 0,
    view_count: m.view_count ?? 0,
    license: m.license ?? null,
    methodology: null,
    limitations: null,
    responsible_dept: null,
    contact_person: null,
    contact_email: null,
    update_frequency: null,
    metadata: null,
    key_attributes: null,
    bbox: null,
    has_spatial_data: m.has_spatial_data ?? false,
    programme_id: null,
    campaign_id: null,
    created_at: m.created_at ?? new Date().toISOString(),
    updated_at: m.updated_at ?? m.created_at ?? new Date().toISOString(),
    submitted_at: null,
    reviewed_by: null,
    reviewed_at: null,
    review_comment: null,
    approved_by: null,
    approved_at: null,
    published_by: null,
    published_at: null,
  };

  const organisations: BackendOrganisation[] | undefined = m.organisation
    ? [
        {
          id: m.organisation_id ?? '',
          slug: m.organisation.slug,
          name: m.organisation.name,
          logoUrl: m.organisation.logoUrl ?? undefined,
        } as BackendOrganisation,
      ]
    : undefined;

  return transformDataset(backendDataset, undefined, organisations);
}

export function adaptSearchResultToOrganisation(result: BackendSearchResult): Organisation {
  const m = (result.metadata ?? {}) as SearchOrganisationMetadata;

  return {
    id: result.id,
    slug: result.slug ?? result.id,
    name: result.title,
    acronym: m.acronym ?? undefined,
    sector: m.type ?? 'organisation',
    logoUrl: m.logoUrl ?? undefined,
    description: result.description ?? undefined,
    datasetCount: m.datasetCount ?? 0,
  };
}
