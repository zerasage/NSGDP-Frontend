"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  programFormSchema,
  defaultProgressModeForType,
  type ProgramFormData,
} from "@/lib/schemas/program";
import {
  PROGRESS_MODE_OPTIONS,
  tracksLgaCoverage,
  tracksOutcomeMetric,
} from "@/lib/constants/program-progress";
import { objectivesToEditorHtml } from "@/lib/api/programs";
import { localDateInputValue } from "@/lib/utils/date";
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
import { LgaMultiSelect } from "@/components/programs/lga-multi-select";
import { RichTextEditor } from "@/components/programs/rich-text-editor";
import type { Program } from "@/types";
import { toast } from "sonner";

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
  isEditing?: boolean;
}

export function ProgramForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save Programme",
  disabled,
  isEditing = false,
}: ProgramFormProps) {
  const todayMin = localDateInputValue();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      type: "campaign",
      status: "planned",
      targetLgas: [],
      objectives: "",
      progressMode: "combined",
      primaryMetric: "",
      targetCount: "",
      ...defaultValues,
    },
  });

  const programmeType = watch("type");
  const progressMode = watch("progressMode");
  const targetLgasSelected = watch("targetLgas");
  const startDateValue = watch("startDate");
  const endDateMin =
    startDateValue && startDateValue > todayMin ? startDateValue : todayMin;

  useEffect(() => {
    if (!isEditing) {
      setValue("progressMode", defaultProgressModeForType(programmeType));
    }
  }, [programmeType, isEditing, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error("Please fix the highlighted fields before submitting.");
      })}
      className="space-y-6"
      noValidate
    >
      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="name">
          Programme Name <span className="text-destructive">*</span>
        </label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} disabled={disabled} />
        <FormError message={errors.name?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Type</label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled}>
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
              <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={disabled}>
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
        <Textarea
          id="description"
          rows={4}
          aria-invalid={!!errors.description}
          {...register("description")}
          disabled={disabled}
        />
        <FormError message={errors.description?.message} />
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="targetLgas">
          Target LGAs <span className="text-destructive">*</span>
        </label>
        <div className="mt-1.5">
          <Controller
            name="targetLgas"
            control={control}
            render={({ field }) => (
              <LgaMultiSelect
                id="targetLgas"
                value={field.value}
                onChange={field.onChange}
                disabled={disabled || isSubmitting}
              />
            )}
          />
        </div>
        <FormError message={errors.targetLgas?.message} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="startDate">
            Start Date <span className="text-destructive">*</span>
          </label>
          <Input
            id="startDate"
            type="date"
            min={todayMin}
            aria-invalid={!!errors.startDate}
            {...register("startDate")}
            disabled={disabled}
          />
          <FormError message={errors.startDate?.message} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="endDate">
            End Date (optional)
          </label>
          <Input
            id="endDate"
            type="date"
            min={endDateMin}
            aria-invalid={!!errors.endDate}
            {...register("endDate")}
            disabled={disabled}
          />
          <FormError message={errors.endDate?.message} />
        </div>
      </div>

      <div className="space-y-4 rounded-xl border p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Progress tracking
        </h3>

        <div>
          <label className="text-sm font-medium mb-1.5 block" htmlFor="progressMode">
            How to track progress
          </label>
          <Controller
            name="progressMode"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger id="progressMode" className="w-full">
                  <SelectValue placeholder="Select tracking mode" />
                </SelectTrigger>
                <SelectContent>
                  {PROGRESS_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {PROGRESS_MODE_OPTIONS.find((o) => o.value === progressMode)?.description}
          </p>
        </div>

        {tracksLgaCoverage(progressMode) && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <p className="font-medium">LGA coverage target</p>
            <p className="mt-1 text-muted-foreground">
              {targetLgasSelected.length} LGA
              {targetLgasSelected.length === 1 ? "" : "s"} selected.
              Mark covered LGAs after saving using Update progress.
            </p>
          </div>
        )}

        {tracksOutcomeMetric(progressMode) && (
          <>
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="primaryMetric">
                Outcome label <span className="text-destructive">*</span>
              </label>
              <Input
                id="primaryMetric"
                placeholder="e.g. Children vaccinated, CHEWs trained"
                aria-invalid={!!errors.primaryMetric}
                {...register("primaryMetric")}
                disabled={disabled}
              />
              <FormError message={errors.primaryMetric?.message} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" htmlFor="targetCount">
                Outcome target <span className="text-destructive">*</span>
              </label>
              <Input
                id="targetCount"
                type="number"
                min={1}
                placeholder="50000"
                aria-invalid={!!errors.targetCount}
                {...register("targetCount")}
                disabled={disabled}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Current reach is updated in Update progress after saving.
              </p>
              <FormError message={errors.targetCount?.message} />
            </div>
          </>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block" htmlFor="objectives">
          Objectives
        </label>
        <div className="mt-1.5">
          <Controller
            name="objectives"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                id="objectives"
                value={field.value}
                onChange={field.onChange}
                disabled={disabled || isSubmitting}
                placeholder="List programme objectives — bullets, bold, and lists supported"
              />
            )}
          />
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
    targetLgas: program.targetLgas ?? [],
    startDate: program.startDate?.split("T")[0] ?? "",
    endDate: program.endDate?.split("T")[0] ?? "",
    objectives: objectivesToEditorHtml(program.objectives),
    progressMode: program.progressMode ?? defaultProgressModeForType(program.type),
    primaryMetric:
      program.primaryMetric && program.primaryMetric !== "LGAs covered"
        ? program.primaryMetric
        : "",
    targetCount: program.targetCount > 0 ? program.targetCount.toString() : "",
  };
}
