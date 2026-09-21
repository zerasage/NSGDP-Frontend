"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Building2,
  User,
  Shield,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { FormError } from "@/components/forms/form-error";
import { DataConsentAgreement } from "@/components/legal/data-consent-agreement";
import { Checkbox } from "@/components/ui/checkbox";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { acceptInviteSchema, type AcceptInviteFormData } from "@/lib/schemas/invite";
import {
  validateInvite,
  acceptInvite,
  acceptInviteForExistingUser,
  type ValidateInviteResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/constants/brand";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function InviteShell({
  children,
  panel,
  className,
}: {
  children: ReactNode;
  panel?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col overflow-hidden",
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

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:py-14">
        <div className="mb-8 flex justify-center sm:mb-10 sm:justify-start">
          <GeoHealthLogo />
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border/70 bg-card/90 shadow-[0_24px_80px_-40px_rgba(13,59,20,0.45)] backdrop-blur-sm",
            panel
              ? "grid grid-cols-1 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.2fr)]"
              : "mx-auto w-full max-w-lg"
          )}
        >
          {panel}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">{children}</div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground sm:text-left">
          {BRAND.portalName} · Niger State Primary Health Care Development Agency
        </p>
      </div>
    </div>
  );
}

function InviteContextPanel({
  inviteData,
  roleLabel,
  daysUntilExpiry,
}: {
  inviteData: ValidateInviteResponse;
  roleLabel: string;
  daysUntilExpiry: number;
}) {
  return (
    <aside className="relative flex flex-col justify-between gap-6 overflow-hidden bg-[linear-gradient(165deg,var(--brand)_0%,color-mix(in_oklch,var(--brand)_82%,black)_100%)] px-6 py-7 text-white sm:px-8 lg:gap-8 lg:px-9 lg:py-10">
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-[color-mix(in_oklch,var(--teal)_45%,transparent)] blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          You&apos;ve been invited
        </p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">
          {inviteData.developmentPartnerName}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-white/80">
          Join the {BRAND.portalName} as a {roleLabel.toLowerCase()} and start contributing health
          data for Niger State.
        </p>
      </div>

      <dl className="relative space-y-3 text-sm">
        <div className="flex items-start gap-3 rounded-xl bg-white/10 px-3.5 py-3 backdrop-blur-sm">
          <Shield className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--teal)_90%,white)]" />
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-white/60">Role</dt>
            <dd className="font-medium text-white">{roleLabel}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white/10 px-3.5 py-3 backdrop-blur-sm">
          <Mail className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--teal)_90%,white)]" />
          <div className="min-w-0">
            <dt className="text-[11px] uppercase tracking-wide text-white/60">Invited email</dt>
            <dd className="truncate font-medium text-white">{inviteData.invitedEmail}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-white/10 px-3.5 py-3 backdrop-blur-sm">
          <User className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklch,var(--teal)_90%,white)]" />
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-white/60">Invited by</dt>
            <dd className="font-medium text-white">{inviteData.invitedByName}</dd>
          </div>
        </div>
        {daysUntilExpiry <= 3 && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/20 px-3.5 py-3 ring-1 ring-amber-200/30">
            <Clock className="mt-0.5 size-4 shrink-0 text-amber-100" />
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-amber-100/80">Expires soon</dt>
              <dd className="font-medium text-amber-50">
                {daysUntilExpiry <= 0
                  ? "Expires today"
                  : `${daysUntilExpiry} ${daysUntilExpiry === 1 ? "day" : "days"} left`}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </aside>
  );
}

function ConsentBlock({
  partnerName,
  consentAccepted,
  setConsentAccepted,
}: {
  partnerName: string;
  consentAccepted: boolean;
  setConsentAccepted: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {partnerName} hasn&apos;t yet consented to our Data Contribution &amp; Usage Consent
        Agreement. As the first member accepting an invite on its behalf, please review and agree
        to the terms below.
      </p>
      <div className="max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-4">
        <DataConsentAgreement organisationName={partnerName} />
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <Checkbox
          checked={consentAccepted}
          onCheckedChange={(checked) => setConsentAccepted(!!checked)}
          className="mt-0.5"
        />
        <span>
          I have read and agree to the Data Contribution &amp; Usage Consent Agreement on behalf of{" "}
          {partnerName}.
        </span>
      </label>
    </div>
  );
}

