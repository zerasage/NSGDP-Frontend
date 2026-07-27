"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordStrengthMeter } from "@/components/forms/password-strength-meter";
import { FormError } from "@/components/forms/form-error";
import { useAuth } from "@/lib/auth";
import { updateProfile, changePassword } from "@/lib/api/users";
import {
  profileSchema,
  changePasswordSchema,
} from "@/lib/schemas/auth";
import { toast } from "sonner";
import { z } from "zod";
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageContent,
} from "@/components/layout/dashboard-page-header";

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Profile & Settings"
        description="Manage your account information and preferences"
      />

      <DashboardPageContent>
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 !h-auto p-2 bg-muted rounded-lg">
              <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:shadow-sm !h-auto py-3 px-4 rounded-md">Profile</TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:shadow-sm !h-auto py-3 px-4 rounded-md">Security</TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-background data-[state=active]:shadow-sm !h-auto py-3 px-4 rounded-md">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your profile details visible to other users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm user={user} setSaving={setSaving} saving={saving} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm setSaving={setSaving} saving={saving} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium mb-1">2FA Status</p>
                      <p className="text-sm text-muted-foreground">
                        {user.role === "admin"
                          ? "Enabled (Required for your role)"
                          : "Not enabled"}
                      </p>
                    </div>
                    {user.role !== "admin" && (
                      <Button variant="outline">Enable 2FA</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <NotificationToggle
                    label="Email Notifications"
                    description="Receive updates about your datasets and downloads"
                  />
                  <NotificationToggle
                    label="Dataset Comments"
                    description="Get notified when someone comments on your datasets"
                  />
                  <NotificationToggle
                    label="Access Requests"
                    description="Alert me when someone requests access to restricted datasets"
                  />
                  <NotificationToggle
                    label="Weekly Summary"
                    description="Receive a weekly summary of portal activity"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>Customize how you view the portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="defaultView" className="block text-sm font-medium mb-2">
                      Default View
                    </label>
                    <select
                      id="defaultView"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2"
                      defaultValue="grid"
                    >
                      <option value="grid">Grid View</option>
                      <option value="list">List View</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="itemsPerPage" className="block text-sm font-medium mb-2">
                      Items Per Page
                    </label>
                    <select
                      id="itemsPerPage"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2"
                      defaultValue="20"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
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
      // Invalidate auth queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success("Profile updated successfully");
      setSaving(false);
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update profile";
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
    
    // Parse fullName into firstName and lastName
    const nameParts = data.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    
    updateProfileMutation.mutate({
      firstName,
      lastName,
      phoneNumber: data.phone || undefined,
      // Note: bio and organization fields may need to be added to backend
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
            Full Name
          </label>
          <Input id="fullName" {...register("fullName")} />
          <FormError message={errors.fullName?.message} />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email Address
          </label>
          <Input id="email" type="email" {...register("email")} disabled />
          <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            Phone Number
          </label>
          <Input id="phone" type="tel" placeholder="+234 XXX XXX XXXX" {...register("phone")} />
        </div>
        <div>
          <label htmlFor="organization" className="block text-sm font-medium mb-1.5">
            Organization
          </label>
          <Input id="organization" placeholder="Your organization" {...register("organization")} disabled />
          <p className="text-xs text-muted-foreground mt-1">Contact admin to change</p>
        </div>
      </div>

      {(currentUser.lga || currentUser.ward) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentUser.lga && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                LGA (Local Government Area)
              </label>
              <Input value={currentUser.lga} disabled />
            </div>
          )}
          {currentUser.ward && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Ward
              </label>
              <Input value={currentUser.ward} disabled />
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="bio" className="block text-sm font-medium mb-1.5">
          Bio
        </label>
        <Textarea
          id="bio"
          rows={3}
          placeholder="Tell us about yourself and your work..."
          {...register("bio")}
        />
        <FormError message={errors.bio?.message} />
      </div>

      <Button type="submit" disabled={saving}>
        <Save className="size-4 mr-2" />
        {saving ? "Saving..." : "Save Changes"}
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
      toast.success("Password changed successfully. Please login with your new password.");
      reset();
      setSaving(false);
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to change password";
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
        <label htmlFor="currentPassword" className="block text-sm font-medium mb-1.5">
          Current Password
        </label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            {...register("currentPassword")}
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
        <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5">
          New Password
        </label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            {...register("newPassword")}
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
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
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

      <Button type="submit" disabled={saving}>
        {saving ? "Changing Password..." : "Change Password"}
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
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="font-medium mb-1">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked="true"
        aria-label={`Toggle ${label}`}
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary"
      >
        <span className="translate-x-6 inline-block size-4 transform rounded-full bg-white transition" />
      </button>
    </div>
  );
}
