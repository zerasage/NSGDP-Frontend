"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programFormSchema, type ProgramFormData } from "@/lib/schemas/program";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/forms/form-error";
import type { Program } from "@/types";

const TYPE_OPTIONS = [
  "campaign",
  "surveillance",
  "screening",
  "training",
  "infrastructure",
  "research",
  "other",
] as const;

interface ProgramFormProps {
  defaultValues?: Partial<ProgramFormData>;
  onSubmit: (data: ProgramFormData) => void | Promise<void>;
  submitLabel?: string;
  disabled?: boolean;
}

export function ProgramForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Programme",
  disabled,
}: ProgramFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      type: "campaign",
      status: "planned",
      targetCount: 1000,
      reachCount: 0,
      lgasCovered: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="name">
          Programme Name <span className="text-destructive">*</span>
        </label>
        <Input id="name" {...register("name")} disabled={disabled} />
        <FormError message={errors.name?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Type</label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FormError message={errors.type?.message} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Status</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FormError message={errors.status?.message} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="description">
          Description <span className="text-destructive">*</span>
        </label>
        <Textarea id="description" rows={4} {...register("description")} disabled={disabled} />
        <FormError message={errors.description?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="startDate">
            Start Date
          </label>
          <Input id="startDate" type="date" {...register("startDate")} disabled={disabled} />
          <FormError message={errors.startDate?.message} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="endDate">
            End Date (optional)
          </label>
          <Input id="endDate" type="date" {...register("endDate")} disabled={disabled} />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="primaryMetric">
          Primary Metric
        </label>
        <Input
          id="primaryMetric"
          placeholder="e.g. MR Coverage, Households Surveyed"
          {...register("primaryMetric")}
          disabled={disabled}
        />
        <FormError message={errors.primaryMetric?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="targetCount">
            Target
          </label>
          <Input id="targetCount" type="number" min={1} {...register("targetCount", { valueAsNumber: true })} disabled={disabled} />
          <FormError message={errors.targetCount?.message} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="reachCount">
            Reached
          </label>
          <Input id="reachCount" type="number" min={0} {...register("reachCount", { valueAsNumber: true })} disabled={disabled} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="lgasCovered">
            LGAs Covered
          </label>
          <Input id="lgasCovered" type="number" min={0} max={25} {...register("lgasCovered", { valueAsNumber: true })} disabled={disabled} />
        </div>
      </div>

      <Button type="submit" disabled={disabled || isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

export function programToFormDefaults(program: Program): Partial<ProgramFormData> {
  return {
    name: program.name,
    type: program.type,
    status: program.status,
    description: program.description,
    startDate: program.startDate,
    endDate: program.endDate ?? "",
    primaryMetric: program.primaryMetric,
    targetCount: program.targetCount,
    reachCount: program.reachCount,
    lgasCovered: program.lgasCovered,
  };
}
