"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  UserPlus,
  MoreHorizontal,
  RefreshCw,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Pencil,
  KeyRound,
  Check,
  Database,
} from "lucide-react";
import { useAuth, isOrgAdmin } from "@/lib/auth";
import { isOrgMember } from "@/lib/auth/portal-access";
import { apiClient } from "@/lib/api/client";
import type { Organisation } from "@/lib/api/organisations";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/ui/role-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HelpTip } from "@/components/ui/help-tip";
import { formatDate } from "@/lib/utils/date";
import { InviteModal } from "@/components/shared/invite/invite-modal";
import { EditOrganisationModal } from "@/components/shared/organisation/edit-organisation-modal";
import { useOrganisationInvites, useRevokeInvite, useResendInvite } from "@/lib/hooks/useInvites";
import { useOrganisationMembers, useUpdateMemberRole, useRemoveMember } from "@/lib/hooks/useOrganisationMembers";
import { useOrganizationDatasets } from "@/lib/hooks/useDatasets";
import type { InviteResponse } from "@/lib/api/invites";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import {
  DashboardPanel,
  EmptyPanelState,
  FilterChip,
  MetricCard,
} from "@/components/dashboard/portal-dashboard-ui";
import {
  PORTAL_ORG_ACCESS_REQUESTS_TIP,
  PORTAL_ORG_INVITES_TIP,
  PORTAL_ORG_PAGE_TIP,
  PORTAL_ORG_TEAM_TIP,
  PORTAL_DASHBOARD_TEAM_TIP,
} from "@/lib/constants/portal-tooltips";

interface AccessRequestRow {
  id: string;
  reason: string;
  status: "pending" | "approved" | "denied";
  created_at: string;
  requester_email: string;
  requester_name: string;
  dataset_title: string;
  dataset_slug: string;
}

type OrgSection = "overview" | "team" | "invites" | "access-requests";

const sectionFilters: { value: OrgSection; label: string; adminOnly?: boolean }[] = [
  { value: "overview", label: "Overview" },
  { value: "team", label: "Team" },
  { value: "invites", label: "Invites", adminOnly: true },
  { value: "access-requests", label: "Access", adminOnly: true },
];

function InviteStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" />
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="gap-1 border-0 bg-success text-success-foreground">
          <CheckCircle2 className="size-3" />
          Accepted
        </Badge>
      );
    case "revoked":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          Revoked
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function OrganisationManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<OrgSection>("overview");
  const [revokeTarget, setRevokeTarget] = useState<InviteResponse | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    userId: string;
    currentRole: string;
    userName: string;
  } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; userName: string } | null>(
    null,
  );

  const orgId = user?.organisationId;
  const orgName = user?.organisationName;
  const isAdmin = isOrgAdmin(user?.role);

  const { data: organisation, isLoading: orgLoading } = useQuery({
    queryKey: ["organisation", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const response = await apiClient.get<{ data: Organisation }>(`/organisations/${orgId}`);
      return response.data.data;
    },
    enabled: !!orgId,
  });

  const { data: invites, isLoading: invitesLoading } = useOrganisationInvites(
    isAdmin && orgId ? orgId : "",
  );

  const { data: accessRequests, isLoading: accessRequestsLoading } = useQuery({
    queryKey: ["organisation-access-requests", orgId],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { data: AccessRequestRow[] } }>(
        "/admin/access-requests?status=pending",
      );
      return response.data.data.data;
    },
    enabled: isAdmin && !!orgId,
  });

  const { data: datasetsMeta } = useOrganizationDatasets(
    { page: 1, limit: 1 },
    { enabled: !!orgId },
  );

  const approveAccessRequestMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/access-requests/${id}/approve`, {}),
    onSuccess: () => {
      toast.success("Access request approved");
      queryClient.invalidateQueries({ queryKey: ["organisation-access-requests", orgId] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to approve access request"),
  });

  const denyAccessRequestMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.post(`/admin/access-requests/${id}/deny`, { comment: "Denied by organisation admin" }),
    onSuccess: () => {
      toast.success("Access request denied");
      queryClient.invalidateQueries({ queryKey: ["organisation-access-requests", orgId] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to deny access request"),
  });

  const { data: members, isLoading: membersLoading } = useOrganisationMembers(orgId);
  const revokeMutation = useRevokeInvite();
  const resendMutation = useResendInvite();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();

  if (authLoading) {
    return (
      <DashboardPage>
        <div className="border-b bg-background px-4 py-5 sm:px-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <DashboardPageContent>
          <Skeleton className="h-28 rounded-2xl" />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  if (!user || !isOrgMember(user.role)) {
    router.replace("/dashboard");
    return null;
  }

  if (!orgId) {
    return (
      <DashboardPage>
        <DashboardPageContent>
          <EmptyPanelState
            icon={Building2}
            message="You must belong to an organisation to access this page."
            action={
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
                Back to dashboard
              </Link>
            }
          />
        </DashboardPageContent>
      </DashboardPage>
    );
  }

  const pendingInvites = invites?.filter((inv) => inv.status === "pending") ?? [];
  const revokedInvites = invites?.filter((inv) => inv.status === "revoked") ?? [];
  const activeMembers = members ?? [];
  const datasetCount = datasetsMeta?.meta?.total ?? 0;
  const accessRequestCount = accessRequests?.length ?? 0;

  const visibleSections = sectionFilters.filter((s) => !s.adminOnly || isAdmin);

  const confirmRevoke = () => {
    if (!revokeTarget || !orgId) return;
    revokeMutation.mutate(
      { organisationId: orgId, inviteId: revokeTarget.id },
      {
        onSuccess: () => {
          toast.success("Invite revoked");
          setRevokeTarget(null);
        },
        onError: () => toast.error("Failed to revoke invite"),
      },
    );
  };

  const confirmRoleChange = () => {
    if (!roleChangeTarget || !orgId) return;
    const newRole = roleChangeTarget.currentRole === "admin" ? "contributor" : "admin";
    const action = newRole === "admin" ? "promoted" : "demoted";
    updateRoleMutation.mutate(
      { orgId, userId: roleChangeTarget.userId, role: newRole },
      {
        onSuccess: () => {
          toast.success(`Member ${action} successfully`);
          setRoleChangeTarget(null);
        },
        onError: () => toast.error(`Failed to ${action.slice(0, -1)} member`),
      },
    );
  };

  const confirmRemove = () => {
    if (!removeTarget || !orgId) return;
    removeMemberMutation.mutate(
      { orgId, userId: removeTarget.userId },
      {
        onSuccess: () => {
          toast.success("Member removed");
          setRemoveTarget(null);
        },
        onError: () => toast.error("Failed to remove member"),
      },
    );
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1">
              <Building2 className="size-3.5 text-primary" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Organisation
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              {orgName || "Organisation"}
              <HelpTip content={PORTAL_ORG_PAGE_TIP} label="Organisation page help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Manage your profile, team, invites, and dataset access requests."
                : "View your organisation profile and team roster."}
            </p>
          </div>
          {isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="h-11 gap-2 sm:h-10"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil className="size-4" />
                Edit profile
              </Button>
              <Button className="h-11 gap-2 sm:h-10" onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="size-4" />
                Invite member
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Team members"
            value={activeMembers.length}
            hint="Active portal users"
            icon={Users}
            tone="success"
            tip={PORTAL_DASHBOARD_TEAM_TIP}
            onClick={() => setActiveSection("team")}
          />
          {isAdmin ? (
            <MetricCard
              label="Pending invites"
              value={pendingInvites.length}
              hint="Awaiting acceptance"
              icon={Mail}
              tone="warning"
              tip={PORTAL_ORG_INVITES_TIP}
              onClick={() => setActiveSection("invites")}
            />
          ) : null}
          {isAdmin ? (
            <MetricCard
              label="Access requests"
              value={accessRequestCount}
              hint="Restricted datasets"
              icon={KeyRound}
              tone="info"
              tip={PORTAL_ORG_ACCESS_REQUESTS_TIP}
              onClick={() => setActiveSection("access-requests")}
            />
          ) : null}
          <MetricCard
            label="Datasets"
            value={datasetCount}
            hint="Organisation uploads"
            icon={Database}
            tone="primary"
            onClick={() => router.push("/datasets")}
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleSections.map((section) => {
            let count: number | undefined;
            if (section.value === "team") count = activeMembers.length;
            if (section.value === "invites") count = pendingInvites.length;
            if (section.value === "access-requests") count = accessRequestCount;

            return (
              <FilterChip
                key={section.value}
                active={activeSection === section.value}
                label={section.label}
                count={count}
                onClick={() => setActiveSection(section.value)}
              />
            );
          })}
        </div>

        {activeSection === "overview" ? (
          <DashboardPanel title="Organisation profile" icon={Building2} tone="primary">
            {orgLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Name
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{organisation?.name || orgName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Type
                  </dt>
                  <dd className="mt-1 text-sm capitalize">{organisation?.type || "—"}</dd>
                </div>
                {organisation?.description ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{organisation.description}</dd>
                  </div>
                ) : null}
                {organisation?.email ? (
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Mail className="size-3.5" /> Email
                    </dt>
                    <dd className="mt-1 text-sm">{organisation.email}</dd>
                  </div>
                ) : null}
                {organisation?.phone ? (
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Phone className="size-3.5" /> Phone
                    </dt>
                    <dd className="mt-1 text-sm">{organisation.phone}</dd>
                  </div>
                ) : null}
                {organisation?.website ? (
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <Globe className="size-3.5" /> Website
                    </dt>
                    <dd className="mt-1 text-sm">
                      <a
                        href={organisation.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {organisation.website}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {organisation?.address ? (
                  <div>
                    <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <MapPin className="size-3.5" /> Address
                    </dt>
                    <dd className="mt-1 text-sm">{organisation.address}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <Calendar className="size-3.5" /> Created
                  </dt>
                  <dd className="mt-1 text-sm tabular-nums">
                    {organisation?.createdAt ? formatDate(organisation.createdAt) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={organisation?.isActive ? "default" : "secondary"}>
                      {organisation?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            )}
          </DashboardPanel>
        ) : null}

        {activeSection === "team" ? (
          <DashboardPanel
            title="Team members"
            titleTip={PORTAL_ORG_TEAM_TIP}
            description="Active members with portal access."
            icon={Users}
            tone="success"
            action={
              isAdmin ? (
                <Button size="sm" className="h-9 gap-2" onClick={() => setInviteModalOpen(true)}>
                  <UserPlus className="size-4" />
                  Invite
                </Button>
              ) : undefined
            }
          >
            {membersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : activeMembers.length === 0 ? (
              <EmptyPanelState
                icon={Users}
                message="No active members yet."
                action={
                  isAdmin ? (
                    <Button className="h-11 gap-2" onClick={() => setInviteModalOpen(true)}>
                      <UserPlus className="size-4" />
                      Invite member
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="space-y-2">
                {activeMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.fullName || member.email}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <RoleBadge role={member.role} />
                          <span className="text-xs text-muted-foreground">
                            Joined{" "}
                            {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && member.id !== user.id ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-muted">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Member actions</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              setRoleChangeTarget({
                                userId: member.id,
                                currentRole: member.role,
                                userName: member.fullName || member.email,
                              })
                            }
                          >
                            {member.role === "admin" ? "Demote to contributor" : "Promote to admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() =>
                              setRemoveTarget({
                                userId: member.id,
                                userName: member.fullName || member.email,
                              })
                            }
                          >
                            <Ban className="size-4" />
                            Remove from organisation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>
        ) : null}

        {activeSection === "invites" && isAdmin ? (
          <div className="space-y-4">
            <DashboardPanel
              title="Pending invitations"
              titleTip={PORTAL_ORG_INVITES_TIP}
              icon={Mail}
              tone="warning"
            >
              {invitesLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : pendingInvites.length === 0 ? (
                <EmptyPanelState icon={Mail} message="No pending invitations." />
              ) : (
                <ul className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <li key={invite.id} className="rounded-xl border p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{invite.invitedEmail}</p>
                            <InviteStatusBadge status={invite.status} />
                            <RoleBadge role={invite.role} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Invited by {invite.invitedByName} · Sent{" "}
                            {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires{" "}
                            {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex size-10 shrink-0 items-center justify-center rounded-md hover:bg-muted">
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                orgId &&
                                resendMutation.mutate(
                                  { organisationId: orgId, inviteId: invite.id },
                                  {
                                    onSuccess: () => toast.success("Invite resent"),
                                    onError: () => toast.error("Failed to resend invite"),
                                  },
                                )
                              }
                              disabled={resendMutation.isPending}
                            >
                              <RefreshCw className="size-4" />
                              Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setRevokeTarget(invite)}
                            >
                              <Ban className="size-4" />
                              Revoke
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardPanel>

            {revokedInvites.length > 0 ? (
              <DashboardPanel title="Revoked invitations" icon={Mail} tone="muted">
                <ul className="space-y-2 opacity-80">
                  {revokedInvites.map((invite) => (
                    <li key={invite.id} className="rounded-xl border p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{invite.invitedEmail}</span>
                        <InviteStatusBadge status={invite.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Invited {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                      </p>
                    </li>
                  ))}
                </ul>
              </DashboardPanel>
            ) : null}
          </div>
        ) : null}

        {activeSection === "access-requests" && isAdmin ? (
          <DashboardPanel
            title="Access requests"
            titleTip={PORTAL_ORG_ACCESS_REQUESTS_TIP}
            description="Pending requests to download restricted datasets."
            icon={KeyRound}
            tone="info"
          >
            {accessRequestsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : !accessRequests || accessRequests.length === 0 ? (
              <EmptyPanelState
                icon={KeyRound}
                message="No pending access requests for your restricted datasets."
              />
            ) : (
              <ul className="space-y-3">
                {accessRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      {request.dataset_slug ? (
                        <Link
                          href={`/datasets/${request.dataset_slug}`}
                          className="font-medium hover:text-primary"
                        >
                          {request.dataset_title}
                        </Link>
                      ) : (
                        <p className="font-medium">{request.dataset_title}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {request.requester_name || request.requester_email} ·{" "}
                        {request.requester_email} ·{" "}
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{request.reason}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="h-10 flex-1 gap-1.5 sm:h-9 sm:flex-none"
                        onClick={() => approveAccessRequestMutation.mutate(request.id)}
                        disabled={
                          approveAccessRequestMutation.isPending ||
                          denyAccessRequestMutation.isPending
                        }
                      >
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 flex-1 gap-1.5 text-destructive hover:text-destructive sm:h-9 sm:flex-none"
                        onClick={() => denyAccessRequestMutation.mutate(request.id)}
                        disabled={
                          approveAccessRequestMutation.isPending ||
                          denyAccessRequestMutation.isPending
                        }
                      >
                        <XCircle className="size-4" />
                        Deny
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardPanel>
        ) : null}
      </DashboardPageContent>

      {isAdmin ? (
        <>
          <InviteModal
            open={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            organisationId={orgId}
          />
          {organisation ? (
            <EditOrganisationModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              organisation={organisation}
            />
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke invitation"
        description={`Revoke the invite for ${revokeTarget?.invitedEmail}?`}
        confirmLabel="Revoke"
        variant="destructive"
        isLoading={revokeMutation.isPending}
        onConfirm={confirmRevoke}
      />

      <ConfirmDialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
        title="Change member role"
        description={
          roleChangeTarget
            ? `${roleChangeTarget.currentRole === "admin" ? "Demote" : "Promote"} ${roleChangeTarget.userName} to ${roleChangeTarget.currentRole === "admin" ? "contributor" : "admin"}?`
            : ""
        }
        confirmLabel="Confirm"
        isLoading={updateRoleMutation.isPending}
        onConfirm={confirmRoleChange}
      />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member"
        description={`Remove ${removeTarget?.userName} from the organisation? They will lose access to organisation data.`}
        confirmLabel="Remove"
        variant="destructive"
        isLoading={removeMemberMutation.isPending}
        onConfirm={confirmRemove}
      />
    </DashboardPage>
  );
}
