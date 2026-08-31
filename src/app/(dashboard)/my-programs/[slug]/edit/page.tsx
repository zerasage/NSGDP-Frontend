"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgramForm, programToFormDefaults } from "@/components/programs/program-form";
import { ProgramProgressPanel } from "@/components/programs/program-progress-panel";
import { useOrganizationProgram, useUpdateProgram, useDeleteProgram } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import type { ProgramFormData } from "@/lib/schemas/program";
import { toast } from "sonner";

export default function EditProgrammePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showProgress = searchParams.get("progress") === "1";
  const { can, canDelete, canAccess } = useProgramPermissions();
  const { data: programme, isLoading, error } = useOrganizationProgram(slug);
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();

  if (isLoading) {
    return (
      <Container className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading…
      </Container>
    );
  }

  if (!canAccess || !can("edit")) {
    return (
      <Container className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">
          {!canAccess
            ? "Your organisation does not have permission to manage programmes."
            : "You do not have permission to edit programmes."}
        </p>
        <Link href={canAccess ? "/my-programs" : "/dashboard"}>
          <Button variant="outline">
            {canAccess ? "Back to My Programmes" : "Back to dashboard"}
          </Button>
        </Link>
      </Container>
    );
  }

  if (error || !programme) {
    return (
      <Container className="py-16 text-center text-muted-foreground">
        Programme not found, or it doesn&apos;t belong to your organisation.{" "}
        <Link href="/my-programs" className="text-primary hover:underline">
          Back to My Programmes
        </Link>
      </Container>
    );
  }

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      await updateMutation.mutateAsync({ slug: programme.slug, data });
      toast.success("Programme updated");
      router.push("/my-programs");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update programme");
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (!window.confirm(`Archive "${programme.name}"? This can be reversed by an administrator.`)) return;
    deleteMutation.mutate(programme.slug, {
      onSuccess: () => {
        toast.success("Programme archived");
        router.push("/my-programs");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to archive programme");
      },
    });
  };

  return (
    <main className="flex-1">
      <Container className="py-8 max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/my-programs">
              <Button variant="ghost" size="icon" aria-label="Back">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Edit Programme</h1>
              <p className="text-sm text-muted-foreground mt-1">{programme.name}</p>
            </div>
          </div>
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Archive
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {showProgress && (
            <ProgramProgressPanel
              programme={programme}
              onSuccess={() => router.refresh()}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Programme Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgramForm
                defaultValues={programToFormDefaults(programme)}
                onSubmit={handleSubmit}
                submitLabel="Save Changes"
                isEditing
              />
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  );
}
