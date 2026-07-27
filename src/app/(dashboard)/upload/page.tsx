"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Settings, X } from "lucide-react";
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
  uploadStep3Schema,
} from "@/lib/schemas/auth";
import type { DatasetVisibility, DatasetFormat } from "@/lib/api/datasets";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Upload Files", icon: Upload },
  { id: 3, name: "Settings", icon: Settings },
];

export default function UploadDatasetPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const createMutation = useCreateDataset();
  const { data: categoriesData } = useCategories();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // PRE-FILLED TEST DATA - Change as needed
  const [title, setTitle] = useState("Test Health Dataset 2026");
  const [description, setDescription] = useState("This is a test dataset for Niger State health data. Contains sample information for testing the upload flow and data validation.");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>(["health", "test", "2026"]);
  const [tagInput, setTagInput] = useState("");
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>(["Minna", "Suleja", "Bida"]);
  const [visibility, setVisibility] = useState<DatasetVisibility>("public");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useDraftAutoSave(
    Boolean(title || description || uploadedFiles.length > 0),
    [title, description, uploadedFiles.length]
  );

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

  const validateStep1 = () => {
    const result = uploadStep1Schema.safeParse({ title, description, tags });
    const lgaResult = uploadStep2Schema.safeParse({ lgas: selectedLGAs });
    const errors: Record<string, string> = {};
    if (!result.success) {
      result.error.issues.forEach((i) => {
        errors[i.path[0] as string] = i.message;
      });
    }
    if (!lgaResult.success) {
      lgaResult.error.issues.forEach((i) => {
        errors[i.path[0] as string] = i.message;
      });
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    if (uploadedFiles.length === 0) {
      setStepErrors({ files: "Upload at least one file" });
      return false;
    }
    setStepErrors({});
    return true;
  };

  const validateStep3 = () => {
    const result = uploadStep3Schema.safeParse({ visibility });
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
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    
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
          <h1 className="text-3xl font-bold">Upload New Dataset</h1>
          <p className="mt-2 text-muted-foreground">
            Share your data with the Niger State community
          </p>
          {/* Pre-fill indicator */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ <strong>Form is pre-filled with test data.</strong> Just add your file in Step 2 and submit!
            </p>
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
                  tooltip="Select the health programme area this dataset belongs to (e.g., Disease Surveillance, Immunization, MNCH)"
                />
                <Select value={categoryId} onValueChange={(value) => setCategoryId(value || "")}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a category (optional)">
                      {categoryId && categoriesData?.data ? (
                        <>
                          <span className="mr-2">{categoriesData.data.find(c => c.id === categoryId)?.icon}</span>
                          {categoriesData.data.find(c => c.id === categoryId)?.name}
                        </>
                      ) : (
                        "Select a category (optional)"
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
                <FormError message={stepErrors.category} />
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabelTooltip label="LGA Coverage" tooltip={UPLOAD_FIELD_TOOLTIPS.lgas} />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 rounded-lg border">
                  {NIGER_STATE_LGAS.map((lga) => (
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
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedLGAs.length} of {NIGER_STATE_LGAS.length} LGAs selected
                </p>
                <FormError message={stepErrors.lgas} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={() => validateStep1() && setCurrentStep(2)}
                >
                  Next: Upload Files
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Upload Files</h2>
                <p className="text-muted-foreground">{UPLOAD_FIELD_TOOLTIPS.files}</p>
              </div>

              <FileUploadArea files={uploadedFiles} onFilesChange={setUploadedFiles} />
              <FormError message={stepErrors.files} />

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button onClick={() => validateStep2() && setCurrentStep(3)}>
                  Next: Settings
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Dataset Settings</h2>
                <p className="text-muted-foreground">
                  Configure visibility and access controls
                </p>
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
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
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
