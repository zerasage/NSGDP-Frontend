"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HelpTip } from "@/components/ui/help-tip";
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
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/lib/hooks/useNotifications";
import { getDisplayType } from "@/lib/api/notifications";
import { PORTAL_NOTIFICATIONS_PAGE_TIP } from "@/lib/constants/portal-tooltips";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-amber-800 dark:text-warning",
  error: "bg-destructive/10 text-destructive",
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const limit = 20;

  const { data, isLoading, error } = useNotifications(page, limit, showUnreadOnly);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const totalCount = meta?.total ?? notifications.length;

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: () => toast.error("Failed to mark notifications as read"),
    });
  };

  const handleMarkRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/[0.06] px-2.5 py-1">
              <Bell className="size-3.5 text-primary" aria-hidden />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Account
              </span>
            </div>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
              Notifications
              <HelpTip content={PORTAL_NOTIFICATIONS_PAGE_TIP} label="Notifications page help" />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "All caught up — no unread notifications."}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-11 shrink-0 gap-2 sm:h-10"
              onClick={handleMarkAllRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="size-4" />
              {markAllAsReadMutation.isPending ? "Marking…" : "Mark all read"}
            </Button>
          ) : null}
        </div>
      </div>

      <DashboardPageContent className="space-y-4 sm:space-y-6">
        {!isLoading && notifications.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <MetricCard
              label="Total"
              value={totalCount}
              hint={showUnreadOnly ? "Unread only" : "All notifications"}
              icon={Bell}
              tone="primary"
            />
            <MetricCard
              label="Unread"
              value={unreadCount}
              hint="Need attention"
              icon={Bell}
              tone={unreadCount > 0 ? "warning" : "muted"}
              onClick={() => setShowUnreadOnly(true)}
            />
            <MetricCard
              label="This page"
              value={notifications.length}
              hint={`Page ${page} of ${meta?.totalPages ?? 1}`}
              icon={CheckCheck}
              tone="muted"
            />
          </div>
        ) : null}

        <DashboardPanel
          title="Inbox"
          description="Click an unread notification to mark it as read."
          icon={Bell}
          tone="primary"
        >
          <div className="space-y-4">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <FilterChip
                active={!showUnreadOnly}
                label="All"
                onClick={() => {
                  setShowUnreadOnly(false);
                  setPage(1);
                }}
              />
              <FilterChip
                active={showUnreadOnly}
                label="Unread"
                count={unreadCount}
                onClick={() => {
                  setShowUnreadOnly(true);
                  setPage(1);
                }}
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : error ? (
              <EmptyPanelState
                icon={Bell}
                message="Failed to load notifications."
                action={
                  <Button variant="outline" className="h-11" onClick={() => window.location.reload()}>
                    Try again
                  </Button>
                }
              />
            ) : notifications.length === 0 ? (
              <EmptyPanelState
                icon={Bell}
                message={
                  showUnreadOnly
                    ? "No unread notifications — you're all caught up."
                    : "No notifications yet."
                }
              />
            ) : (
              <>
                <ul className="space-y-2">
                  {notifications.map((n) => {
                    const displayType = getDisplayType(n.type);
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => !n.is_read && handleMarkRead(n.id)}
                          className={cn(
                            "w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/40",
                            !n.is_read && "border-primary/20 bg-primary/[0.04]",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={cn("text-[10px] uppercase", TYPE_COLORS[displayType])}
                                >
                                  {n.type.replace(/_/g, " ")}
                                </Badge>
                                {!n.is_read ? (
                                  <span
                                    className="size-2 rounded-full bg-primary"
                                    aria-label="Unread"
                                  />
                                ) : null}
                              </div>
                              <p className={cn("text-sm", !n.is_read && "font-semibold")}>
                                {n.title}
                              </p>
                              <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                              <p className="mt-2 text-xs text-muted-foreground/70">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {meta && meta.totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {meta.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10"
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      disabled={page === meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </DashboardPanel>
      </DashboardPageContent>
    </DashboardPage>
  );
}
