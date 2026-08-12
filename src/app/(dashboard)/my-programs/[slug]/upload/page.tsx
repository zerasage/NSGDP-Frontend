"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FormError } from "@/components/forms/form-error";
import { useOrganizationProgram, useCreateProgramReport } from "@/lib/hooks/usePrograms";
import { uploadFile } from "@/lib/api/uploads";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { programReportSchema, type ProgramReportFormData } from "@/lib/schemas/program";
import { toast } from "sonner";

export default function UploadProgrammeReportPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { canUpload } = useProgramPermissions();
  const { data: programme, isLoading } = useOrganizationProgram(slug);
  const createReportMutation = useCreateProgramReport();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProgramReportFormData>({
    resolver: zodResolver(programReportSchema),
    defaultValues: { fileFormat: "PDF" },
  });

  if (isLoading) {
    return (
      <Container className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading…
      </Container>
    );
  }

  if (!programme) {
    return (
      <Container className="py-16 text-center text-muted-foreground">
        Programme not found, or it doesn&apos;t belong to your organisation.
      </Container>
    );
  }

  if (!canUpload) {
    return (
      <Container className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">
          Upload requires the <strong>Upload Programme Reports</strong> permission.
        </p>
        <Link href="/my-programs">
          <Button variant="outline">Back to My Programmes</Button>
        </Link>
      </Container>
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
      toast.success("Report uploaded — pending admin review before it appears publicly");
      router.push("/my-programs");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload report");
    }
  };

  return (
    <main className="flex-1">
      <Container className="py-8 max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/my-programs">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Upload Programme Report</h1>
            <p className="text-sm text-muted-foreground mt-1">{programme.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Report / Document
            </CardTitle>
            <CardDescription>
              Final reports, monitoring briefs, or evaluation documents linked to this programme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block" htmlFor="title">
                  Report Title
                </label>
                <Input id="title" {...register("title")} placeholder="Q1 2026 Monitoring Report" />
                <FormError message={errors.title?.message} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Format</label>
                <Controller
                  name="fileFormat"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? "PDF"} onValueChange={field.onChange}>
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
                <label className="text-sm font-medium mb-1.5 block" htmlFor="notes">
                  Notes (optional)
                </label>
                <Textarea id="notes" rows={2} {...register("notes")} />
              </div>

              <FileUploadArea
                files={files}
                onFilesChange={setFiles}
                accept=".pdf,.docx,.xlsx"
                maxSizeMB={25}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Uploading…" : "Upload Report"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
