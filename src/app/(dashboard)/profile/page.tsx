"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Lock, Settings, SlidersHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpTip } from "@/components/ui/help-tip";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { FormError } from "@/components/forms/form-error";
import {
  DashboardPage,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";
import { DashboardPanel, FilterChip } from "@/components/dashboard/portal-dashboard-ui";
import { useAuth } from "@/lib/auth";
import { updateProfile, changePassword } from "@/lib/api/users";
import { profileSchema, changePasswordSchema } from "@/lib/schemas/auth";
import { PORTAL_PROFILE_PAGE_TIP } from "@/lib/constants/portal-tooltips";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { z } from "zod";

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;
type ProfileTab = "profile" | "security" | "preferences";

const TABS: { value: ProfileTab; label: string; icon: typeof User }[] = [
  { value: "profile", label: "Profile", icon: User },
  { value: "security", label: "Security", icon: Lock },
  { value: "preferences", label: "Preferences", icon: SlidersHorizontal },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  return (
    <DashboardPage>
      <div className="border-b bg-background px-4 py-5 sm:px-6 sm:py-6">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-muted-foreground/20 bg-muted/30 px-2.5 py-1">
            <Settings className="size-3.5 text-muted-foreground" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Account
            </span>
          </div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            Profile & settings
            <HelpTip content={PORTAL_PROFILE_PAGE_TIP} label="Profile page help" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.firstName} {user.lastName} · {user.email}
          </p>
        </div>
      </div>

      <DashboardPageContent className="mx-auto w-full max-w-3xl space-y-4 sm:space-y-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <FilterChip
              key={tab.value}
              active={activeTab === tab.value}
              label={tab.label}
              onClick={() => setActiveTab(tab.value)}
            />
          ))}
        </div>

        {activeTab === "profile" ? (
          <DashboardPanel
            title="Personal information"
            description="Update the details shown on your portal account."
            icon={User}
            tone="primary"
          >
            <ProfileForm user={user} setSaving={setSaving} saving={saving} />
          </DashboardPanel>
        ) : null}

        {activeTab === "security" ? (
          <div className="space-y-4 sm:space-y-6">
            <DashboardPanel
              title="Change password"
              description="Use a strong password you do not reuse on other sites."
              icon={Lock}
              tone="warning"
            >
              <PasswordForm setSaving={setSaving} saving={saving} />
            </DashboardPanel>

            <DashboardPanel
              title="Two-factor authentication"
              description="Extra sign-in protection for your account."
              icon={Lock}
              tone="muted"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">2FA status</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.role === "admin"
                      ? "Enabled (required for your role)"
                      : "Not enabled"}
                  </p>
                </div>
                {user.role !== "admin" ? (
                  <Button variant="outline" className="h-11 shrink-0 sm:h-10" disabled>
                    Enable 2FA
                  </Button>
                ) : null}
              </div>
            </DashboardPanel>
          </div>
        ) : null}

        {activeTab === "preferences" ? (
          <div className="space-y-4 sm:space-y-6">
            <DashboardPanel
              title="Notification preferences"
              description="Choose how you want to be notified. Saved preferences coming soon."
              icon={SlidersHorizontal}
              tone="info"
            >
              <div className="space-y-5">
                <NotificationToggle
                  label="Email notifications"
                  description="Updates about your datasets and downloads"
                />
                <NotificationToggle
                  label="Dataset comments"
                  description="When someone comments on your datasets"
                />
                <NotificationToggle
                  label="Access requests"
                  description="When someone requests access to restricted datasets"
                />
                <NotificationToggle
                  label="Weekly summary"
                  description="A weekly summary of portal activity"
                />
              </div>
            </DashboardPanel>

            <DashboardPanel
              title="Display preferences"
              description="Customise how you browse the portal."
              icon={Settings}
              tone="muted"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="defaultView" className="mb-1.5 block text-sm font-medium">
                    Default view
                  </label>
                  <select
                    id="defaultView"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    defaultValue="grid"
                    disabled
                  >
                    <option value="grid">Grid view</option>
                    <option value="list">List view</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="itemsPerPage" className="mb-1.5 block text-sm font-medium">
                    Items per page
                  </label>
                  <select
                    id="itemsPerPage"
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    defaultValue="20"
                    disabled
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Display preferences are not saved yet — this preview shows planned options.
                </p>
              </div>
            </DashboardPanel>
          </div>
        ) : null}
      </DashboardPageContent>
    </DashboardPage>
  );
}

function ProfileForm({
  user: currentUser,
  setSaving,
  saving,
}: {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phoneNumber?: string;
    organisationName?: string;
    lga?: string;
    ward?: string;
  };
  setSaving: (v: boolean) => void;
  saving: boolean;
}) {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Profile updated successfully");
      setSaving(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update profile";
      toast.error(message);
      setSaving(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      bio: "",
      phone: currentUser.phoneNumber || "",
      organization: currentUser.organisationName || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    const nameParts = data.fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || nameParts[0];

    updateProfileMutation.mutate({
      firstName,
      lastName,
      phoneNumber: data.phone || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
            Full name
          </label>
          <Input id="fullName" className="h-11" {...register("fullName")} disabled={saving} />
          <FormError message={errors.fullName?.message} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email address
          </label>
          <Input id="email" type="email" className="h-11" {...register("email")} disabled />
          <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed here</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
            Phone number
          </label>
          <Input
            id="phone"
            type="tel"
            className="h-11"
            placeholder="+234 XXX XXX XXXX"
            {...register("phone")}
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="organization" className="mb-1.5 block text-sm font-medium">
            Organisation
          </label>
          <Input id="organization" className="h-11" {...register("organization")} disabled />
          <p className="mt-1 text-xs text-muted-foreground">Contact your org admin to change</p>
        </div>
      </div>

      {currentUser.lga || currentUser.ward ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentUser.lga ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">LGA</label>
              <Input value={currentUser.lga} className="h-11" disabled />
            </div>
          ) : null}
          {currentUser.ward ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ward</label>
              <Input value={currentUser.ward} className="h-11" disabled />
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium">
          Bio
        </label>
        <Textarea
          id="bio"
          rows={3}
          placeholder="Tell us about yourself and your work…"
          {...register("bio")}
          disabled={saving}
        />
        <FormError message={errors.bio?.message} />
      </div>

      <Button type="submit" disabled={saving} className="h-11 gap-2 sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </form>
  );
}

function PasswordForm({
  setSaving,
  saving,
}: {
  setSaving: (v: boolean) => void;
  saving: boolean;
}) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully. Please sign in with your new password.");
      reset();
      setSaving(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to change password";
      toast.error(message);
      setSaving(false);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword", "");

  const onSubmit = async (data: PasswordFormData) => {
    setSaving(true);
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium">
          Current password
        </label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            className="h-11 pr-10"
            {...register("currentPassword")}
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <FormError message={errors.currentPassword?.message} />
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium">
          New password
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            className="h-11 pr-10"
            {...register("newPassword")}
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <PasswordStrengthMeter password={newPassword} />
        <FormError message={errors.newPassword?.message} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium">
          Confirm new password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            className="h-11 pr-10"
            {...register("confirmPassword")}
            disabled={saving}
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

      <Button type="submit" disabled={saving} className="h-11 gap-2 sm:w-auto">
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Changing password…
          </>
        ) : (
          "Change password"
        )}
      </Button>
    </form>
  );
}

function NotificationToggle({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked="true"
        aria-label={`Toggle ${label}`}
        disabled
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-primary opacity-60",
        )}
      >
        <span className="translate-x-6 inline-block size-5 transform rounded-full bg-white transition" />
      </button>
    </div>
  );
}
