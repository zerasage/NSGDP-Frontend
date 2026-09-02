"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { HelpTip } from "@/components/ui/help-tip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel } from "@/components/dashboard/portal-dashboard-ui";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FormError } from "@/components/forms/form-error";
import { useCreateOrgDocument, useSubmitDocumentForReview } from "@/lib/hooks/use-org-documents";
import { uploadFile } from "@/lib/api/uploads";
import { useRequireOrgMember } from "@/lib/hooks/useRequireOrgMember";
import { PORTAL_DOCUMENT_UPLOAD_PAGE_TIP } from "@/lib/constants/portal-tooltips";
import type { DocumentCategory } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.json,.png,.jpg,.jpeg,.gif,.webp,.tif,.tiff,.svg,.geojson,.gpkg,.kml,.kmz,.zip";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["sop", "policy", "guideline", "report", "research", "evaluation"]),
  author: z.string().optional(),
  submitNow: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function UploadOrgDocumentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, allowed } = useRequireOrgMember();
  const createMutation = useCreateOrgDocument();
  const submitMutation = useSubmitDocumentForReview();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isBusy = submitting || isRedirecting;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "report", submitNow: true },
  });

  if (authLoading || !allowed) {
    return null;
  }

  const onSubmit = async (data: FormData) => {
    if (files.length === 0) {
      toast.error("Attach a file before uploading");
      return;
    }
    setSubmitting(true);
    try {
      const doc = await createMutation.mutateAsync({
        title: data.title,
        description: data.description,
        type: data.type as DocumentCategory,
        author: data.author || undefined,
      });
      await uploadFile(files[0].file, undefined, doc.id);
      if (data.submitNow !== false) {
        try {
          await submitMutation.mutateAsync(doc.slug);
          toast.success("Document uploaded and submitted for review");
        } catch {
          toast.success(
            "Document uploaded as draft — open it and submit once the file finishes processing",
          );
        }
      } else {
        toast.success("Document saved as draft");
      }
      setIsRedirecting(true);
      router.push(`/dashboard/documents/${doc.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <Link href="/dashboard/documents" className="hover:text-foreground">
            Documents
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <span className="text-foreground">Upload</span>
        </nav>
      </div>

      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard/documents"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 w-fit gap-2 px-0 hover:bg-transparent",
            )}
          >
            <ArrowLeft className="size-4" />
            Back to documents
          </Link>
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-2.5 py-1">
              <Upload className="size-3.5 text-success" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-success">
                New document
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Upload document
              <HelpTip content={PORTAL_DOCUMENT_UPLOAD_PAGE_TIP} label="Upload document help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Files go to admin review before the public document library
              {user?.organisationName ? ` · ${user.organisationName}` : ""}.
            </p>
          </div>
        </div>
      </div>

      <DashboardPageContent className="mx-auto w-full max-w-3xl">
        <DashboardPanel
          title="Document details"
          description="PDF, Office, images, GeoJSON/GPKG, and related formats up to 50 MB."
          icon={FileText}
          tone="success"
        >
          <form
            onSubmit={handleSubmit(onSubmit, () => {
              toast.error("Please fix the highlighted fields before submitting.");
            })}
            className="space-y-5"
            noValidate
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                className="h-11"
                {...register("title")}
                placeholder="Malaria Case Management SOP"
                disabled={isBusy}
              />
              <FormError message={errors.title?.message} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isBusy}>
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sop">SOP</SelectItem>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="guideline">Guideline</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="description">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="description"
                rows={3}
                {...register("description")}
                disabled={isBusy}
              />
              <FormError message={errors.description?.message} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="author">
                Author (optional)
              </label>
              <Input id="author" className="h-11" {...register("author")} disabled={isBusy} />
            </div>

            <FileUploadArea
              files={files}
              onFilesChange={setFiles}
              accept={DOCUMENT_ACCEPT}
              maxSizeMB={50}
            />

            <Button type="submit" disabled={isBusy} className="h-11 w-full gap-2 sm:w-auto">
              {isBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  Upload & submit for review
                </>
              )}
            </Button>
          </form>
        </DashboardPanel>
      </DashboardPageContent>
    </DashboardPage>
  );
}
