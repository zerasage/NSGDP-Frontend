"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, FileText, MapPin, Scale, Settings, X, Loader2, ArrowLeft, Search } from "lucide-react";
import { Stepper } from "@/components/forms/stepper";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FieldLabelTooltip } from "@/components/forms/field-label-tooltip";
import { FormError } from "@/components/forms/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTip } from "@/components/ui/help-tip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import { PORTAL_DATASET_EDIT_PAGE_TIP } from "@/lib/constants/portal-tooltips";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDataset, useUpdateDataset, useDatasetFiles } from "@/lib/hooks/useDatasets";
import { useCategories } from "@/lib/hooks/useCategories";
import { uploadFile } from "@/lib/api/uploads";
import { canEditDataset } from "@/lib/auth";
import { useRequireOrgMember } from "@/lib/hooks/useRequireOrgMember";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { UPLOAD_FIELD_TOOLTIPS } from "@/lib/constants/upload-tooltips";
import { useDraftAutoSave } from "@/lib/hooks/useDraftAutoSave";
import {
  uploadStep1Schema,
  uploadStep2Schema,
  uploadStep4Schema,
  uploadStep5Schema,
} from "@/lib/schemas/auth";
import type { DatasetVisibility } from "@/lib/api/datasets";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Coverage & Indicators", icon: MapPin },
  { id: 3, name: "Manage Files", icon: Upload },
  { id: 4, name: "Governance", icon: Scale },
  { id: 5, name: "Contact & Settings", icon: Settings },
];

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "Update essential details about your dataset.",
  2: "Where and when this data applies, and what it measures.",
  3: "Review existing files or attach additional ones.",
  4: "Usage rights and data quality notes for reviewers.",
  5: "Contact details and who can access the dataset.",
};

const LICENSE_OPTIONS = [
  { value: "CC-BY-4.0", label: "CC BY 4.0 — Attribution required" },
  { value: "CC-BY-SA-4.0", label: "CC BY-SA 4.0 — Attribution, share-alike" },
  { value: "CC0-1.0", label: "CC0 1.0 — Public domain" },
  { value: "Government Open Data License", label: "Government Open Data License" },
  { value: "Restricted — Internal Use Only", label: "Restricted — Internal use only" },
];

