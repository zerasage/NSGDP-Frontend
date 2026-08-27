"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Plus, Edit, Trash2, Eye, Search, Upload } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOrganizationPrograms, useDeleteProgram } from "@/lib/hooks/usePrograms";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

type RawStatus = "active" | "completed" | "suspended" | "archived";

const statusFilters: { value: RawStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

function statusBadge(status: RawStatus | undefined) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">Completed</Badge>;
    case "suspended":
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0">Suspended</Badge>;
    case "archived":
      return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-0">Active</Badge>;
  }
}

export default function MyProgrammesPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { canAccess, canCreate, canUpload, canDelete, can } = useProgramPermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RawStatus | "all">(
    (searchParams?.get("status") as RawStatus) || "all"
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<{ slug: string; name: string } | null>(null);

  const { data, isLoading, error } = useOrganizationPrograms(
    {
      page: 1,
      limit: 50,
      status: statusFilter !== "all" ? statusFilter : undefined,
      q: searchQuery || undefined,
    },
    { enabled: !!user?.id && canAccess }
  );

  // Separate unfiltered fetch, decoupled from the active tab, so switching
  // tabs doesn't collapse every other tab's count to 0.
  const { data: countsData } = useOrganizationPrograms(
    { page: 1, limit: 100 },
    { enabled: !!user?.id && canAccess }
  );
  const allForCounts = countsData?.data || [];

  const deleteMutation = useDeleteProgram();

  const programmes = data?.data || [];
  const meta = data?.meta;

  const canEdit = can("edit");
  const canUploadReport = canUpload;

  const handleDelete = (slug: string, name: string) => {
    setSelectedProgramme({ slug, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedProgramme) return;
    deleteMutation.mutate(selectedProgramme.slug, {
      onSuccess: () => {
        toast.success("Programme archived");
        setSelectedProgramme(null);
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to archive programme");
      },
    });
  };

  const statusCounts: Record<RawStatus | "all", number> = {
    all: allForCounts.length,
    active: allForCounts.filter((p) => p.rawStatus === "active").length,
    completed: allForCounts.filter((p) => p.rawStatus === "completed").length,
    suspended: allForCounts.filter((p) => p.rawStatus === "suspended").length,
    archived: allForCounts.filter((p) => p.rawStatus === "archived").length,
  };

  if (!canAccess) {
    return (
      <main className="flex-1 bg-muted/40">
        <Container size="wide" className="py-16">
          <EmptyState
            icon={LayoutGrid}
            title="Programmes not available"
            description="Your organisation has not been granted programme access. Contact a super administrator to request it via an Organisation Group."
            action={{ label: "Back to dashboard", href: "/dashboard" }}
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-muted/40">
      <div className="border-b bg-background">
        <Container size="wide" className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Programmes</h1>
              <p className="mt-2 text-muted-foreground">
                Manage your organisation&apos;s programmes and campaigns
              </p>
            </div>
            {canCreate && (
              <Link href="/my-programs/new">
                <Button>
                  <Plus className="size-4 mr-2" />
                  Create Programme
                </Button>
              </Link>
            )}
          </div>
        </Container>
      </div>

      <Container size="wide" className="py-8">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted border"
              }`}
            >
              {filter.label}
              {statusCounts[filter.value] > 0 && (
                <span className="ml-2 opacity-75">({statusCounts[filter.value]})</span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search programmes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load programmes</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        ) : !user?.organisationId ? (
          <EmptyState
            icon={LayoutGrid}
            title="No organisation linked"
            description="Your account isn't linked to an organisation yet, so there are no programmes to manage here."
          />
        ) : programmes.length === 0 ? (
          <EmptyState
            icon={LayoutGrid}
            title={searchQuery ? "No programmes found" : "No programmes yet"}
            description={
              searchQuery
                ? "Try adjusting your search or filters"
                : "Create your first programme to get started."
            }
            action={
              searchQuery || !canCreate
                ? undefined
                : { label: "Create Programme", href: "/my-programs/new" }
            }
          />
        ) : (
          <>
            <div className="rounded-lg border bg-background overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium">Programme</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Completion</th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Last Updated</th>
                      <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {programmes.map((programme) => (
                      <tr key={programme.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <LayoutGrid className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <Link
                                href={`/programs/${programme.slug}`}
                                className="font-medium hover:text-primary transition-colors block mb-1"
                              >
                                {programme.name}
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {programme.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{statusBadge(programme.rawStatus)}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground capitalize">{programme.type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">{programme.completionPercent}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {programme.updatedAt ? formatDate(programme.updatedAt) : "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/programs/${programme.slug}`}>
                              <Button size="sm" variant="ghost">
                                <Eye className="size-4" />
                              </Button>
                            </Link>
                            {canUploadReport && (
                              <Link href={`/my-programs/${programme.slug}/upload`}>
                                <Button size="sm" variant="ghost" title="Upload report">
                                  <Upload className="size-4" />
                                </Button>
                              </Link>
                            )}
                            {canEdit && (
                              <Link href={`/my-programs/${programme.slug}/edit`}>
                                <Button size="sm" variant="ghost">
                                  <Edit className="size-4" />
                                </Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(programme.slug, programme.name)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Showing {programmes.length} of {meta?.total || 0} programmes
            </p>
          </>
        )}
      </Container>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Archive Programme"
        description={`Are you sure you want to archive "${selectedProgramme?.name}"? This can be reversed by an administrator.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </main>
  );
}
