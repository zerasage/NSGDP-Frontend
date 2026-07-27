"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Settings, X, Loader2 } from "lucide-react";
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
import { useDataset, useUpdateDataset, useDatasetFiles } from "@/lib/hooks/useDatasets";
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
import type { DatasetVisibility } from "@/lib/api/datasets";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Manage Files", icon: Upload },
  { id: 3, name: "Settings", icon: Settings },
];

export default function EditDatasetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  // Fetch dataset from API
  const { data: dataset, isLoading: loading, error } = useDataset(resolvedParams.slug);
  const { data: existingFiles } = useDatasetFiles(resolvedParams.slug);
  const { data: categoriesData } = useCategories();
  const updateMutation = useUpdateDataset();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<DatasetVisibility>("public");
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);

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
      setVisibility(dataset.visibility);
    }
  }, [dataset]);

  // Handle not found
  useEffect(() => {
    if (error) {
      toast.error("Dataset not found");
      router.push("/datasets");
    }
  }, [error, router]);

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
    if ((existingFiles?.length ?? 0) === 0 && newFiles.length === 0) {
      setStepErrors({ files: "Keep at least one file or upload a replacement" });
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

  const handleSave = async (isDraft: boolean) => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    
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
      router.push("/datasets");
    } catch (error) {
      toast.error("Failed to update dataset");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 bg-muted/40">
        <Container className="py-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="size-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dataset...</p>
          </div>
        </Container>
      </main>
    );
  }

  if (!dataset) return null;

  return (
    <main className="flex-1 bg-muted/40">
      <div className="border-b bg-background">
        <Container size="wide" className="py-8">
          <h1 className="text-3xl font-bold">Edit Dataset</h1>
          <p className="mt-2 text-muted-foreground">{dataset.title}</p>
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
                  Update essential details about your dataset
                </p>
              </div>

              <div>
                <FieldLabelTooltip
                  htmlFor="title"
                  label="Dataset Title"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.title}
                />
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                <Button onClick={() => validateStep1() && setCurrentStep(2)}>
                  Next: Manage Files
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Manage Files</h2>
                <p className="text-muted-foreground">{UPLOAD_FIELD_TOOLTIPS.files}</p>
              </div>

              {existingFiles && existingFiles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Current Files ({existingFiles.length})</h3>
                  {existingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-4 rounded-lg border"
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
                  {(["public", "restricted", "private"] as DatasetVisibility[]).map((vis) => (
                    <button
                      key={vis}
                      type="button"
                      onClick={() => setVisibility(vis)}
                      aria-pressed={visibility === vis}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        visibility === vis
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
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

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
                    Save as Draft
                  </Button>
                  <Button onClick={() => handleSave(false)} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
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
