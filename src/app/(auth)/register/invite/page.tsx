"use client";

import { useState, useEffect, Suspense } from "react";
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
import { AuthShell, AuthBrandPanel, AuthBrandMeta } from "@/components/layout/auth-shell";
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
    <AuthBrandPanel
      eyebrow="You've been invited"
      title={inviteData.developmentPartnerName}
      description={`Join the ${BRAND.portalName} as a ${roleLabel.toLowerCase()} and start contributing health data for Niger State.`}
    >
      <AuthBrandMeta icon={<Shield className="size-4" />} label="Role" value={roleLabel} />
      <AuthBrandMeta
        icon={<Mail className="size-4" />}
        label="Invited email"
        value={inviteData.invitedEmail}
      />
      <AuthBrandMeta
        icon={<User className="size-4" />}
        label="Invited by"
        value={inviteData.invitedByName}
      />
      {daysUntilExpiry <= 3 ? (
        <div className="flex items-start gap-3 rounded-xl bg-amber-500/20 px-3.5 py-3 ring-1 ring-amber-200/30">
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-100" />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-amber-100/80">Expires soon</p>
            <p className="font-medium text-amber-50">
              {daysUntilExpiry <= 0
                ? "Expires today"
                : `${daysUntilExpiry} ${daysUntilExpiry === 1 ? "day" : "days"} left`}
            </p>
          </div>
        </div>
      ) : null}
    </AuthBrandPanel>
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
      <AuthShell>
        <div className="py-10 text-center">
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Validating your invite...</p>
        </div>
      </AuthShell>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <AuthShell>
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
      </AuthShell>
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
      <AuthShell panel={panel}>
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
      </AuthShell>
    );
  }

  return (
    <AuthShell panel={panel}>
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
    </AuthShell>
  );
}

export default function InviteRegistrationPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="py-10 text-center">
            <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </AuthShell>
      }
    >
      <InviteRegistrationForm />
    </Suspense>
  );
}