export default function EditDatasetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, allowed } = useRequireOrgMember();

  // Fetch dataset from API
  const { data: dataset, isLoading: loading, error } = useDataset(resolvedParams.slug);
  const { data: existingFiles } = useDatasetFiles(resolvedParams.slug);
  const { data: categoriesData } = useCategories();
  const updateMutation = useUpdateDataset();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const isBusy = saving || isRedirecting;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);
  const [lgaFilter, setLgaFilter] = useState("");
  const filteredLGAs = NIGER_STATE_LGAS.filter((lga) =>
    lga.toLowerCase().includes(lgaFilter.trim().toLowerCase()),
  );
  const [temporalCoverageStart, setTemporalCoverageStart] = useState("");
  const [temporalCoverageEnd, setTemporalCoverageEnd] = useState("");
  const [diseaseIndicators, setDiseaseIndicators] = useState<string[]>([]);
  const [indicatorInput, setIndicatorInput] = useState("");
  const [license, setLicense] = useState("");
  const [methodology, setMethodology] = useState("");
  const [limitations, setLimitations] = useState("");
  const [visibility, setVisibility] = useState<DatasetVisibility>("public");
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);
  const [responsibleDept, setResponsibleDept] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState("");

  useDraftAutoSave(
    !loading && Boolean(title || description || newFiles.length > 0),
    [title, description, newFiles.length, loading]
  );

  // Populate form when dataset loads
  useEffect(() => {
    if (dataset) {
      setTitle(dataset.title);
      setDescription(dataset.description || "");
      setCategoryId(dataset.category_id || "");
      setTags(dataset.tags || []);
      setSelectedLGAs(dataset.geographic_coverage || []);
      setTemporalCoverageStart(dataset.temporal_coverage_start?.slice(0, 10) || "");
      setTemporalCoverageEnd(dataset.temporal_coverage_end?.slice(0, 10) || "");
      setDiseaseIndicators(dataset.disease_indicators || []);
      setLicense(dataset.license || "");
      setMethodology(dataset.methodology || "");
      setLimitations(dataset.limitations || "");
      setResponsibleDept(dataset.responsible_dept || "");
      setContactPerson(dataset.contact_person || "");
      setContactEmail(dataset.contact_email || "");
      setUpdateFrequency(dataset.update_frequency || "");
      setVisibility(dataset.visibility);
    }
  }, [dataset]);

  // Handle not found or forbidden
  useEffect(() => {
    if (error) {
      toast.error("Dataset not found");
      router.push("/datasets");
      return;
    }
    if (!loading && dataset && user && !canEditDataset(user, dataset)) {
      toast.error("You do not have permission to edit this dataset");
      router.push(`/datasets/${resolvedParams.slug}`);
    }
  }, [error, loading, dataset, user, router, resolvedParams.slug]);

  if (authLoading || !allowed) {
    return null;
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addIndicator = () => {
    if (indicatorInput.trim() && !diseaseIndicators.includes(indicatorInput.trim())) {
      setDiseaseIndicators([...diseaseIndicators, indicatorInput.trim()]);
      setIndicatorInput("");
    }
  };

  const removeIndicator = (indicator: string) => {
    setDiseaseIndicators(diseaseIndicators.filter((i) => i !== indicator));
  };

  const validateStep1 = () => {
    const result = uploadStep1Schema.safeParse({ title, description, categoryId, tags });
    const errors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((i) => {
        errors[i.path[0] as string] = i.message;
      });
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const result = uploadStep2Schema.safeParse({
      lgas: selectedLGAs,
      temporalCoverageStart,
      temporalCoverageEnd,
      diseaseIndicators,
    });
    const errors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((i) => {
        errors[i.path[0] as string] = i.message;
      });
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    if ((existingFiles?.length ?? 0) === 0 && newFiles.length === 0) {
      setStepErrors({ files: "Keep at least one file or upload a replacement" });
      return false;
    }
    setStepErrors({});
    return true;
  };

  const validateStep4 = () => {
    const result = uploadStep4Schema.safeParse({ license });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        errors[i.path[0] as string] = i.message;
      });
      setStepErrors(errors);
      return false;
    }
    setStepErrors({});
    return true;
  };

  const validateStep5 = () => {
    const result = uploadStep5Schema.safeParse({ visibility });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        errors[i.path[0] as string] = i.message;
      });
      setStepErrors(errors);
      return false;
    }
    setStepErrors({});
    return true;
  };

  const handleSave = async (isDraft: boolean) => {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5()) return;

    setSaving(true);

    try {
      const updated = await updateMutation.mutateAsync({
        slug: resolvedParams.slug,
        data: {
          title,
          description,
          categoryId: categoryId || undefined,
          tags,
          geographicCoverage: selectedLGAs.join(', '), // Convert array to comma-separated string
          temporalCoverageStart: temporalCoverageStart || undefined,
          temporalCoverageEnd: temporalCoverageEnd || undefined,
          diseaseIndicators: diseaseIndicators.length > 0 ? diseaseIndicators : undefined,
          license: license || undefined,
          methodology: methodology || undefined,
          limitations: limitations || undefined,
          responsibleDept: responsibleDept || undefined,
          contactPerson: contactPerson || undefined,
          contactEmail: contactEmail || undefined,
          updateFrequency: updateFrequency || undefined,
          visibility,
        },
      });

      // Upload any newly attached files — appended alongside existing ones,
      // not a replacement (a dataset can have more than one file)
      for (const uploadedFile of newFiles) {
        if (uploadedFile.file) {
          await uploadFile(uploadedFile.file, updated.id);
        }
      }

      toast.success(isDraft ? "Changes saved as draft" : "Dataset updated successfully!");
      setIsRedirecting(true);
      router.push(`/datasets/${resolvedParams.slug}`);
    } catch (error) {
      toast.error("Failed to update dataset");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-5 sm:px-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
        <DashboardPageContent className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-[28rem] rounded-2xl" />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (!dataset) return null;

  if (!canEditDataset(user, dataset)) {
    return null;
  }

  const activeStep = steps.find((step) => step.id === currentStep);
  const ActiveIcon = activeStep?.icon ?? FileText;
  const datasetHref = `/datasets/${resolvedParams.slug}`;

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <Link
            href={datasetHref}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 w-fit gap-2 px-0 hover:bg-transparent",
            )}
          >
            <ArrowLeft className="size-4" />
            Back to dataset
          </Link>
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/[0.08] px-2.5 py-1">
              <FileText className="size-3.5 text-amber-700 dark:text-warning" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-warning">
                Edit dataset
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Edit dataset
              <HelpTip content={PORTAL_DATASET_EDIT_PAGE_TIP} label="Edit dataset help" />
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{dataset.title}</p>
          </div>
        </div>
      </div>

      <DashboardPageContent className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => step < currentStep && setCurrentStep(step)}
        />

        <DashboardPanel
          title={activeStep?.name ?? "Edit"}
          description={STEP_DESCRIPTIONS[currentStep]}
          icon={ActiveIcon}
          tone="warning"
        >
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <FieldLabelTooltip
                  htmlFor="title"
                  label="Dataset Title"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.title}
                />
                <Input id="title" className="h-11" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isBusy} />
                <FormError message={stepErrors.title} />
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="description"
                  label="Description"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.description}
                />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length} / 500 characters
                </p>
                <FormError message={stepErrors.description} />
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="category"
                  label="Programme Area / Category"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.category}
                />
                <Select value={categoryId} onValueChange={(value) => setCategoryId(value || "")}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a category">
                      {categoryId && categoriesData?.data ? (
                        <>
                          <span className="mr-2">{categoriesData.data.find(c => c.id === categoryId)?.icon}</span>
                          {categoriesData.data.find(c => c.id === categoryId)?.name}
                        </>
                      ) : (
                        "Select a category"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData?.data?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={stepErrors.categoryId} />
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="tags"
                  label="Tags (Keywords)"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.tags}
                />
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tags"
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="shrink-0">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-primary/80"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button className="h-11 w-full sm:w-auto" onClick={() => validateStep1() && setCurrentStep(2)} disabled={isBusy}>
                  Next: Coverage & indicators
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabelTooltip label="LGA Coverage" required tooltip={UPLOAD_FIELD_TOOLTIPS.lgas} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedLGAs.length === NIGER_STATE_LGAS.length) {
                        setSelectedLGAs([]);
                      } else {
                        setSelectedLGAs([...NIGER_STATE_LGAS]);
                      }
                    }}
                    className="text-xs h-8 font-medium"
                  >
                    {selectedLGAs.length === NIGER_STATE_LGAS.length ? "Clear All" : "Select All (25)"}
                  </Button>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={lgaFilter}
                    onChange={(e) => setLgaFilter(e.target.value)}
                    placeholder="Filter LGAs…"
                    className="h-11 pl-9"
                    disabled={isBusy}
                  />
                </div>
                <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredLGAs.length === 0 ? (
                    <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
                      No LGAs match &ldquo;{lgaFilter}&rdquo;
                    </p>
                  ) : (
                    filteredLGAs.map((lga) => (
                      <label key={lga} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLGAs.includes(lga)}
                          disabled={isBusy}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLGAs([...selectedLGAs, lga]);
                            } else {
                              setSelectedLGAs(selectedLGAs.filter((l) => l !== lga));
                            }
                          }}
                          className="rounded"
                        />
                        {lga}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedLGAs.length} of {NIGER_STATE_LGAS.length} LGAs selected
                </p>
                <FormError message={stepErrors.lgas} />
              </div>

              <div>
                <FieldLabelTooltip
                  label="Reporting Period"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.reportingPeriod}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="temporalCoverageStart" className="text-xs text-muted-foreground mb-1 block">
                      Start date
                    </label>
                    <Input
                      id="temporalCoverageStart"
                      type="date"
                      value={temporalCoverageStart}
                      onChange={(e) => setTemporalCoverageStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="temporalCoverageEnd" className="text-xs text-muted-foreground mb-1 block">
                      End date
                    </label>
                    <Input
                      id="temporalCoverageEnd"
                      type="date"
                      value={temporalCoverageEnd}
                      onChange={(e) => setTemporalCoverageEnd(e.target.value)}
                    />
                  </div>
                </div>
                <FormError message={stepErrors.temporalCoverageStart || stepErrors.temporalCoverageEnd} />
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="diseaseIndicators"
                  label="Disease / Health Indicators"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.diseaseIndicators}
                />
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <Input
                    id="diseaseIndicators"
                    value={indicatorInput}
                    onChange={(e) => setIndicatorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIndicator())}
                    placeholder="e.g., Confirmed cases (press Enter)"
                  />
                  <Button type="button" onClick={addIndicator} variant="outline" className="shrink-0">
                    Add
                  </Button>
                </div>
                {diseaseIndicators.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {diseaseIndicators.map((indicator) => (
                      <span
                        key={indicator}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {indicator}
                        <button
                          type="button"
                          onClick={() => removeIndicator(indicator)}
                          className="hover:text-primary/80"
                          aria-label={`Remove indicator ${indicator}`}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setCurrentStep(1)} disabled={isBusy}>
                  Back
                </Button>
                <Button className="h-11 w-full sm:w-auto" onClick={() => validateStep2() && setCurrentStep(3)} disabled={isBusy}>
                  Next: Manage files
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">{UPLOAD_FIELD_TOOLTIPS.files}</p>
              {existingFiles && existingFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Current Files ({existingFiles.length})</h3>
                  {existingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-xl border p-4"
                    >
                      <FileText className="size-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.format.toUpperCase()} • {((file.file_size ?? 0) / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Uploading a new file below adds to this dataset — it does not replace these.
                  </p>
                </div>
              )}

              <FileUploadArea files={newFiles} onFilesChange={setNewFiles} />
              <FormError message={stepErrors.files} />

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setCurrentStep(2)} disabled={isBusy}>
                  Back
                </Button>
                <Button className="h-11 w-full sm:w-auto" onClick={() => validateStep3() && setCurrentStep(4)} disabled={isBusy}>
                  Next: Governance
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <FieldLabelTooltip
                  label="Data License"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.dataLicense}
                />
                <Select value={license} onValueChange={(v) => setLicense(v || "")}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a license" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError message={stepErrors.license} />
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="methodology"
                  label="Methodology"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.methodology}
                />
                <Textarea
                  id="methodology"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  rows={2}
                  placeholder="e.g., Facility-based routine reporting via DHIS2"
                />
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="limitations"
                  label="Known Limitations"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.limitations}
                />
                <Textarea
                  id="limitations"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  rows={2}
                  placeholder="e.g., Reporting delays from rural facilities"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setCurrentStep(3)} disabled={isBusy}>
                  Back
                </Button>
                <Button className="h-11 w-full sm:w-auto" onClick={() => validateStep4() && setCurrentStep(5)} disabled={isBusy}>
                  Next: Contact & settings
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Additional Information <span className="font-normal">(optional)</span>
                </p>

                <div>
                  <FieldLabelTooltip
                    htmlFor="responsibleDept"
                    label="Responsible Department"
                    tooltip={UPLOAD_FIELD_TOOLTIPS.responsibleDept}
                  />
                  <Input
                    id="responsibleDept"
                    value={responsibleDept}
                    onChange={(e) => setResponsibleDept(e.target.value)}
                    placeholder="e.g., Disease Surveillance Unit"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabelTooltip
                      htmlFor="contactPerson"
                      label="Contact Person"
                      tooltip={UPLOAD_FIELD_TOOLTIPS.contactPerson}
                    />
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g., Jane Doe"
                    />
                  </div>
                  <div>
                    <FieldLabelTooltip
                      htmlFor="contactEmail"
                      label="Contact Email"
                      tooltip="Email address for questions about this dataset"
                    />
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g., jane.doe@example.org"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabelTooltip
                    label="Update Frequency"
                    tooltip={UPLOAD_FIELD_TOOLTIPS.updateFrequency}
                  />
                  <Select value={updateFrequency} onValueChange={(v) => setUpdateFrequency(v || "")}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Select frequency (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                      <SelectItem value="One-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <FieldLabelTooltip
                  label="Visibility"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.visibility}
                />
                <div className="grid gap-3">
                  {(["public", "restricted", "private"] as DatasetVisibility[]).map((vis) => (
                    <button
                      key={vis}
                      type="button"
                      onClick={() => setVisibility(vis)}
                      disabled={isBusy}
                      aria-pressed={visibility === vis}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition-colors",
                        visibility === vis
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            visibility === vis ? "border-primary" : "border-muted-foreground/30"
                          }`}
                          aria-hidden
                        >
                          {visibility === vis && (
                            <div className="size-2.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium mb-1 capitalize">{vis}</p>
                          <p className="text-sm text-muted-foreground">
                            {vis === "public" && "Anyone can view and download"}
                            {vis === "restricted" && "Users must request access"}
                            {vis === "private" && "Only you and your organization"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <FormError message={stepErrors.visibility} />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-11 w-full sm:w-auto sm:self-start"
                  onClick={() => setCurrentStep(4)}
                  disabled={isBusy}
                >
                  Back
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    className="h-11 w-full sm:w-auto"
                    onClick={() => handleSave(true)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Saving…
                      </>
                    ) : (
                      "Save as draft"
                    )}
                  </Button>
                  <Button className="h-11 w-full gap-2 sm:w-auto" onClick={() => handleSave(false)} disabled={isBusy}>
                    {isBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DashboardPanel>
      </DashboardPageContent>
    </DashboardPage>
  );
}
