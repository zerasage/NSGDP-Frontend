"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError } from "@/components/forms/form-error";
import { AuthShell, AuthBrandPanel } from "@/components/layout/auth-shell";
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { forgotPassword } from "@/lib/api";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

type ForgotFormData = { email: string };

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true);

    try {
      await forgotPassword({ email: data.email });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
      toast.info("If an account exists, you'll receive reset instructions.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell
        size="lg"
        panel={
          <AuthBrandPanel
            eyebrow="Password reset"
            title="Check your inbox"
            description="If an account exists for that address, reset instructions are on the way."
          />
        }
      >
        <div className="space-y-5 text-center sm:text-left">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 sm:mx-0">
            <KeyRound className="size-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              If an account exists with that email address, we&apos;ve sent password reset
              instructions. Please check your inbox.
            </p>
          </div>
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-left text-sm">
            <p className="mb-2 font-medium">Didn&apos;t receive the email?</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure you entered the correct email</li>
              <li>• Wait a few minutes for the email to arrive</li>
            </ul>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="size-4" />
              Back to Login
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
          eyebrow="Account recovery"
          title="Forgot your password?"
          description="Enter the email on your account and we'll send a secure link to choose a new password."
        />
      }
    >
      <div className="space-y-5">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Reset password</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll email you instructions if that address is registered.
          </p>
        </div>

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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Instructions"}
          </Button>

          <Link href="/login">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="size-4" />
              Back to Login
            </Button>
          </Link>
        </form>
      </div>
    </AuthShell>
  );
}
