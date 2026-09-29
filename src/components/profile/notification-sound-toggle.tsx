"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  subscribeNotificationSoundPref,
} from "@/lib/utils/notification-sound";

const SERVER_SNAPSHOT = true; // matches isNotificationSoundEnabled()'s SSR default

export function NotificationSoundToggle() {
  const enabled = useSyncExternalStore(
    subscribeNotificationSoundPref,
    isNotificationSoundEnabled,
    () => SERVER_SNAPSHOT,
  );

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">Notification sound</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Play a short chime when a new notification arrives.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle notification sound"
        onClick={() => setNotificationSoundEnabled(!enabled)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 transform rounded-full bg-white shadow-sm transition",
            enabled ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
