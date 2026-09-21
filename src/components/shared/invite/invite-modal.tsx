"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/forms/form-error";
import { useCreateInvite } from "@/lib/hooks/useInvites";
import { toast } from "sonner";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["contributor", "admin"]),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  developmentPartnerId?: string; // If undefined, super admin can select org
}

export function InviteModal({ open, onClose, developmentPartnerId }: InviteModalProps) {
  const [loading, setLoading] = useState(false);
  const createInviteMutation = useCreateInvite();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "contributor",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: InviteFormData) => {
    if (!developmentPartnerId) {
      toast.error("Development Partner ID is required");
      return;
    }

    setLoading(true);

    try {
      await createInviteMutation.mutateAsync({
        developmentPartnerId,
        data: {
          invitedEmail: data.email,
          role: data.role,
          message: data.message,
        },
      });

      toast.success(`Invite sent to ${data.email}`);
      reset();
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to send invite";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your development partner. They&apos;ll receive an email with a link to
            create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                className="pl-9"
                {...register("email")}
              />
            </div>
            <FormError message={errors.email?.message} />
          </div>

          {/* Role Selector */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1.5">
              Role <span className="text-destructive">*</span>
            </label>
            <Select value={selectedRole} onValueChange={(value) => setValue("role", value as "contributor" | "admin")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contributor">
                  <div>
                    <div className="font-medium">Data Contributor</div>
                    <div className="text-xs text-muted-foreground">
                      Can upload and manage datasets
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div>
                    <div className="font-medium">Development Partner Admin</div>
                    <div className="text-xs text-muted-foreground">
                      Can manage team and approve datasets
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormError message={errors.role?.message} />
          </div>

          {/* Optional Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1.5">
              Personal Message (Optional)
            </label>
            <Textarea
              id="message"
              rows={3}
              maxLength={500}
              placeholder="Add a personal message to the invitation..."
              {...register("message")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will be included in the invitation email
            </p>
            <FormError message={errors.message?.message} />
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="space-y-1 text-muted-foreground text-xs">
              <li>• Invitation email sent to recipient</li>
              <li>• They click the link and create their account</li>
              <li>• Account is automatically approved and added to your team</li>
              <li>• Invite expires after 7 days if not accepted</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
