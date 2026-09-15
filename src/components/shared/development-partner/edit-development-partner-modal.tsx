"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { DevelopmentPartner } from "@/lib/api/development-partners";
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
import { toast } from "sonner";

const updateDevelopmentPartnerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must not exceed 100 characters").optional(),
  description: z.string().max(500, "Description must not exceed 500 characters").optional(),
  type: z.enum(["government", "ngo", "private", "academic", "international", "community", "healthcare", "other"]).optional(),
  website: z.string().url("Please provide a valid URL").optional().or(z.literal("")),
  email: z.string().email("Please provide a valid email").optional().or(z.literal("")),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Please provide a valid phone number").optional().or(z.literal("")),
  address: z.string().max(200, "Address must not exceed 200 characters").optional(),
});

type UpdateDevelopmentPartnerFormData = z.infer<typeof updateDevelopmentPartnerSchema>;

interface EditDevelopmentPartnerModalProps {
  open: boolean;
  onClose: () => void;
  organisation: DevelopmentPartner;
}

export function EditDevelopmentPartnerModal({
  open,
  onClose,
  organisation,
}: EditDevelopmentPartnerModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UpdateDevelopmentPartnerFormData>({
    resolver: zodResolver(updateDevelopmentPartnerSchema),
    defaultValues: {
      name: organisation.name,
      description: organisation.description || "",
      type: organisation.type,
      website: organisation.website || "",
      email: organisation.email || "",
      phone: organisation.phone || "",
      address: organisation.address || "",
    },
  });

  // Reset form when organisation changes
  useEffect(() => {
    reset({
      name: organisation.name,
      description: organisation.description || "",
      type: organisation.type,
      website: organisation.website || "",
      email: organisation.email || "",
      phone: organisation.phone || "",
      address: organisation.address || "",
    });
  }, [organisation, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDevelopmentPartnerFormData) => {
      const response = await apiClient.patch<{ data: DevelopmentPartner }>(
        `/development-partners/${organisation.id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developmentPartner", organisation.id] });
      toast.success("Development Partner updated successfully");
      onClose();
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      const message = error.response?.data?.message || "Failed to update development partner";
      toast.error(message);
    },
  });

  const onSubmit = async (data: UpdateDevelopmentPartnerFormData) => {
    setIsSubmitting(true);
    try {
      // Remove empty strings and convert to undefined
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value,
        ])
      );
      await updateMutation.mutateAsync(cleanedData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Development Partner</DialogTitle>
          <DialogDescription>
            Update your development partner&apos;s information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Development Partner Name
            </label>
            <Input
              id="name"
              placeholder="Niger State Health Agency"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Brief description of your development partner"
              rows={4}
              {...register("description")}
            />
            <p className="text-sm text-muted-foreground">Maximum 500 characters</p>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Development Partner Type
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select development partner type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="healthcare">Healthcare Provider</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="community">Community Development Partner</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Contact Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="info@organization.org"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input
                id="phone"
                placeholder="+234 803 123 4567"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="website" className="text-sm font-medium">
              Website
            </label>
            <Input
              id="website"
              type="url"
              placeholder="https://organization.org"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <Textarea
              id="address"
              placeholder="Physical address"
              rows={2}
              {...register("address")}
            />
            <p className="text-sm text-muted-foreground">Maximum 200 characters</p>
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
