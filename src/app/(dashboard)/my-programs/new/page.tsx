"use client";

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

export default function NewProgrammePage() {
  const router = useRouter();
  const { canAccess, canCreate } = useProgramPermissions();
  const { user, isLoading } = useAuth();
  const createMutation = useCreateProgram();

  if (isLoading || !user) {
    return null;
  }

  if (!canAccess || !canCreate) {
    return (
      <Container className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">
          {!canAccess
            ? "Your organisation does not have permission to manage programmes."
            : "You do not have permission to create programmes. Contact your Organisation Admin."}
        </p>
        <Link href={canAccess ? "/my-programs" : "/dashboard"}>
          <Button variant="outline">
            {canAccess ? "Back to My Programmes" : "Back to dashboard"}
          </Button>
        </Link>
      </Container>
    );
  }

  const handleSubmit = async (data: ProgramFormData) => {
    try {
      const programme = await createMutation.mutateAsync(data);
      toast.success(`Programme "${programme.name}" created`);
      router.push(`/programs/${programme.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create programme");
    }
  };

  return (
    <main className="flex-1">
      <Container className="py-8 max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/my-programs">
            <Button variant="ghost" size="icon" aria-label="Back to My Programmes">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create Programme</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Register a new health programme for your organisation
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Programme Details</CardTitle>
            <CardDescription>
              This programme will belong to your organisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramForm onSubmit={handleSubmit} submitLabel="Create Programme" />
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
