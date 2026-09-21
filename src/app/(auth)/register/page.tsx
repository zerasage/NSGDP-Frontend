"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, MapPin, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { FormError } from "@/components/forms/form-error";
import { AuthShell, AuthBrandPanel, AuthBrandMeta } from "@/components/layout/auth-shell";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { register as registerUser } from "@/lib/api";
import { storeTokens } from "@/lib/utils";
import { NIGER_STATE_LGAS } from "@/lib/constants";
import { getWardGisSummary } from "@/lib/api/gis";
import { useQuery } from "@tanstack/react-query";
import { BRAND } from "@/lib/constants/brand";
import { toast } from "sonner";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false as unknown as true },
    mode: "onChange",
  });

  const password = watch("password", "");
  const selectedLga = watch("lga");

  const { data: wardSummary } = useQuery({
    queryKey: ["register-ward-summary", selectedLga],
    queryFn: () => getWardGisSummary(selectedLga),
    enabled: !!selectedLga,
  });
  const wardOptions = Array.from(
    new Set((wardSummary?.features ?? []).map((f) => f.properties.ward))
  ).sort();

  useEffect(() => {
    if (inviteToken) {
      router.replace(`/register/invite?token=${inviteToken}`);
    }
  }, [inviteToken, router]);

  if (inviteToken) {
    return (
      <AuthShell size="sm">
        <div className="py-10 text-center">
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to invite page...</p>
        </div>
      </AuthShell>
    );
  }

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);

    try {
      const response = await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phone,
        accessLevel: "public",
        lga: data.lga || undefined,
        ward: data.ward || undefined,
        reason: data.reason,
      });

      if (!response.tokens) {
        toast.success("Registration successful! Check your email to verify your account.");
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }

      storeTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken,
        response.tokens.expiresIn
      );

      toast.success("Registration successful! Welcome to the portal.");
      router.push("/dashboard");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      size="lg"
      panel={
        <AuthBrandPanel
          eyebrow="Create account"
          title="Join the Niger State health data community"
          description={`Register for ${BRAND.portalName} to browse, download, and request access to published datasets.`}
        >
          <AuthBrandMeta
            icon={<UserPlus className="size-4" />}
            label="Public registration"
            value="Browse & download open datasets"
          />
          <AuthBrandMeta
            icon={<MapPin className="size-4" />}
            label="Local context"
            value="Optional LGA and ward for better relevance"
          />
        </AuthBrandPanel>
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Create an account</h2>
          <p className="text-sm text-muted-foreground">
            Register to access and download datasets from the portal.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </label>
            <Input id="fullName" placeholder="Enter your full name" {...register("fullName")} />
            <FormError message={errors.fullName?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                Email Address <span className="text-destructive">*</span>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lga" className="mb-1.5 block text-sm font-medium">
                LGA (Optional)
              </label>
              <Controller
                name="lga"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger id="lga">
                      <SelectValue placeholder="Select your LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGER_STATE_LGAS.map((lga) => (
                        <SelectItem key={lga} value={lga}>
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <label htmlFor="ward" className="mb-1.5 block text-sm font-medium">
                Ward (Optional)
              </label>
              <Controller
                name="ward"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v ?? "")}
                    disabled={!selectedLga || wardOptions.length === 0}
                  >
                    <SelectTrigger id="ward">
                      <SelectValue
                        placeholder={selectedLga ? "Select your ward" : "Select an LGA first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wardOptions.map((ward) => (
                        <SelectItem key={ward} value={ward}>
                          {ward}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password <span className="text-destructive">*</span>
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
          </div>
          <PasswordStrengthMeter password={password} />

          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">
              Reason for Registering (Optional)
            </label>
            <Textarea
              id="reason"
              rows={2}
              maxLength={500}
              placeholder="Tell us how you plan to use the portal..."
              className="resize-none"
              {...register("reason")}
            />
            <FormError message={errors.reason?.message} />
          </div>

          <div className="flex items-start gap-2">
            <Controller
              name="terms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="terms"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              )}
            />
            <label htmlFor="terms" className="text-sm leading-relaxed">
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          <FormError message={errors.terms?.message} />

          <Button type="submit" className="w-full" disabled={loading || !isValid}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log In
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            Need to contribute data on behalf of a development partner? Contributor and admin
            accounts are set up by invitation — contact{" "}
            <a
              href="mailto:admin@nigerstate-geohealth.ng"
              className="text-primary hover:underline"
            >
              admin@nigerstate-geohealth.ng
            </a>
            .
          </p>
        </form>
      </div>
    </AuthShell>
  );
}

export const dynamic = "force-dynamic";

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  );
}
