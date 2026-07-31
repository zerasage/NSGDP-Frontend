"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, MapPin, Scale, Settings, X, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Container } from "@/components/layout/container";
import { Stepper } from "@/components/forms/stepper";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FieldLabelTooltip } from "@/components/forms/field-label-tooltip";
import { FormError } from "@/components/forms/form-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
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
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

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
    if (user.role !== "contributor" && user.role !== "admin") {
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
        'geojson': 'geojson',
        'shp': 'shapefile',
        'kml': 'kml',
        'pdf': 'pdf',
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
          : `Dataset submitted for review with ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""}!`
      );
      router.push("/datasets");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create dataset";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex-1 bg-muted/40">
      <div className="border-b bg-background">
        <Container size="wide" className="py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Upload New Dataset</h1>
              <p className="mt-2 text-muted-foreground">
                Share your data with the Niger State community
              </p>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 cursor-pointer">
              <Checkbox
                checked={prefillTestData}
                onCheckedChange={(checked) => togglePrefill(!!checked)}
              />
              Prefill test data
            </label>
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => step < currentStep && setCurrentStep(step)}
          className="mb-8"
        />

        <Card className="max-w-3xl mx-auto p-4 sm:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Basic Information</h2>
                <p className="text-muted-foreground">
                  Provide essential details about your dataset
                </p>
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="title"
                  label="Dataset Title"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.title}
                />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Niger State Health Facilities 2024"
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

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={() => validateStep1() && setCurrentStep(2)}
                >
                  Next: Coverage & Indicators
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Coverage & Indicators</h2>
                <p className="text-muted-foreground">
                  Where and when this data applies, and what it measures
                </p>
              </div>

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
                    className="pl-9 h-9"
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

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => validateStep2() && setCurrentStep(3)}>
                  Next: Upload Files
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Upload Files</h2>
                <p className="text-muted-foreground">{UPLOAD_FIELD_TOOLTIPS.files}</p>
              </div>

              <FileUploadArea files={uploadedFiles} onFilesChange={setUploadedFiles} />
              <FormError message={stepErrors.files} />

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={() => validateStep3() && setCurrentStep(4)}>
                  Next: Governance
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Governance</h2>
                <p className="text-muted-foreground">
                  Usage rights and data quality notes
                </p>
              </div>

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

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  Back
                </Button>
                <Button onClick={() => validateStep4() && setCurrentStep(5)}>
                  Next: Contact & Settings
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Contact & Settings</h2>
                <p className="text-muted-foreground">
                  Who to contact about this dataset, and who can access it
                </p>
              </div>

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

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  Back
                </Button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={uploading || uploadedFiles.length === 0}
                    title={uploadedFiles.length === 0 ? "Please upload a file first" : ""}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={uploading || uploadedFiles.length === 0}
                    title={uploadedFiles.length === 0 ? "Please upload a file first" : ""}
                  >
                    {uploading ? "Submitting..." : "Submit for Review"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </Container>
    </main>
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
      className={`p-4 rounded-lg border-2 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/30"
      }`}
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
