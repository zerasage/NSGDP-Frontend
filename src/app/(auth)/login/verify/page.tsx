"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthBrandPanel } from "@/components/layout/auth-shell";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (otp.some((digit) => digit === "")) return;

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Login successful!");
    router.push("/dashboard");
  }, [otp, router]);

  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      handleSubmit();
    }
  }, [otp, handleSubmit]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, router, user]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success("OTP resent to your email!");
    setResendCooldown(60);
  };

  if (isLoading || !user) {
    return null;
  }

  return (
    <AuthShell
      size="lg"
      panel={
        <AuthBrandPanel
          eyebrow="Two-factor authentication"
          title="Enter your verification code"
          description="We sent a 6-digit code to your email. Enter it below to finish signing in."
        />
      }
    >
      <div className="space-y-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 sm:mx-0">
            <Shield className="size-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Verify code</h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to {user.email || "your email"}
          </p>
        </div>

        <div className="flex justify-center gap-2 sm:justify-start">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="size-11 min-h-11 min-w-11 rounded-lg border border-input bg-background text-center text-lg font-semibold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={loading}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        {!loading && otp.every((digit) => digit !== "") && (
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            Verify Code
          </Button>
        )}

        <div className="text-center sm:text-left">
          <p className="mb-2 text-sm text-muted-foreground">Didn&apos;t receive the code?</p>
          <Button variant="ghost" size="sm" onClick={handleResend} disabled={resendCooldown > 0}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </Button>
        </div>

        <div className="border-t pt-4">
          <Button variant="outline" onClick={() => router.push("/login")} className="w-full">
            Back to Login
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
