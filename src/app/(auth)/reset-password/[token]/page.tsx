"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { FormError } from "@/components/forms/form-error";
import { AuthShell, AuthBrandPanel } from "@/components/layout/auth-shell";
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { resetPassword } from "@/lib/api";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type ResetFormData = { password: string; confirmPassword: string };

function ResetPasswordContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const tokenExpired =
    searchParams.get("expired") === "1" || searchParams.get("expired") === "true";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        token,
        password: data.password,
      });

      toast.success("Password reset successful! You can now log in with your new password.");
      router.push("/login");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password. Please try again.";
      if (errorMessage.includes("expired") || errorMessage.includes("invalid")) {
        toast.error("Reset link has expired or is invalid. Please request a new one.");
        router.push("/forgot-password");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (tokenExpired) {
    return (
      <AuthShell
        size="lg"
        panel={
          <AuthBrandPanel
            eyebrow="Password reset"
            title="This link has expired"
            description="Request a fresh reset email and choose a new password from there."
          />
        }
      >
        <div className="space-y-5 text-center sm:text-left">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 sm:mx-0">
            <XCircle className="size-7 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Link expired</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link has expired or is no longer valid. Please request a new
              one.
            </p>
          </div>
          <Button onClick={() => router.push("/forgot-password")} className="w-full">
            Request New Link
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      size="lg"
      panel={
        <AuthBrandPanel
          eyebrow="Password reset"
          title="Choose a new password"
          description="Pick something strong and unique. You'll use it the next time you sign in."
        />
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Reset your password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your new password below. Make sure it&apos;s strong and secure.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
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
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Resetting Password..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
