"use client";

import type { Dataset } from "@/types";
import { HEALTH_CATEGORY_LABELS } from "@/lib/constants/health";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LifecycleBadge } from "./lifecycle-badge";
import { VersionHistoryPanel } from "./version-history-panel";
import { useDatasetVersions } from "@/lib/hooks/useDatasets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils/date";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Field label with optional tooltip explanation */
function FieldLabel({ label, tip }: { label: string; tip?: string }) {
  return (
    <dt className="flex items-center gap-1 text-muted-foreground">
      {label}
      {tip && (
        <TooltipProvider delay={200}>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="size-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help shrink-0" aria-label={`Help: ${label}`} />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-56 text-xs">
              {tip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </dt>
  );
}

interface DatasetDetailModalProps {
  dataset: Dataset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DatasetDetailModal({ dataset, open, onOpenChange }: DatasetDetailModalProps) {
  const { data: versionHistory } = useDatasetVersions(open ? dataset?.slug ?? "" : "");

  if (!dataset) return null;

  const totalSize = dataset.resources?.reduce((s, r) => s + r.sizeBytes, 0) ?? 0;

  const versions = versionHistory?.versions.map((v) => ({
    version: `v${v.version}`,
    changeNote: v.changes,
    publishedAt: v.created_at,
  })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6 leading-snug">{dataset.title}</DialogTitle>
          {dataset.lifecycleStage && dataset.lifecycleStage !== "approved" && (
            <div className="pt-1">
              <LifecycleBadge stage={dataset.lifecycleStage} />
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6 text-sm">

          {/* ── 1. Ownership & Responsibility ──────────────────────────── */}
          <section>
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
              Ownership & Responsibility
            </h3>
            <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5">
              <FieldLabel
                label="Dataset Owner"
                tip="The organisation or agency responsible for this dataset."
              />
              <dd>{dataset.organisation.name}</dd>

              <FieldLabel
                label="Responsible Dept"
                tip="The specific directorate or department within the owning organisation that manages this dataset."
              />
              <dd>{dataset.responsibleDept ?? "—"}</dd>

              <FieldLabel
                label="Contact Person"
                tip="The named data focal person you can reach for questions about this dataset."
              />
              <dd>{dataset.contactPerson ?? dataset.custodian ?? "—"}</dd>

              <FieldLabel
                label="Data Custodian"
                tip="The individual responsible for keeping this dataset up to date."
              />
              <dd>{dataset.custodian ?? dataset.organisation.name}</dd>
            </dl>
          </section>

          {/* ── 2. Coverage & Period ────────────────────────────────────── */}
          <section>
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
              Coverage & Period
            </h3>
            <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5">
              <FieldLabel
                label="Geographic Coverage"
                tip="The geographic area this dataset covers — state, LGA, ward, or facility level."
              />
              <dd>{dataset.geographicCoverage ?? (dataset.lgaCoverage.length ? `${dataset.lgaCoverage.length} LGAs` : "—")}</dd>

              <FieldLabel
                label="Reporting Period"
                tip="The time period the data in this dataset covers, e.g. Jan 2024 – Dec 2024."
              />
              <dd>{dataset.reportingPeriod ?? dataset.dateCollected ?? "—"}</dd>

              <FieldLabel
                label="Update Frequency"
                tip="How often this dataset is expected to be refreshed with new data."
              />
              <dd>{dataset.updateFrequency ?? "—"}</dd>

              <FieldLabel
                label="Last Updated"
                tip="The date this dataset was most recently revised on the portal."
              />
              <dd>{formatDate(dataset.updatedAt)}</dd>

              <FieldLabel
                label="Date Published"
                tip="The date this dataset was first made publicly available on this portal."
              />
              <dd>{dataset.datePublished ? formatDate(dataset.datePublished) : "—"}</dd>
            </dl>
          </section>

          {/* ── 3. Technical Details ────────────────────────────────────── */}
          <section>
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
              Technical Details
            </h3>
            <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5">
              <FieldLabel
                label="File Format"
                tip="The file types available to download for this dataset."
              />
              <dd>
                <div className="flex flex-wrap gap-1">
                  {dataset.formats.map((f) => (
                    <Badge key={f} variant="outline" className="font-mono text-xs">{f}</Badge>
                  ))}
                </div>
              </dd>

              <FieldLabel
                label="Data Type"
                tip="Spatial datasets contain geographic geometries (maps). Attribute datasets are tabular (rows and columns)."
              />
              <dd className="capitalize">{dataset.dataType ?? "attribute"}</dd>

              <FieldLabel
                label="File Size"
                tip="Total size of all downloadable files in this dataset."
              />
              <dd>{totalSize > 0 ? formatBytes(totalSize) : "—"}</dd>

              <FieldLabel
                label="Source"
                tip="The upstream system or programme from which this data was extracted."
              />
              <dd>{dataset.source ?? "—"}</dd>

              <FieldLabel
                label="Portal Source"
                tip="The platform that hosts and publishes this dataset."
              />
              <dd>{dataset.portalSource ?? "NSPHCDA Data Portal"}</dd>
            </dl>
          </section>

          {/* ── 4. Governance & Licensing ───────────────────────────────── */}
          <section>
            <h3 className="font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
              Governance & Licensing
            </h3>
            <dl className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2.5">
              <FieldLabel
                label="Category"
                tip="The health domain this dataset belongs to."
              />
              <dd>
                <Badge variant="secondary">
                  {HEALTH_CATEGORY_LABELS[dataset.healthCategory]}
                </Badge>
              </dd>

              <FieldLabel
                label="Validation Status"
                tip="Whether this dataset has passed the NSPHCDA review and approval process."
              />
              <dd className="capitalize">{dataset.status.replace(/_/g, " ")}</dd>

              <FieldLabel
                label="Data License"
                tip="The terms under which this dataset may be used, shared, or modified."
              />
              <dd>{dataset.dataLicense ?? "—"}</dd>
            </dl>
          </section>

          {/* ── 5. Description ──────────────────────────────────────────── */}
          <section>
            <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
              Description
            </h3>
            <p className="text-muted-foreground leading-relaxed">{dataset.description}</p>
          </section>

          {/* ── 6. Keywords / Tags ──────────────────────────────────────── */}
          {dataset.tags && dataset.tags.length > 0 && (
            <section>
              <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
                Keywords & Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {dataset.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* ── 7. Citation ─────────────────────────────────────────────── */}
          {dataset.citation && (
            <section>
              <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
                Citation
              </h3>
              <p className="italic text-muted-foreground">{dataset.citation}</p>
            </section>
          )}

          {/* ── 8. Key Attributes ───────────────────────────────────────── */}
          {dataset.keyAttributes && dataset.keyAttributes.length > 0 && (
            <section>
              <h3 className="font-semibold mb-2 text-xs uppercase tracking-wider text-muted-foreground border-b pb-1">
                Key Attributes
              </h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Field Name</th>
                      <th className="px-3 py-2 text-left font-medium">Example Value</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.keyAttributes.map((attr) => (
                      <tr key={attr.fieldName} className="border-t">
                        <td className="px-3 py-2 font-mono">{attr.fieldName}</td>
                        <td className="px-3 py-2">{attr.exampleValue}</td>
                        <td className="px-3 py-2 text-muted-foreground">{attr.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── 9. Version History ──────────────────────────────────────── */}
          {versions.length > 0 && <VersionHistoryPanel versions={versions} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
