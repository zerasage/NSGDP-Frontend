import type { ReactNode } from "react";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { BRAND } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";

type AuthShellSize = "sm" | "md" | "lg";

interface AuthShellProps {
  children: ReactNode;
  /** Optional brand / context column (stacks above form on mobile). */
  panel?: ReactNode;
  /** sm ≈ login cards, md ≈ register, lg ≈ invite split. */
  size?: AuthShellSize;
  className?: string;
}

/**
 * Shared auth atmosphere — radial brand wash, soft pattern, logo, frosted panel.
 * Mobile-first: single column; optional `panel` sits above the form until `lg`.
 */
export function AuthShell({ children, panel, size = "sm", className }: AuthShellProps) {
  const hasPanel = Boolean(panel);
  const shellMax =
    size === "lg" || hasPanel ? "max-w-5xl" : size === "md" ? "max-w-xl" : "max-w-md";

  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col",
        "bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_oklch,var(--brand)_18%,transparent),transparent_55%),radial-gradient(90%_70%_at_100%_100%,color-mix(in_oklch,var(--teal)_16%,transparent),transparent_50%),var(--background)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 mx-auto flex w-full flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 lg:py-14",
          shellMax
        )}
      >
        <div className="mb-6 flex justify-center sm:mb-8 sm:justify-start">
          <GeoHealthLogo />
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border/70 bg-card/90 shadow-[0_24px_80px_-40px_rgba(13,59,20,0.45)] backdrop-blur-sm",
            hasPanel && "grid grid-cols-1 lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.15fr)]"
          )}
        >
          {panel}
          <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">{children}</div>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground sm:mt-6 sm:text-left">
          {BRAND.portalName} · Niger State Primary Health Care Development Agency
        </p>
      </div>
    </div>
  );
}

interface AuthBrandPanelProps {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

/** Green brand column used beside auth forms on larger screens (stacks on mobile). */
export function AuthBrandPanel({
  eyebrow,
  title,
  description,
  children,
  className,
}: AuthBrandPanelProps) {
  return (
    <aside
      className={cn(
        "relative flex flex-col justify-between gap-5 overflow-hidden",
        "bg-[linear-gradient(165deg,var(--brand)_0%,color-mix(in_oklch,var(--brand)_82%,black)_100%)]",
        "px-5 py-6 text-white sm:px-8 sm:py-8 lg:gap-8 lg:px-9 lg:py-10",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-[color-mix(in_oklch,var(--teal)_45%,transparent)] blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-2.5 sm:space-y-3">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl lg:text-[1.75rem]">
          {title}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-white/80">{description}</p>
      </div>

      {children ? <div className="relative space-y-3 text-sm">{children}</div> : null}
    </aside>
  );
}

export function AuthBrandMeta({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/10 px-3.5 py-3 backdrop-blur-sm">
      <span className="mt-0.5 shrink-0 text-[color-mix(in_oklch,var(--teal)_90%,white)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-white/60">{label}</p>
        <p className="truncate font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
