"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, FileText, MapPin, Scale, Settings, X, Search, Loader2, ArrowLeft } from "lucide-react";
import { useAuth, isOrgMember } from "@/lib/auth";
import { Stepper } from "@/components/forms/stepper";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FieldLabelTooltip } from "@/components/forms/field-label-tooltip";
import { FormError } from "@/components/forms/form-error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTip } from "@/components/ui/help-tip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import { PORTAL_DATASET_UPLOAD_PAGE_TIP } from "@/lib/constants/portal-tooltips";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateDataset } from "@/lib/hooks/useDatasets";
import { useCategories } from "@/lib/hooks/useCategories";
import { uploadFile } from "@/lib/api/uploads";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { UPLOAD_FIELD_TOOLTIPS } from "@/lib/constants/upload-tooltips";
import { useDraftAutoSave } from "@/lib/hooks/useDraftAutoSave";
import {
  uploadStep1Schema,
  uploadStep2Schema,
  uploadStep4Schema,
  uploadStep5Schema,
} from "@/lib/schemas/auth";
import type { DatasetVisibility, DatasetFormat } from "@/lib/api/datasets";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Coverage & Indicators", icon: MapPin },
  { id: 3, name: "Upload Files", icon: Upload },
  { id: 4, name: "Governance", icon: Scale },
  { id: 5, name: "Contact & Settings", icon: Settings },
];

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: "Provide essential details about your dataset.",
  2: "Where and when this data applies, and what it measures.",
  3: "Attach CSV, Excel, JSON, or geospatial files.",
  4: "Usage rights and data quality notes for reviewers.",
  5: "Contact details and who can access the dataset.",
};

const LICENSE_OPTIONS = [
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC0-1.0",
  "Government Open Data License",
  "Restricted — Internal Use Only",
];

