"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell, AuthBrandPanel } from "@/components/layout/auth-shell";
import { verifyEmail, resendVerification } from "@/lib/api";
import { storeTokens } from "@/lib/utils";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [verifying, setVerifying] = useState(!!token);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const response = await verifyEmail({ token });

        if (response.tokens) {
          storeTokens(
            response.tokens.accessToken,
            response.tokens.refreshToken,
            response.tokens.expiresIn
          );
        }

        toast.success("Email verified! Welcome to the portal.");
        window.location.href = "/dashboard";
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "This verification link is invalid or has expired.";
        setVerifyError(errorMessage);
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;

    setResending(true);
    try {
      await resendVerification({ email });
      toast.success("Verification email sent! Check your inbox.");

      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error("Failed to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (verifying) {
    return (
      <AuthShell
        size="lg"
        panel={
          <AuthBrandPanel
            eyebrow="Email verification"
            title="Confirming your address"
            description="Hang tight — we're validating the link from your email."
          />
        }
      >
        <div className="py-8 text-center">
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your email...</p>
        </div>
      </AuthShell>
    );
  }

  if (verifyError) {
    return (
      <AuthShell
        size="lg"
        panel={
          <AuthBrandPanel
            eyebrow="Email verification"
            title="We couldn't verify that link"
            description="It may have expired. Request a fresh verification email and try again."
          />
        }
      >
        <div className="space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
            <AlertCircle className="size-7 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Verification failed</h2>
          </div>
          <Alert variant="destructive">
            <AlertDescription>{verifyError}</AlertDescription>
          </Alert>

          {email && (
            <Button onClick={handleResend} disabled={resending || resendCooldown > 0} className="w-full">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send a New Verification Link"}
            </Button>
          )}

          <Link href="/login">
            <Button variant="outline" className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      size="lg"
      panel={
        <AuthBrandPanel
          eyebrow="Email verification"
          title="Almost there"
          description="Open the message we sent and tap the verification link to activate your account."
        />
      }
    >
      <div className="space-y-5">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-info/15 sm:mx-0">
          <Mail className="size-7 text-info" />
        </div>
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Check your email</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification link to{" "}
            {email ? <strong>{email}</strong> : "your email address"}. Click the link to verify
            your account and log in.
          </p>
        </div>

        <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm">
          <p className="mb-2 font-medium">Didn&apos;t receive the email?</p>
          <ul className="space-y-1 text-left text-muted-foreground">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure you entered the correct email address</li>
            <li>• Wait a few minutes for the email to arrive</li>
          </ul>
        </div>

        <Button
          onClick={handleResend}
          variant="outline"
          disabled={!email || resending || resendCooldown > 0}
          className="w-full"
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : resending
              ? "Sending..."
              : "Resend Verification Email"}
        </Button>

        <div className="space-y-2 border-t pt-4">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            After verifying your email, you&apos;ll be logged in automatically.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell size="sm">
          <div className="py-10 text-center">
            <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </AuthShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
