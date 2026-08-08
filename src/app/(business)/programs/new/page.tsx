"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgramForm } from "@/components/programs/program-form";
import { useCreateProgram } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { useAuth } from "@/lib/auth";
import type { ProgramFormData } from "@/lib/schemas/program";
import { toast } from "sonner";

export default function NewProgramPage() {
  const router = useRouter();
  const { canCreate } = useProgramPermissions();
  const { user, isLoading } = useAuth();
  const createMutation = useCreateProgram();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return null;
  }

  if (!canCreate) {
    return (
      <Container className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">
          You do not have permission to create programmes. Contact your Organisation Admin or
          request the <strong>Create Programmes</strong> permission via a user group.
        </p>
        <Link href="/programs">
          <Button variant="outline">Back to Programmes</Button>
        </Link>
      </Container>
    );
  }

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      const program = await createMutation.mutateAsync(data);
      toast.success(`Programme "${program.name}" created`);
      router.push(`/programs/${program.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create programme");
    }
  };

  return (
    <main className="flex-1">
      <Container className="py-8 max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/programs">
            <Button variant="ghost" size="icon" aria-label="Back to programmes">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Programme</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Register a new health programme for monitoring and reporting
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Programme Details</CardTitle>
            <CardDescription>
              Required for org admins, repository admins, and delegated programme leads.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramForm
              onSubmit={handleSubmit}
              submitLabel="Create Programme"
              organisationIds={
                user.role === "admin" && user.organisationId ? [user.organisationId] : undefined
              }
            />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
