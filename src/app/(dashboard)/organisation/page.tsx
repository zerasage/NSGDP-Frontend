"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  MapPin,
  UserPlus,
  MoreVertical,
  RefreshCw,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api/client";
import type { Organisation } from "@/lib/api/organisations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/ui/role-badge";
import { formatDate } from "@/lib/utils/date";
import { InviteModal } from "@/components/shared/invite/invite-modal";
import { EditOrganisationModal } from "@/components/shared/organisation/edit-organisation-modal";
import { useOrganisationInvites, useRevokeInvite, useResendInvite } from "@/lib/hooks/useInvites";
import { useOrganisationMembers, useUpdateMemberRole, useRemoveMember } from "@/lib/hooks/useOrganisationMembers";
import type { InviteResponse } from "@/lib/api/invites";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";

export default function OrganisationManagementPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const orgId = user?.organisationId;
  const orgName = user?.organisationName;
  const isAdmin = user?.role === "admin";

  // Fetch full organization details
  const { data: organisation, isLoading: orgLoading } = useQuery({
    queryKey: ['organisation', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const response = await apiClient.get<{ data: Organisation }>(`/organisations/${orgId}`);
      return response.data.data;
    },
    enabled: !!orgId,
  });

  // Fetch invites for this org - only if admin and we have an orgId
  const { data: invites, isLoading: invitesLoading, error } = useOrganisationInvites(
    isAdmin && orgId ? orgId : ""
  );
  
  // Fetch organisation members
  const { data: members, isLoading: membersLoading } = useOrganisationMembers(orgId);

  const revokeMutation = useRevokeInvite();
  const resendMutation = useResendInvite();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();

  // Log error for debugging (but don't show toast)
  if (error) {
    console.error("Failed to fetch invites:", error);
  }

  // Wait for auth to load
  if (authLoading) {
    return (
      <DashboardPage>
        <DashboardPageHeader
          title="Organization Management"
          description="Loading..."
        />
      </DashboardPage>
    );
  }

  // Role guard - only contributor and admin can access
  if (!user || (user.role !== "contributor" && user.role !== "admin")) {
    router.replace("/dashboard");
    return null;
  }

  // Check if user has an organisation
  if (!orgId) {
    return (
      <DashboardPage>
        <DashboardPageHeader
          title="Organization Management"
          description="You must belong to an organization to access this page"
        />
      </DashboardPage>
    );
  }

  const pendingInvites = invites?.filter((inv) => inv.status === "pending") || [];
  const revokedInvites = invites?.filter((inv) => inv.status === "revoked") || [];
  const activeMembers = members || [];

  const handleRevokeInvite = (invite: InviteResponse) => {
    if (!orgId) return;
    
    if (window.confirm(`Revoke invite for ${invite.invitedEmail}?`)) {
      revokeMutation.mutate(
        { organisationId: orgId, inviteId: invite.id },
        {
          onSuccess: () => {
            toast.success("Invite revoked successfully");
          },
          onError: () => {
            toast.error("Failed to revoke invite");
          },
        }
      );
    }
  };

  const handleResendInvite = (invite: InviteResponse) => {
    if (!orgId) return;

    resendMutation.mutate(
      { organisationId: orgId, inviteId: invite.id },
      {
        onSuccess: () => {
          toast.success("Invite resent successfully");
        },
        onError: () => {
          toast.error("Failed to resend invite");
        },
      }
    );
  };

  const handlePromoteDemote = (userId: string, currentRole: string, userName: string) => {
    if (!orgId) return;
    
    const newRole = currentRole === 'admin' ? 'contributor' : 'admin';
    const action = newRole === 'admin' ? 'promote' : 'demote';
    
    if (window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${userName} to ${newRole}?`)) {
      updateRoleMutation.mutate(
        { orgId, userId, role: newRole },
        {
          onSuccess: () => {
            toast.success(`Member ${action}d successfully`);
          },
          onError: () => {
            toast.error(`Failed to ${action} member`);
          },
        }
      );
    }
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    if (!orgId) return;
    
    if (window.confirm(`Remove ${userName} from the organisation? This action cannot be undone.`)) {
      removeMemberMutation.mutate(
        { orgId, userId },
        {
          onSuccess: () => {
            toast.success("Member removed successfully");
          },
          onError: () => {
            toast.error("Failed to remove member");
          },
        }
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Revoked
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardPage>
      <DashboardPageHeader
        title={orgName || "Organization Management"}
        description="Manage your organization profile, team members, and invitations"
        actions={
          isAdmin ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          ) : undefined
        }
      />

      <DashboardPageContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid !h-auto p-2 bg-muted rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm !h-auto py-3 px-4 rounded-md">
              <Building2 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-background data-[state=active]:shadow-sm !h-auto py-3 px-4 rounded-md">
              <Users className="h-4 w-4 mr-2" />
              Team Members
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="invites" className="data-[state=active]:bg-background data-[state=active]:shadow-sm !h-auto py-3 px-4 rounded-md">
                <Mail className="h-4 w-4 mr-2" />
                Invitations ({pendingInvites.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  View and manage your organization&apos;s profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {orgLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Organization Name
                        </label>
                        <p className="text-lg font-semibold">{organisation?.name || orgName || "—"}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Organization Type
                        </label>
                        <p className="text-lg capitalize">{organisation?.type || "—"}</p>
                      </div>
                    </div>

                    {organisation?.description && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Description
                        </label>
                        <p className="text-sm">{organisation.description}</p>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      {organisation?.email && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </label>
                          <p className="text-sm">{organisation.email}</p>
                        </div>
                      )}
                      {organisation?.phone && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Phone
                          </label>
                          <p className="text-sm">{organisation.phone}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {organisation?.website && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website
                          </label>
                          <a 
                            href={organisation.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {organisation.website}
                          </a>
                        </div>
                      )}
                      {organisation?.address && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Address
                          </label>
                          <p className="text-sm">{organisation.address}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        {organisation?.createdAt && (
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Created
                            </label>
                            <p className="text-sm">
                              {formatDate(organisation.createdAt)}
                            </p>
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-muted-foreground">
                            Status
                          </label>
                          <Badge variant={organisation?.isActive ? "default" : "secondary"}>
                            {organisation?.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Quick Stats</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setActiveTab("team")}
                    >
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{activeMembers.length}</div>
                        <p className="text-sm text-muted-foreground">Active Members</p>
                      </CardContent>
                    </Card>
                    {isAdmin && (
                      <Card 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setActiveTab("invites")}
                      >
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{pendingInvites.length}</div>
                          <p className="text-sm text-muted-foreground">Pending Invites</p>
                        </CardContent>
                      </Card>
                    )}
                    <Card 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push("/datasets")}
                    >
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-sm text-muted-foreground">Datasets</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Team Members</CardTitle>
                <CardDescription>
                  Members who have accepted their invitations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : activeMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium">No active members yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isAdmin ? "Invite team members to get started" : "No team members have joined yet"}
                    </p>
                    {isAdmin && (
                      <Button
                        onClick={() => setInviteModalOpen(true)}
                        className="mt-4"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                            {member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.fullName || member.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <RoleBadge role={member.role} />
                              <span className="text-sm text-muted-foreground">
                                Joined {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {isAdmin && member.id !== user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors cursor-pointer">
                                <MoreVertical className="h-4 w-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handlePromoteDemote(member.id, member.role, member.fullName || member.email)}
                                disabled={updateRoleMutation.isPending}
                              >
                                {member.role === 'admin' ? 'Demote to Contributor' : 'Promote to Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id, member.fullName || member.email)}
                                disabled={removeMemberMutation.isPending}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Remove from Organisation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invitations Tab - Admin Only */}
          {isAdmin && (
            <TabsContent value="invites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Invitations awaiting acceptance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invitesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg font-medium">No pending invitations</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      All invitations have been accepted or revoked
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium">{invite.invitedEmail}</p>
                            {getStatusBadge(invite.status)}
                            <RoleBadge role={invite.role} />
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Invited by {invite.invitedByName}</p>
                            <p>Sent {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}</p>
                            <p>Expires {formatDistanceToNow(new Date(invite.expiresAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors cursor-pointer">
                                <MoreVertical className="h-4 w-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleResendInvite(invite)}
                                disabled={resendMutation.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Resend Invite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRevokeInvite(invite)}
                                disabled={revokeMutation.isPending}
                                className="text-destructive"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke Invite
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {revokedInvites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Revoked Invitations</CardTitle>
                  <CardDescription>
                    Previously revoked invitations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revokedInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-medium">{invite.invitedEmail}</p>
                            {getStatusBadge(invite.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Invited {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          )}
        </Tabs>
      </DashboardPageContent>

      {/* Invite Modal - only for admins */}
      {isAdmin && (
        <>
          <InviteModal
            open={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            organisationId={orgId}
          />
          {organisation && (
            <EditOrganisationModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              organisation={organisation}
            />
          )}
        </>
      )}
    </DashboardPage>
  );
}
