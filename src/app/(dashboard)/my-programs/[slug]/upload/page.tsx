"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { DashboardPanel, EmptyPanelState } from "@/components/dashboard/portal-dashboard-ui";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FormError } from "@/components/forms/form-error";
import { useOrganizationProgram, useCreateProgramReport } from "@/lib/hooks/usePrograms";
import { uploadFile } from "@/lib/api/uploads";
import { submitDocumentForReview } from "@/lib/api/documents";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { programReportSchema, type ProgramReportFormData } from "@/lib/schemas/program";
import { PORTAL_PROGRAM_UPLOAD_TIP } from "@/lib/constants/portal-tooltips";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function UploadProgrammeReportPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { canUpload, canAccess } = useProgramPermissions();
  const { data: programme, isLoading } = useOrganizationProgram(slug);
  const createReportMutation = useCreateProgramReport();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<ProgramReportFormData>({
    resolver: zodResolver(programReportSchema),
    defaultValues: { fileFormat: "PDF" },
  });

  const isBusy = formIsSubmitting || createReportMutation.isPending || isRedirecting;

  if (isLoading) {
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-4 sm:px-6">
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="border-b bg-background px-4 py-5 sm:px-6">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
        <DashboardPageContent className="mx-auto max-w-3xl">
          <Skeleton className="h-96 rounded-2xl" />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (!canAccess || !canUpload) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={ClipboardList}
            message={
              !canAccess
                ? "Your organisation does not have permission to manage programmes."
                : "You do not have permission to upload programme reports."
            }
            action={
              <Link
                href={canAccess ? "/my-programs" : "/dashboard"}
                className={cn(buttonVariants({ variant: "outline" }), "h-11")}
              >
                {canAccess ? "Back to programmes" : "Back to dashboard"}
              </Link>
            }
          />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (!programme) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={FileText}
            message="Programme not found, or it doesn't belong to your organisation."
            action={
              <Link href="/my-programs" className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
                Back to programmes
              </Link>
            }
          />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  const onSubmit = async (data: ProgramReportFormData) => {
    if (files.length === 0) {
      toast.error("Attach a report file before submitting");
      return;
    }
    const file = files[0];
    try {
      const report = await createReportMutation.mutateAsync({
        slug: programme.slug,
        data: {
          title: data.title,
          description: data.notes || data.title,
        },
      });
      await uploadFile(file.file, undefined, report.id);
      try {
        await submitDocumentForReview(report.slug);
        toast.success("Report submitted for admin review");
      } catch {
        toast.success(
          "Report uploaded as draft — submit it from My documents once the file finishes processing",
        );
      }
      setIsRedirecting(true);
      router.push(`/dashboard/documents/${report.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload report");
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
          <Link href="/my-programs" className="hover:text-foreground">
            Programmes
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <Link href={`/my-programs/${programme.slug}`} className="truncate hover:text-foreground">
            {programme.name}
          </Link>
          <ChevronRight className="size-3.5 shrink-0 sm:size-4" />
          <span className="text-foreground">Upload report</span>
        </nav>
      </div>

      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4">
          <Link
            href={`/my-programs/${programme.slug}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-10 w-fit gap-2 px-0 hover:bg-transparent",
            )}
          >
            <ArrowLeft className="size-4" />
            Back to programme
          </Link>
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-info/25 bg-info/[0.06] px-2.5 py-1">
              <Upload className="size-3.5 text-info" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-info">
                Programme report
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Upload report
              <HelpTip content={PORTAL_PROGRAM_UPLOAD_TIP} label="Upload programme report help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Attach a document to <span className="font-medium text-foreground">{programme.name}</span>.
              PDF, Word, and Excel formats up to 25 MB.
            </p>
          </div>
        </div>
      </div>

      <DashboardPageContent className="mx-auto w-full max-w-3xl">
        <DashboardPanel
          title="Report details"
          description="Final reports, monitoring briefs, or evaluation documents linked to this programme."
          icon={FileText}
          tone="info"
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
                Report title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                aria-invalid={!!errors.title}
                {...register("title")}
                placeholder="Q1 2026 Monitoring Report"
                disabled={isBusy}
              />
              <FormError message={errors.title?.message} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Format</label>
              <Controller
                name="fileFormat"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "PDF"}
                    onValueChange={field.onChange}
                    disabled={isBusy}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="DOCX">Word (DOCX)</SelectItem>
                      <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="notes">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                rows={3}
                {...register("notes")}
                placeholder="Brief context for reviewers — reporting period, audience, etc."
                disabled={isBusy}
              />
            </div>

            <FileUploadArea
              files={files}
              onFilesChange={setFiles}
              accept=".pdf,.docx,.xlsx"
              maxSizeMB={25}
            />

            <Button
              type="submit"
              disabled={isBusy}
              className="h-11 w-full gap-2 sm:w-auto"
            >
              {isBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Uploading report…
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  Upload report
                </>
              )}
            </Button>
          </form>
        </DashboardPanel>
      </DashboardPageContent>
    </DashboardPage>
  );
}