function InviteRegistrationForm() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState<ValidateInviteResponse | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  const password = watch("password", "");

  useEffect(() => {
    if (!inviteToken) {
      setInviteError("No invite token provided. Please check your invitation email.");
      setValidating(false);
      return;
    }

    const validate = async () => {
      try {
        setValidating(true);
        const data = await validateInvite(inviteToken);
        setInviteData(data);
        setInviteError(null);
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage =
          err?.response?.data?.message || err?.message || "Invalid or expired invite";
        setInviteError(errorMessage);
        setInviteData(null);
      } finally {
        setValidating(false);
      }
    };

    validate();
  }, [inviteToken]);

  const onSubmit = async (data: AcceptInviteFormData) => {
    if (!inviteToken) {
      toast.error("No invite token found");
      return;
    }

    setLoading(true);

    try {
      const response = await acceptInvite(inviteToken, {
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        phoneNumber: data.phone,
        consentAccepted: inviteData?.developmentPartnerConsentGiven ? undefined : consentAccepted,
      });

      if (response.tokens) {
        localStorage.setItem("accessToken", response.tokens.accessToken);
        localStorage.setItem("refreshToken", response.tokens.refreshToken);
        localStorage.setItem(
          "tokenExpiry",
          (Date.now() + response.tokens.expiresIn * 1000).toString()
        );
      }

      toast.success("Account created successfully! Welcome to the portal.");
      window.location.href = "/dashboard";
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to accept invite";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onAcceptExisting = async () => {
    if (!inviteToken) {
      toast.error("No invite token found");
      return;
    }

    setLoading(true);

    try {
      const response = await acceptInviteForExistingUser(
        inviteToken,
        inviteData?.developmentPartnerConsentGiven ? undefined : consentAccepted
      );

      if (response.tokens) {
        localStorage.setItem("accessToken", response.tokens.accessToken);
        localStorage.setItem("refreshToken", response.tokens.refreshToken);
        localStorage.setItem(
          "tokenExpiry",
          (Date.now() + response.tokens.expiresIn * 1000).toString()
        );
      }

      toast.success("Invite accepted! Your account has been upgraded.");
      window.location.href = "/dashboard";
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to accept invite";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  if (validating || (inviteData?.isExistingUser && authLoading)) {
    return (
      <InviteShell>
        <div className="py-10 text-center">
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Validating your invite...</p>
        </div>
      </InviteShell>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <InviteShell>
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="size-5" />
            <h1 className="text-xl font-semibold">Invalid invite</h1>
          </div>
          <Alert variant="destructive">
            <AlertDescription>{inviteError}</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            This invite may have expired or been revoked. Please contact the person who sent you
            the invite for assistance.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
            <Link href="/contact" className="flex-1">
              <Button className="w-full">Contact Support</Button>
            </Link>
          </div>
        </div>
      </InviteShell>
    );
  }

  const roleLabel = inviteData.role === "admin" ? "Development Partner Admin" : "Data Contributor";
  const expiresAt = new Date(inviteData.expiresAt);
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const panel = (
    <InviteContextPanel
      inviteData={inviteData}
      roleLabel={roleLabel}
      daysUntilExpiry={daysUntilExpiry}
    />
  );

  if (inviteData.isExistingUser) {
    const isCorrectAccount =
      isAuthenticated && user?.email?.toLowerCase() === inviteData.invitedEmail.toLowerCase();
    const returnTo = encodeURIComponent(`/register/invite?token=${inviteToken}`);

    return (
      <InviteShell panel={panel}>
        <div className="space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Accept your invite</h2>
            <p className="text-sm text-muted-foreground">
              An account already exists for this email. Confirm below to join{" "}
              {inviteData.developmentPartnerName}.
            </p>
          </div>

          {isCorrectAccount ? (
            <>
              <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                Logged in as <span className="font-medium">{inviteData.invitedEmail}</span>
              </div>

              {!inviteData.developmentPartnerConsentGiven && (
                <ConsentBlock
                  partnerName={inviteData.developmentPartnerName}
                  consentAccepted={consentAccepted}
                  setConsentAccepted={setConsentAccepted}
                />
              )}

              <Button
                className="w-full"
                onClick={onAcceptExisting}
                disabled={loading || (!inviteData.developmentPartnerConsentGiven && !consentAccepted)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invite"
                )}
              </Button>
            </>
          ) : isAuthenticated ? (
            <>
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  You&apos;re logged in as {user?.email}, but this invite was sent to{" "}
                  {inviteData.invitedEmail}. Log out and log back in as that account to accept it.
                </AlertDescription>
              </Alert>
              <Link href={`/login?returnTo=${returnTo}`}>
                <Button variant="outline" className="w-full">
                  Log In as a Different Account
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Log in with {inviteData.invitedEmail} to accept this invite.
              </p>
              <Link href={`/login?returnTo=${returnTo}`}>
                <Button className="w-full">Log In to Accept</Button>
              </Link>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t recognise this invite?{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell panel={panel}>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground lg:hidden">
            <Building2 className="size-3.5" />
            {inviteData.developmentPartnerName}
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Create your account</h2>
          <p className="text-sm text-muted-foreground">
            Complete registration to join {inviteData.developmentPartnerName} on the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </label>
              <Input id="firstName" placeholder="John" {...register("firstName")} />
              <FormError message={errors.firstName?.message} />
            </div>

            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
                Last Name <span className="text-destructive">*</span>
              </label>
              <Input id="lastName" placeholder="Doe" {...register("lastName")} />
              <FormError message={errors.lastName?.message} />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
              Phone Number (Optional)
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXXX"
              {...register("phone")}
            />
            <FormError message={errors.phone?.message} />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
            <FormError message={errors.password?.message} />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
              Confirm Password <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <FormError message={errors.confirmPassword?.message} />
          </div>

          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <p className="mb-1.5 font-medium">By accepting, you agree to:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                • Our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>• Your development partner&apos;s data governance policies</li>
              <li>• Responsible use of the portal</li>
            </ul>
          </div>

          {!inviteData.developmentPartnerConsentGiven && (
            <ConsentBlock
              partnerName={inviteData.developmentPartnerName}
              consentAccepted={consentAccepted}
              setConsentAccepted={setConsentAccepted}
            />
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (!inviteData.developmentPartnerConsentGiven && !consentAccepted)}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Accept Invite & Create Account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </InviteShell>
  );
}

export default function InviteRegistrationPage() {
  return (
    <Suspense
      fallback={
        <InviteShell>
          <div className="py-10 text-center">
            <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </InviteShell>
      }
    >
      <InviteRegistrationForm />
    </Suspense>
  );
}
