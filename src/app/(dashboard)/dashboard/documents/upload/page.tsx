"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useCreateOrgDocument, useSubmitDocumentForReview } from "@/lib/hooks/useDocuments";
import { uploadFile } from "@/lib/api/uploads";
import { useAuth } from "@/lib/auth";
import type { DocumentCategory } from "@/types";
import { toast } from "sonner";

const DOCUMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv,.json,.png,.jpg,.jpeg,.gif,.webp,.tif,.tiff,.svg,.geojson,.gpkg,.kml,.kmz,.zip";

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum([
    "sop",
    "policy",
    "guideline",
    "report",
    "research",
    "evaluation",
  ]),
  author: z.string().optional(),
  submitNow: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function UploadOrgDocumentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createMutation = useCreateOrgDocument();
  const submitMutation = useSubmitDocumentForReview();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "report", submitNow: true },
  });

  const canContribute =
    user && ["contributor", "admin"].includes(user.role);

  if (!canContribute) {
    return (
      <Container className="py-16 text-center text-muted-foreground">
        Document upload requires a contributor or organisation admin account.
      </Container>
    );
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
        // File validation is async — brief delay then submit; if file_path
        // is not yet written the API returns a clear error.
        try {
          await submitMutation.mutateAsync(doc.slug);
          toast.success("Document uploaded and submitted for review");
        } catch {
          toast.success(
            "Document uploaded as draft — open it and submit once the file finishes processing"
          );
        }
      } else {
        toast.success("Document saved as draft");
      }
      router.push(`/dashboard/documents/${doc.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1">
      <Container className="max-w-2xl py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/documents">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Upload document</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Files go to admin review before the public document library.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="size-5" />
              Document details
            </CardTitle>
            <CardDescription>
              PDF, Office, images, GeoJSON/GPKG, and related formats are accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="title">
                  Title
                </label>
                <Input id="title" {...register("title")} placeholder="Malaria Case Management SOP" />
                <FormError message={errors.title?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
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
                  Description
                </label>
                <Textarea id="description" rows={3} {...register("description")} />
                <FormError message={errors.description?.message} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="author">
                  Author (optional)
                </label>
                <Input id="author" {...register("author")} />
              </div>

              <FileUploadArea
                files={files}
                onFilesChange={setFiles}
                accept={DOCUMENT_ACCEPT}
                maxSizeMB={50}
              />

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  "Upload & submit for review"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
