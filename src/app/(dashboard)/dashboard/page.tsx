"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Database,
  Download,
  Upload,
  Users,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Building2,
  ClipboardList,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { DatasetActivityPanel } from "@/components/data/dataset-activity-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth, isOrgMember, isOrgAdmin } from "@/lib/auth";
import { useProgramPermissions } from "@/lib/hooks/useProgramPermissions";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useDownloadHistory } from "@/lib/hooks/useDownloadHistory";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useOrganizationDatasets } from "@/lib/hooks/useDatasets";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { formatDistanceToNow } from "date-fns";
import {
  DashboardPage as DashboardPageLayout,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import {
  MetricCard,
  HeroMetricCard,
  DashboardPanel,
  QuickActionChip,
  EmptyPanelState,
} from "@/components/dashboard/portal-dashboard-ui";
import { HelpTip } from "@/components/ui/help-tip";
import {
  PORTAL_DASHBOARD_ORG_DATASETS_TIP,
  PORTAL_DASHBOARD_PAGE_TIP,
  PORTAL_DASHBOARD_PENDING_TIP,
  PORTAL_DASHBOARD_TEAM_TIP,
  PORTAL_DASHBOARD_NOTIFICATIONS_TIP,
} from "@/lib/constants/portal-tooltips";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess: canAccessPrograms } = useProgramPermissions();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: downloadHistory, isLoading: downloadsLoading } = useDownloadHistory(1, 4);
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(1, 5);

  const isMember = isOrgMember(user?.role);
  const isAdmin = isOrgAdmin(user?.role);

  const { data: datasetsData, isLoading: datasetsLoading } = useOrganizationDatasets(
    {
      page: 1,
      limit: 5,
      sortBy: "created_at",
      sortOrder: "DESC",
    },
    { enabled: !!user?.organisationId && isMember },
  );

  const myDatasets = datasetsData?.data ?? [];
  const statsLoading = summaryLoading || (isMember && datasetsLoading);

  const pendingDatasets = summary?.pendingDatasetsCount ?? 0;
  const pendingInvites = summary?.pendingInvitesCount ?? 0;
  const hasPendingActions =
    isMember &&
    (pendingDatasets > 0 || (isAdmin && pendingInvites > 0));

  const welcomeDescription = isMember
    ? isAdmin
      ? "Manage your organisation, datasets, and team."
      : "Track your datasets and contributions."
    : "Browse datasets and track your downloads.";

  return (
    <DashboardPageLayout>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="space-y-4">
          {user?.organisationName && isMember ? (
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1">
              <Building2 className="size-3.5 text-primary" aria-hidden />
              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-primary">
                {user.organisationName}
              </span>
            </div>
          ) : null}

          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Welcome back, {user?.firstName}
              <HelpTip content={PORTAL_DASHBOARD_PAGE_TIP} label="Dashboard help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{welcomeDescription}</p>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <QuickActionChip href="/dataportal" icon={Search} label="Browse data" />
            <QuickActionChip href="/downloads" icon={Download} label="Downloads" />
            {isMember ? (
              <>
                <QuickActionChip href="/upload" icon={Upload} label="Upload" primary />
                <QuickActionChip href="/datasets" icon={Database} label="Datasets" />
                {canAccessPrograms ? (
                  <QuickActionChip href="/my-programs" icon={ClipboardList} label="Programmes" />
                ) : null}
                <QuickActionChip href="/dashboard/documents" icon={FileText} label="Documents" />
                <QuickActionChip href="/organisation" icon={Users} label="Team" />
              </>
            ) : (
              <QuickActionChip href="/dataportal" icon={Search} label="Explore datasets" primary />
            )}
          </div>
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        {hasPendingActions ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {pendingDatasets > 0 ? (
              <Link
                href="/datasets?status=pending"
                className="flex min-h-11 items-center gap-3 rounded-xl border border-warning/30 bg-warning/[0.08] px-4 py-3 text-sm transition-colors hover:bg-warning/[0.12]"
              >
                <AlertCircle className="size-5 shrink-0 text-amber-700 dark:text-warning" />
                <span className="font-medium">
                  {pendingDatasets} dataset{pendingDatasets !== 1 ? "s" : ""} awaiting review
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 opacity-60" />
              </Link>
            ) : null}
            {isAdmin && pendingInvites > 0 ? (
              <Link
                href="/organisation"
                className="flex min-h-11 items-center gap-3 rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm transition-colors hover:bg-info/[0.1]"
              >
                <Users className="size-5 shrink-0 text-info" />
                <span className="font-medium">
                  {pendingInvites} access request{pendingInvites !== 1 ? "s" : ""} pending
                </span>
                <ArrowRight className="ml-auto size-4 shrink-0 opacity-60" />
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statsLoading ? (
            <>
              <Skeleton className="h-[168px] rounded-2xl sm:col-span-2 xl:row-span-2 xl:min-h-[220px]" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-2xl" />
              ))}
            </>
          ) : isMember ? (
            <>
              <HeroMetricCard
                className="sm:col-span-2 xl:row-span-2"
                label="Organisation datasets"
                description="All datasets owned by your organisation"
                value={summary?.myDatasetsCount ?? 0}
                icon={Database}
                tone="success"
                tip={PORTAL_DASHBOARD_ORG_DATASETS_TIP}
                footer={
                  <Link
                    href="/datasets"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
                  >
                    View all datasets
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
              <MetricCard
                label="Pending review"
                value={pendingDatasets}
                hint="Awaiting admin approval"
                icon={AlertCircle}
                tone="warning"
                tip={PORTAL_DASHBOARD_PENDING_TIP}
                onClick={() => router.push("/datasets?status=pending")}
              />
              <MetricCard
                label="Team members"
                value={summary?.teamMembersCount ?? 0}
                hint={isAdmin ? `${pendingInvites} pending invites` : "View team roster"}
                icon={Users}
                tone="info"
                tip={PORTAL_DASHBOARD_TEAM_TIP}
                onClick={() => router.push("/organisation")}
              />
              <MetricCard
                label="My contributions"
                value={summary?.myContributedDatasetsCount ?? 0}
                hint="Datasets you created"
                icon={Upload}
                tone="primary"
              />
              <MetricCard
                label="My downloads"
                value={summary?.totalDownloads ?? 0}
                hint={`${summary?.availableDatasets ?? 0} public datasets`}
                icon={Download}
                tone="muted"
                onClick={() => router.push("/dataportal")}
              />
            </>
          ) : (
            <>
              <HeroMetricCard
                className="col-span-full sm:col-span-2 xl:col-span-3"
                label="Data portal"
                description="Explore health datasets from across Nigeria"
                value={summary?.availableDatasets ?? 0}
                icon={Search}
                tone="primary"
                footer={
                  <Link
                    href="/dataportal"
                    className={cn(buttonVariants({ size: "sm" }), "h-9")}
                  >
                    Browse all datasets
                    <ArrowRight className="size-4" />
                  </Link>
                }
              />
              <MetricCard
                label="My downloads"
                value={summary?.totalDownloads ?? 0}
                hint="View download history"
                icon={Download}
                tone="info"
                onClick={() => router.push("/downloads")}
              />
            </>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="space-y-4 lg:col-span-2 lg:space-y-6">
            {isMember ? (
              <DashboardPanel
                title="Recent organisation datasets"
                description="Latest uploads from your organisation."
                icon={Database}
                tone="success"
                action={
                  <Link
                    href="/upload"
                    className={cn(buttonVariants({ size: "sm" }), "h-9 shrink-0")}
                  >
                    <Upload className="size-4" />
                    Upload
                  </Link>
                }
              >
                {datasetsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : myDatasets.length > 0 ? (
                  <ul className="space-y-2">
                    {myDatasets.map((dataset) => (
                      <li key={dataset.id}>
                        <Link
                          href={`/datasets/${dataset.slug}`}
                          className="group flex gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 sm:p-4"
                        >
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                            <Database className="size-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium leading-snug group-hover:text-primary">
                                {dataset.title}
                              </p>
                              <StatusBadge
                                status={dataset.status}
                                publishedAt={dataset.published_at}
                              />
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {dataset.description}
                            </p>
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              {dataset.download_count} downloads · Updated{" "}
                              {formatDate(dataset.updated_at)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                    <Link
                      href="/datasets"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "mt-2 h-11 w-full",
                      )}
                    >
                      View all organisation datasets
                    </Link>
                  </ul>
                ) : (
                  <EmptyPanelState
                    icon={Database}
                    message="No datasets uploaded yet."
                    action={
                      <Link href="/upload" className={cn(buttonVariants(), "h-11")}>
                        <Upload className="size-4" />
                        Upload your first dataset
                      </Link>
                    }
                  />
                )}
              </DashboardPanel>
            ) : null}

            <DashboardPanel
              title="Recent downloads"
              description="Datasets you have downloaded recently."
              icon={Download}
              tone="info"
              action={
                <Link
                  href="/downloads"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all
                </Link>
              }
            >
              {downloadsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : downloadHistory && downloadHistory.data.length > 0 ? (
                <ul className="space-y-2">
                  {downloadHistory.data.map((download) => (
                    <li key={download.id}>
                      <Link
                        href={`/dataportal/${download.dataset.slug}`}
                        className="flex gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50 sm:p-4"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-info/25 bg-info/10">
                          <Download className="size-4 text-info" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{download.dataset.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDate(download.downloadedAt)} · {download.dataset.format}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyPanelState
                  icon={Download}
                  message="No downloads yet."
                  action={
                    <Link
                      href="/dataportal"
                      className={cn(buttonVariants({ variant: "outline" }), "h-11")}
                    >
                      Browse datasets
                    </Link>
                  }
                />
              )}
            </DashboardPanel>
          </div>

          <div className="space-y-4 lg:space-y-6">
            <DashboardPanel
              title="Notifications"
              titleTip={PORTAL_DASHBOARD_NOTIFICATIONS_TIP}
              description="Updates about your account and activity."
              icon={Bell}
              tone="primary"
              action={
                summary && summary.unreadNotifications > 0 ? (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-white">
                    {summary.unreadNotifications} new
                  </span>
                ) : (
                  <Link
                    href="/notifications"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View all
                  </Link>
                )
              }
            >
              {notificationsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : notifications && notifications.data.length > 0 ? (
                <ul className="max-h-80 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                  {notifications.data.map((notification) => (
                    <li key={notification.id}>
                      <NotificationItem
                        title={notification.title}
                        message={notification.message}
                        time={formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                        isRead={notification.is_read}
                      />
                    </li>
                  ))}
                  <Link href="/notifications">
                    <Button variant="ghost" size="sm" className="mt-1 h-10 w-full">
                      View all notifications
                    </Button>
                  </Link>
                </ul>
              ) : (
                <EmptyPanelState icon={Bell} message="No notifications yet." />
              )}
            </DashboardPanel>

            {isMember ? <DatasetActivityPanel /> : null}

            {summary ? (
              <DashboardPanel title="Account" icon={Clock} tone="muted">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Member since</dt>
                    <dd className="font-medium tabular-nums">{formatDate(summary.memberSince)}</dd>
                  </div>
                  {summary.lastLoginAt ? (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Last login</dt>
                      <dd className="font-medium tabular-nums">
                        {formatDate(summary.lastLoginAt)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </DashboardPanel>
            ) : null}

            {isMember && !hasPendingActions && !summaryLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 shrink-0 text-success" />
                All caught up — no pending actions.
              </div>
            ) : null}
          </div>
        </div>
      </DashboardPageContent>
    </DashboardPageLayout>
  );
}

function NotificationItem({
  title,
  message,
  time,
  isRead,
}: {
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        !isRead && "border-primary/20 bg-primary/[0.04]",
      )}
    >
      <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm leading-snug", !isRead && "font-semibold")}>{title}</p>
          {!isRead ? (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          ) : null}
        </div>
        {message ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{message}</p>
        ) : null}
        <p className="mt-1 text-[11px] text-muted-foreground/80">{time}</p>
      </div>
    </div>
  );
}
