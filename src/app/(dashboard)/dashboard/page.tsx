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
} from "lucide-react";
import { StatusBadge } from "@/components/data/status-badge";
import { DatasetActivityPanel } from "@/components/data/dataset-activity-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useDashboardSummary } from "@/lib/hooks/useDashboardSummary";
import { useDownloadHistory } from "@/lib/hooks/useDownloadHistory";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useOrganizationDatasets } from "@/lib/hooks/useDatasets";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { formatDistanceToNow } from "date-fns";
import {
  DashboardPage as DashboardPageLayout,
  DashboardPageHeader,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: downloadHistory, isLoading: downloadsLoading } = useDownloadHistory(1, 4);
  const { data: notifications, isLoading: notificationsLoading } = useNotifications(1, 3);
  
  // Fetch user's organization datasets using authenticated endpoint
  const { data: datasetsData, isLoading: datasetsLoading } = useOrganizationDatasets(
    {
      page: 1,
      limit: 6,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    },
    { enabled: !!user?.organisationId }
  );

  const myDatasets = datasetsData?.data || [];
  const loading = summaryLoading || datasetsLoading;

  const statsLoading = summaryLoading || loading;

  return (
    <DashboardPageLayout>
      <DashboardPageHeader
        title={`Welcome back, ${user?.firstName} ${user?.lastName}!`}
        description={
          user?.role === "registered" ? "Browse datasets and track your downloads" :
          user?.role === "contributor" ? "Manage your datasets and contributions" :
          user?.role === "admin" ? "Manage your organization and datasets" : ""
        }
      />

      <DashboardPageContent className="space-y-6">
        {/* Outbreak alerts hidden until real API is available */}
        {/* <OutbreakAlertBanner alerts={[]} /> */}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-muted animate-pulse mb-4" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
          {/* All Users */}
          <StatsCard
            icon={Download}
            label="My Downloads"
            value={summary?.totalDownloads.toString() || "0"}
            trend={`${summary?.availableDatasets || 0} available datasets`}
            iconColor="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-950"
            clickable
            onClick={() => router.push('/dataportal')}
          />

          {/* Explore Datasets Card (Registered Users Only) */}
          {user?.role === "registered" && (
            <div className="sm:col-span-1 lg:col-span-3">
              <Card className="h-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="pt-6 h-full flex items-center">
                  <div className="flex items-center gap-4 w-full">
                    <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                      <Search className="size-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">
                        Explore Available Datasets
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Browse {summary?.availableDatasets || 0} health datasets from across Nigeria
                      </p>
                      <Button 
                        onClick={() => router.push('/dataportal')}
                        size="sm"
                        className="gap-2"
                      >
                        Browse All Datasets
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contributors+ */}
          {user && ["contributor", "admin"].includes(user.role) && (
            <>
              <StatsCard
                icon={Database}
                label="Organization Datasets"
                value={(summary?.myDatasetsCount ?? 0).toString()}
                trend={`${summary?.pendingDatasetsCount ?? 0} pending review`}
                iconColor="text-green-600"
                bgColor="bg-green-50 dark:bg-green-950"
              />
              {/* Team Members - both contributors and admins can see */}
              <StatsCard
                icon={Users}
                label="Team Members"
                value={(summary?.teamMembersCount ?? 0).toString()}
                trend={user.role === "admin" ? `${summary?.pendingInvitesCount ?? 0} pending approvals` : "View team"}
                iconColor="text-orange-600"
                bgColor="bg-orange-50 dark:bg-orange-950"
                clickable
                onClick={() => router.push('/organisation')}
              />
              <StatsCard
                icon={Upload}
                label="My Contributions"
                value={(summary?.myContributedDatasetsCount ?? 0).toString()}
                trend="Datasets I created"
                iconColor="text-purple-600"
                bgColor="bg-purple-50 dark:bg-purple-950"
              />
            </>
          )}
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Datasets (Contributors+) */}
            {user && ["contributor", "admin"].includes(user.role) && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Organization Datasets</CardTitle>
                  <Link href="/upload">
                    <Button size="sm">
                      <Upload className="size-4 mr-2" />
                      Upload New
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : myDatasets.length > 0 ? (
                    <div className="space-y-4">
                      {myDatasets.map((dataset) => (
                        <div key={dataset.id} className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                          <Database className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-1">
                              <Link
                                href={`/dataportal/${dataset.slug}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {dataset.title}
                              </Link>
                              <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {dataset.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{dataset.download_count} downloads</span>
                              <span>Updated {formatDate(dataset.updated_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Link href="/datasets">
                        <Button variant="outline" className="w-full">
                          View All Organization Datasets
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Database className="size-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">You haven&apos;t uploaded any datasets yet</p>
                      <Link href="/upload">
                        <Button>
                          <Upload className="size-4 mr-2" />
                          Upload Your First Dataset
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Downloads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Downloads</CardTitle>
              </CardHeader>
              <CardContent>
                {downloadsLoading ? (
                  <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : downloadHistory && downloadHistory.data.length > 0 ? (
                  <div className="space-y-4">
                    {downloadHistory.data.map((download) => (
                      <div key={download.id} className="flex items-start gap-4 p-4 rounded-lg border">
                        <Download className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dataportal/${download.dataset.slug}`}
                            className="font-medium hover:text-primary transition-colors block mb-1"
                          >
                            {download.dataset.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Downloaded {formatDate(download.downloadedAt)} • {download.dataset.format} file
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link href="/downloads">
                      <Button variant="outline" className="w-full">
                        View All Downloads
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Download className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No downloads yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Pending Actions */}
            {user && ["contributor", "admin"].includes(user.role) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summaryLoading ? (
                    <div className="space-y-3">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <>
                      {summary && summary.pendingDatasetsCount !== undefined && summary.pendingDatasetsCount > 0 && (
                        <ActionItem
                          icon={AlertCircle}
                          text={`${summary.pendingDatasetsCount} dataset${summary.pendingDatasetsCount !== 1 ? 's' : ''} awaiting review`}
                          color="text-orange-600"
                          href="/datasets?status=pending"
                        />
                      )}
                      {user.role !== "contributor" && summary?.pendingInvitesCount !== undefined && summary.pendingInvitesCount > 0 && (
                        <ActionItem
                          icon={Users}
                          text={`${summary.pendingInvitesCount} access request${summary.pendingInvitesCount !== 1 ? 's' : ''} pending`}
                          color="text-blue-600"
                          href="/organisation"
                        />
                      )}
                      {(!summary?.pendingDatasetsCount && !summary?.pendingInvitesCount) && (
                        <div className="text-center py-8">
                          <CheckCircle2 className="size-10 text-green-600 mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">No pending actions</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Notifications
                  {summary && summary.unreadNotifications > 0 && (
                    <span className="flex items-center gap-1">
                      <Bell className="size-5 text-muted-foreground" />
                      <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
                        {summary.unreadNotifications}
                      </span>
                    </span>
                  )}
                  {!summary?.unreadNotifications && <Bell className="size-5 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notificationsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : notifications && notifications.data.length > 0 ? (
                  <>
                    {notifications.data.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        title={notification.title}
                        message={notification.message}
                        time={formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        isRead={notification.is_read}
                      />
                    ))}
                    <Link href="/notifications">
                      <Button variant="ghost" size="sm" className="w-full">
                        View All Notifications
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portal Activity */}
            {user && ["contributor", "admin"].includes(user.role) && (
              <DatasetActivityPanel />
            )}

            {/* Member Since */}
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="font-medium">{formatDate(summary.memberSince)}</span>
                  </div>
                  {summary.lastLoginAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last login</span>
                      <span className="font-medium">{formatDate(summary.lastLoginAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardPageContent>
    </DashboardPageLayout>
  );
}

// Helper Components
function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  iconColor,
  bgColor,
  clickable = false,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  iconColor: string;
  bgColor: string;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const CardWrapper = clickable ? 'button' : 'div';
  
  return (
    <Card className={cn(clickable && "transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]")}>
      <CardContent className="pt-6">
        <CardWrapper
          onClick={onClick}
          className={cn(
            "w-full text-left",
            clickable && "cursor-pointer"
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${bgColor}`}>
              <Icon className={`size-6 ${iconColor}`} />
            </div>
          </div>
          <p className="text-2xl font-bold mb-1">{value}</p>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className={cn(
            "text-xs text-muted-foreground",
            clickable && "underline decoration-dotted underline-offset-2"
          )}>
            {trend}
          </p>
        </CardWrapper>
      </CardContent>
    </Card>
  );
}

function ActionItem({
  icon: Icon,
  text,
  color,
  href,
}: {
  icon: React.ElementType;
  text: string;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Icon className={`size-5 shrink-0 mt-0.5 ${color}`} />
      <p className="text-sm flex-1">{text}</p>
    </Link>
  );
}

function NotificationItem({ 
  title, 
  message, 
  time, 
  isRead 
}: { 
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
      !isRead && "bg-primary/5 border-primary/20"
    )}>
      <Clock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={cn(
            "text-sm",
            !isRead && "font-semibold"
          )}>
            {title}
          </p>
          {!isRead && (
            <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        {message && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
            {message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
