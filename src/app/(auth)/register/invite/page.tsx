"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, CheckCircle2, Mail, Building, User, Shield, Loader2, AlertCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { FormError } from "@/components/forms/form-error";
import { DataConsentAgreement } from "@/components/legal/data-consent-agreement";
import { Checkbox } from "@/components/ui/checkbox";
import { acceptInviteSchema, type AcceptInviteFormData } from "@/lib/schemas/invite";
import { validateInvite, acceptInvite, acceptInviteForExistingUser, type ValidateInviteResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

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

  // Validate invite token on mount
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
        const errorMessage = err?.response?.data?.message || err?.message || "Invalid or expired invite";
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
        consentAccepted: inviteData?.organisationConsentGiven ? undefined : consentAccepted,
      });

      // Store tokens for auto-login
      if (response.tokens) {
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('tokenExpiry', 
          (Date.now() + response.tokens.expiresIn * 1000).toString()
        );
      }

      toast.success("Account created successfully! Welcome to the portal.");
      
      // Force a page reload to trigger auth context to load the user
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
        inviteData?.organisationConsentGiven ? undefined : consentAccepted
      );

      if (response.tokens) {
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('tokenExpiry',
          (Date.now() + response.tokens.expiresIn * 1000).toString()
        );
      }

      toast.success("Invite accepted! Your account has been upgraded.");

      // Force a page reload so auth context picks up the new role/tokens
      window.location.href = "/dashboard";
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to accept invite";
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Loading state
  if (validating || (inviteData?.isExistingUser && authLoading)) {
    return (
      <Container className="py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Validating your invite...</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Error state
  if (inviteError || !inviteData) {
    return (
      <Container className="py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              This invite may have expired or been revoked. Please contact the person who sent you the invite for assistance.
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  Go to Login
                </Button>
              </Link>
              <Link href="/contact" className="flex-1">
                <Button className="w-full">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const roleLabel = inviteData.role === "admin" ? "Org Admin" : "Data Contributor";
  const expiresAt = new Date(inviteData.expiresAt);
  const daysUntilExpiry = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // This invite upgrades an existing registered user's role/org rather than
  // creating a new account — they must accept it while logged in as the
  // exact invited email, not by setting a new password.
  if (inviteData.isExistingUser) {
    const isCorrectAccount =
      isAuthenticated && user?.email?.toLowerCase() === inviteData.invitedEmail.toLowerCase();
    const returnTo = encodeURIComponent(`/register/invite?token=${inviteToken}`);

    return (
      <Container className="py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="size-6 text-emerald-600" />
              <CardTitle className="text-2xl">You&apos;ve Been Invited!</CardTitle>
            </div>
            <CardDescription>
              {inviteData.invitedByName} invited you to join {inviteData.organisationName} as {roleLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Building className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Organisation</p>
                  <p className="text-sm text-muted-foreground">{inviteData.organisationName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{inviteData.invitedEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Your New Role</p>
                  <p className="text-sm text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
            </div>

            {isCorrectAccount ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  You&apos;re logged in as {inviteData.invitedEmail}. Accept below to upgrade
                  your account.
                </p>

                {!inviteData.organisationConsentGiven && (
                  <div className="space-y-3">
                    <p className="text-sm">
                      {inviteData.organisationName} hasn&apos;t yet consented to our Data
                      Contribution &amp; Usage Consent Agreement. As the first member accepting an
                      invite on its behalf, please review and agree to the terms below.
                    </p>
                    <div className="max-h-64 overflow-y-auto rounded-lg border p-4 bg-muted/20">
                      <DataConsentAgreement organisationName={inviteData.organisationName} />
                    </div>
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={consentAccepted}
                        onCheckedChange={(checked) => setConsentAccepted(!!checked)}
                        className="mt-0.5"
                      />
                      <span>
                        I have read and agree to the Data Contribution &amp; Usage Consent
                        Agreement on behalf of {inviteData.organisationName}.
                      </span>
                    </label>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={onAcceptExisting}
                  disabled={loading || (!inviteData.organisationConsentGiven && !consentAccepted)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
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
                    {inviteData.invitedEmail}. Log out and log back in as that account to
                    accept it.
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
                <p className="text-sm text-muted-foreground text-center">
                  An account already exists for this email. Log in to accept the invite.
                </p>
                <Link href={`/login?returnTo=${returnTo}`}>
                  <Button className="w-full">Log In to Accept</Button>
                </Link>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t recognise this invite?{" "}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact support
              </Link>
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-6 text-emerald-600" />
            <CardTitle className="text-2xl">You&apos;ve Been Invited!</CardTitle>
          </div>
          <CardDescription>
            Complete your registration to join {inviteData.organisationName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Invite Details */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start gap-3">
              <Building className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Organisation</p>
                <p className="text-sm text-muted-foreground">{inviteData.organisationName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{inviteData.invitedEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Your Role</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="size-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Invited By</p>
                <p className="text-sm text-muted-foreground">{inviteData.invitedByName}</p>
              </div>
            </div>
          </div>

          {daysUntilExpiry <= 2 && (
            <Alert className="mb-6">
              <AlertCircle className="size-4" />
              <AlertDescription>
                This invite expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"}. Please complete your registration soon.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1.5">
                  First Name <span className="text-destructive">*</span>
                </label>
                <Input id="firstName" placeholder="John" {...register("firstName")} />
                <FormError message={errors.firstName?.message} />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1.5">
                  Last Name <span className="text-destructive">*</span>
                </label>
                <Input id="lastName" placeholder="Doe" {...register("lastName")} />
                <FormError message={errors.lastName?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
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
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
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

            <div className="bg-muted/30 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">By accepting this invite, you agree to:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Our{" "}
                  <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </li>
                <li>• Follow your organisation&apos;s data governance policies</li>
                <li>• Use the platform responsibly and ethically</li>
              </ul>
            </div>

            {!inviteData.organisationConsentGiven && (
              <div className="space-y-3">
                <p className="text-sm">
                  {inviteData.organisationName} hasn&apos;t yet consented to our Data Contribution
                  &amp; Usage Consent Agreement. As the first member accepting an invite on its
                  behalf, please review and agree to the terms below.
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg border p-4 bg-muted/20">
                  <DataConsentAgreement organisationName={inviteData.organisationName} />
                </div>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={consentAccepted}
                    onCheckedChange={(checked) => setConsentAccepted(!!checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I have read and agree to the Data Contribution &amp; Usage Consent Agreement on
                    behalf of {inviteData.organisationName}.
                  </span>
                </label>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!inviteData.organisationConsentGiven && !consentAccepted)}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Accept Invite & Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log In
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function InviteRegistrationPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        </Container>
      }
    >
      <InviteRegistrationForm />
    </Suspense>
  );
}