export default function UploadDatasetPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const createMutation = useCreateDataset();
  const { data: categoriesData } = useCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const isBusy = uploading || isRedirecting;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);
  const [lgaFilter, setLgaFilter] = useState("");
  const filteredLGAs = NIGER_STATE_LGAS.filter((lga) =>
    lga.toLowerCase().includes(lgaFilter.trim().toLowerCase())
  );
  const [temporalCoverageStart, setTemporalCoverageStart] = useState("");
  const [temporalCoverageEnd, setTemporalCoverageEnd] = useState("");
  const [diseaseIndicators, setDiseaseIndicators] = useState<string[]>([]);
  const [indicatorInput, setIndicatorInput] = useState("");
  const [license, setLicense] = useState("");
  const [methodology, setMethodology] = useState("");
  const [limitations, setLimitations] = useState("");
  const [visibility, setVisibility] = useState<DatasetVisibility>("public");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [responsibleDept, setResponsibleDept] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState("");

  const [prefillTestData, setPrefillTestData] = useState(false);
  const togglePrefill = (checked: boolean) => {
    setPrefillTestData(checked);
    if (checked) {
      setTitle(`Test Health Dataset ${new Date().getFullYear()} - ${Date.now().toString().slice(-6)}`);
      setDescription(
        "Sample dataset used for testing the contributor upload flow and data validation. Contains placeholder health data for Niger State."
      );
      setTags(["health", "test", "niger-state"]);
      setSelectedLGAs(["Minna", "Suleja", "Bida"]);
      setTemporalCoverageStart("2025-01-01");
      setTemporalCoverageEnd("2025-12-31");
      setDiseaseIndicators(["Confirmed cases", "Deaths"]);
      setLicense("CC-BY-4.0");
      setMethodology("Facility-based routine reporting via DHIS2");
      setLimitations("Data may have reporting delays from rural facilities");
      setResponsibleDept("Disease Surveillance Unit");
      setContactPerson("Jane Doe");
      setContactEmail("jane.doe@example.org");
      setUpdateFrequency("Monthly");
    } else {
      setTitle("");
      setDescription("");
      setCategoryId("");
      setTags([]);
      setSelectedLGAs([]);
      setTemporalCoverageStart("");
      setTemporalCoverageEnd("");
      setDiseaseIndicators([]);
      setLicense("");
      setMethodology("");
      setLimitations("");
      setResponsibleDept("");
      setContactPerson("");
      setContactEmail("");
      setUpdateFrequency("");
    }
  };

  useDraftAutoSave(
    Boolean(title || description || uploadedFiles.length > 0),
    [title, description, uploadedFiles.length]
  );

  // Category IDs are seeded per-environment, so prefill from the first
  // available category only when test data is explicitly enabled.
  useEffect(() => {
    if (prefillTestData && !categoryId && categoriesData?.data?.length) {
      setCategoryId(categoriesData.data[0].id);
    }
  }, [prefillTestData, categoryId, categoriesData]);

  // Role guard - only contributor and admin can upload
  // Must be after all hooks
  if (!isLoading && user) {
    if (!isOrgMember(user.role)) {
      router.replace("/dashboard");
      return null;
    }

    // Must have organisation
    if (!user.organisationId) {
      toast.error("You must be part of an organization to upload datasets");
      router.replace("/dashboard");
      return null;
    }
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
    if (uploadedFiles.length === 0) {
      setStepErrors({ files: "Upload at least one file" });
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

  const handleSubmit = async (isDraft: boolean) => {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5()) return;

    // Require file for ALL dataset creation (draft or submission)
    if (uploadedFiles.length === 0) {
      toast.error("Please upload a file. Datasets require data files.");
      return;
    }

    setUploading(true);

    try {
      // Determine format from uploaded file or default to csv
      const fileFormat = uploadedFiles[0]?.name.split('.').pop()?.toLowerCase() || 'csv';
      const formatMap: Record<string, DatasetFormat> = {
        'csv': 'csv',
        'xlsx': 'excel',
        'xls': 'excel',
        'json': 'json',
        'gpkg': 'geopackage',
      };

      // Step 1: Create dataset with appropriate status
      // - Draft button: status = 'draft' (can be saved without file)
      // - Submit for Review button: status = 'pending' (requires file)
      const dataset = await createMutation.mutateAsync({
        title,
        description,
        categoryId: categoryId || undefined,
        format: formatMap[fileFormat] || 'csv',
        visibility,
        status: isDraft ? 'draft' : 'pending',
        tags,
        geographicCoverage: selectedLGAs.join(', '),
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
      });

      // Step 2: Upload every selected file — a dataset can have more than
      // one file attached to it, each tracked separately (not just the first)
      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile.file) {
          await uploadFile(uploadedFile.file, dataset.id);
        }
      }

      toast.success(
        isDraft
          ? "Dataset saved as draft"
          : `Dataset submitted for review with ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""}!`,
      );
      setIsRedirecting(true);
      router.push("/datasets");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create dataset";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const activeStep = steps.find((step) => step.id === currentStep);
  const ActiveIcon = activeStep?.icon ?? Upload;

  if (isLoading) {
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

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/datasets"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 w-fit gap-2 px-0 hover:bg-transparent",
            )}
          >
            <ArrowLeft className="size-4" />
            Back to datasets
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-2.5 py-1">
                <Upload className="size-3.5 text-success" aria-hidden />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-success">
                  New dataset
                </span>
              </div>
              <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                Upload dataset
                <HelpTip content={PORTAL_DATASET_UPLOAD_PAGE_TIP} label="Upload dataset help" />
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Share data with the Niger State community
                {user?.organisationName ? ` · ${user.organisationName}` : ""}.
              </p>
            </div>
            <label className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs text-muted-foreground sm:h-10">
              <Checkbox
                checked={prefillTestData}
                onCheckedChange={(checked) => togglePrefill(!!checked)}
              />
              Prefill test data
            </label>
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
          title={activeStep?.name ?? "Upload"}
          description={STEP_DESCRIPTIONS[currentStep]}
          icon={ActiveIcon}
          tone="success"
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
                <Input
                  id="title"
                  className="h-11"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Niger State Health Facilities 2024"
                  disabled={isBusy}
                />
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
                  placeholder="Describe what this dataset contains..."
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
                    placeholder="Add tags (press Enter)"
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
                <Button
                  className="h-11 w-full sm:w-auto"
                  onClick={() => validateStep1() && setCurrentStep(2)}
                  disabled={isBusy}
                >
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
                    className="pl-9 h-11"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 rounded-lg border">
                  {filteredLGAs.length === 0 ? (
                    <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                      No LGAs match &ldquo;{lgaFilter}&rdquo;
                    </p>
                  ) : (
                    filteredLGAs.map((lga) => (
                      <label key={lga} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLGAs.includes(lga)}
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
                  Next: Upload files
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">{UPLOAD_FIELD_TOOLTIPS.files}</p>

              <FileUploadArea files={uploadedFiles} onFilesChange={setUploadedFiles} />
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
                  htmlFor="license"
                  label="Data License"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.dataLicense}
                />
                <Input
                  id="license"
                  list="license-options"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  placeholder="Select a license or type your own…"
                />
                <datalist id="license-options">
                  {LICENSE_OPTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
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
                  <VisibilityOption
                    value="public"
                    selected={visibility === "public"}
                    onSelect={() => setVisibility("public")}
                    title="Public"
                    description="Anyone can view and download this dataset"
                  />
                  <VisibilityOption
                    value="restricted"
                    selected={visibility === "restricted"}
                    onSelect={() => setVisibility("restricted")}
                    title="Restricted"
                    description="Users must request access to download"
                  />
                  <VisibilityOption
                    value="private"
                    selected={visibility === "private"}
                    onSelect={() => setVisibility("private")}
                    title="Private"
                    description="Only you and your organization can access"
                  />
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
                    onClick={() => handleSubmit(true)}
                    disabled={isBusy || uploadedFiles.length === 0}
                    title={uploadedFiles.length === 0 ? "Please upload a file first" : ""}
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
                  <Button
                    className="h-11 w-full gap-2 sm:w-auto"
                    onClick={() => handleSubmit(false)}
                    disabled={isBusy || uploadedFiles.length === 0}
                    title={uploadedFiles.length === 0 ? "Please upload a file first" : ""}
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Submitting…
                      </>
                    ) : (
                      "Submit for review"
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

function VisibilityOption({
  selected,
  onSelect,
  title,
  description,
}: {
  value: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border-2 p-4 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/30",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
            selected ? "border-primary" : "border-muted-foreground/30"
          }`}
          aria-hidden
        >
          {selected && <div className="size-2.5 rounded-full bg-primary" />}
        </div>
        <div>
          <p className="font-medium mb-1">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}
