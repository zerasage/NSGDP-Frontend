"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from "@/lib/hooks/useNotifications";
import { getDisplayType } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-destructive",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  
  // Fetch latest 6 notifications for the dropdown
  const { data, isLoading } = useNotifications(1, 6, false);
  
  // Fetch total unread count
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const notifications = data?.data || [];

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleMarkRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-md hover:bg-muted transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-xl border bg-background shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="font-semibold text-sm">Notifications</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markAllAsReadMutation.isPending}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted disabled:opacity-50"
                  >
                    <CheckCheck className="size-3" />
                    {markAllAsReadMutation.isPending ? "Marking..." : "Mark all read"}
                  </button>
                )}
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs text-primary hover:underline px-2 py-1"
                >
                  View all
                </Link>
              </div>
            </div>

            <ul className="divide-y max-h-80 overflow-y-auto">
              {isLoading ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading...
                </li>
              ) : notifications.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications
                </li>
              ) : (
                notifications.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors",
                      !n.is_read && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 rounded-full shrink-0",
                        TYPE_COLORS[getDisplayType(n.type)] || TYPE_COLORS.info
                      )}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => {
                          if (!n.is_read) {
                            handleMarkRead(n.id);
                          }
                          setOpen(false);
                        }}
                        className="block text-left w-full"
                      >
                        <p className={cn("text-sm leading-snug", !n.is_read && "font-medium")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      </button>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
