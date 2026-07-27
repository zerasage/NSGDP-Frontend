"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import { getDisplayType } from "@/lib/api/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  error: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const limit = 20;

  // Fetch notifications
  const { data, isLoading, error } = useNotifications(page, limit, showUnreadOnly);
  
  // Fetch total unread count
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  
  // Mutation hooks
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = data?.data || [];
  const meta = data?.meta;

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All notifications marked as read");
      },
      onError: () => {
        toast.error("Failed to mark notifications as read");
      },
    });
  };

  const handleMarkRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const filterActions = (
    <>
      <Button
        variant={!showUnreadOnly ? "default" : "outline"}
        size="sm"
        onClick={() => setShowUnreadOnly(false)}
      >
        All
      </Button>
      <Button
        variant={showUnreadOnly ? "default" : "outline"}
        size="sm"
        onClick={() => setShowUnreadOnly(true)}
      >
        Unread {unreadCount > 0 && `(${unreadCount})`}
      </Button>
      {unreadCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleMarkAllRead}
          disabled={markAllAsReadMutation.isPending}
        >
          <CheckCheck className="size-4 mr-1.5" />
          {markAllAsReadMutation.isPending ? "Marking..." : "Mark all read"}
        </Button>
      )}
    </>
  );

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Notifications"
        icon={<Bell className="size-6 text-primary" />}
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "All caught up"
        }
        actions={filterActions}
      />

      <DashboardPageContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-20 text-destructive gap-3">
            <Bell className="size-12 opacity-20" />
            <p className="font-medium">Failed to load notifications</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground gap-3">
            <Bell className="size-12 opacity-20" />
            <p className="font-medium">No {showUnreadOnly ? "unread " : ""}notifications</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  className={cn(
                    "w-full text-left flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/40",
                    !n.is_read && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-xs font-medium rounded-full px-2 py-0.5",
                        TYPE_COLORS[getDisplayType(n.type)] || TYPE_COLORS.info
                      )}>
                        {n.type.toUpperCase().replace(/_/g, ' ')}
                      </span>
                      {!n.is_read && (
                        <span className="size-2 rounded-full bg-primary" aria-label="Unread" />
                      )}
                    </div>
                    <p className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </DashboardPageContent>
    </DashboardPage>
  );
}
