"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Database, ShieldCheck, Loader2, ArrowLeft, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/forms/form-error";
import { AuthShell, AuthBrandPanel, AuthBrandMeta } from "@/components/layout/auth-shell";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/constants/brand";
import type { MfaMethod } from "@/lib/types/auth";
import { toast } from "sonner";

const MFA_COPY: Record<MfaMethod, { icon: typeof Smartphone; title: string; body: string; canResend: boolean }> = {
  totp: {
    icon: Smartphone,
    title: "Enter your authenticator code",
    body: "Open your authenticator app and enter the 6-digit code it's showing.",
    canResend: false,
  },
  sms: {
    icon: MessageSquare,
    title: "Enter the code we texted you",
    body: "We sent a code to the phone number on your account. It expires in a few minutes.",
    canResend: true,
  },
  email: {
    icon: Mail,
    title: "Enter the code we emailed you",
    body: "We sent a code to your email address. It expires in a few minutes.",
    canResend: true,
  },
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 (MFA) state — credentials are held only in memory for the
  // duration of this page, never persisted, just enough to resubmit login()
  // with the code once the user has it.
  const [mfaMethod, setMfaMethod] = useState<MfaMethod | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [resending, setResending] = useState(false);

  const returnTo = searchParams?.get("returnTo") || "/dashboard";
  const isDatasetReturn = searchParams?.get("returnTo")?.includes("/dataportal/") ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const completeLogin = () => {
    const safeReturnTo =
      returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
    router.push(safeReturnTo);
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const result = await login({ email: data.email, password: data.password });

      if (result.requiresMfa) {
        setPendingCredentials({ email: data.email, password: data.password });
        setMfaMethod(result.mfaMethod ?? "totp");
        return;
      }

      completeLogin();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid credentials. Please try again.";
      if (errorMessage.includes("pending approval")) {
        toast.error(
          "Your account is pending admin approval. You'll receive an email once activated."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitMfa = async () => {
    if (!pendingCredentials || mfaCode.trim().length === 0) return;
    setLoading(true);
    try {
      const result = await login({ ...pendingCredentials, mfaCode: mfaCode.trim() });
      if (!result.requiresMfa) {
        completeLogin();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Invalid code. Please try again.";
      toast.error(errorMessage);
      setMfaCode("");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!pendingCredentials) return;
    setResending(true);
    try {
      // login() without a code re-triggers the same server-side send this
      // page already relies on for the first code — no separate resend
      // endpoint needed.
      await login(pendingCredentials);
      toast.success("A new code is on its way.");
    } catch {
      toast.error("Couldn't resend the code — try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  if (pendingCredentials && mfaMethod) {
    const copy = MFA_COPY[mfaMethod];
    const Icon = copy.icon;
    return (
      <AuthShell
        size="lg"
        panel={
          <AuthBrandPanel
            eyebrow="Secure access"
            title={`Welcome back to ${BRAND.portalName}`}
            description="Sign in to download datasets, track requests, and manage your development partner workspace."
          >
            <AuthBrandMeta icon={<Database className="size-4" />} label="Open data" value="Catalogue & geospatial layers" />
            <AuthBrandMeta icon={<ShieldCheck className="size-4" />} label="Trusted access" value="Role-based partner & staff accounts" />
          </AuthBrandPanel>
        }
      >
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => {
              setPendingCredentials(null);
              setMfaMethod(null);
              setMfaCode("");
            }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>

          <div className="space-y-1.5">
            <div className="mb-1 flex size-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
              <Icon className="size-5 text-primary" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{copy.title}</h2>
            <p className="text-sm text-muted-foreground">{copy.body}</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitMfa();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="mfaCode" className="mb-1.5 block text-sm font-medium">
                Verification code
              </label>
              <Input
                id="mfaCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="text-center text-lg tracking-[0.3em]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || mfaCode.trim().length === 0}>
              {loading ? "Verifying..." : "Verify and log in"}
            </Button>

            {copy.canResend && (
              <button
                type="button"
                onClick={onResend}
                disabled={resending}
                className="w-full text-center text-sm text-primary hover:underline disabled:opacity-60"
              >
                {resending ? "Sending..." : "Didn't get a code? Resend"}
              </button>
            )}
          </form>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      size="lg"
      panel={
        <AuthBrandPanel
          eyebrow="Secure access"
          title={`Welcome back to ${BRAND.portalName}`}
          description="Sign in to download datasets, track requests, and manage your development partner workspace."
        >
          <AuthBrandMeta
            icon={<Database className="size-4" />}
            label="Open data"
            value="Catalogue & geospatial layers"
          />
          <AuthBrandMeta
            icon={<ShieldCheck className="size-4" />}
            label="Trusted access"
            value="Role-based partner & staff accounts"
          />
        </AuthBrandPanel>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Log in</h2>
          <p className="text-sm text-muted-foreground">
            Access your account and datasets on the portal.
          </p>
        </div>

        {isDatasetReturn && (
          <div className="rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-sm text-info-foreground">
            Log in to download this dataset.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              autoComplete="email"
              {...register("email")}
            />
            <FormError message={errors.email?.message} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
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
            <FormError message={errors.password?.message} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" {...register("remember")} />
            <label htmlFor="remember" className="text-sm">
              Remember me for 30 days
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
