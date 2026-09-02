"use client";

import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepperStep {
  id: number;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  const current = steps.find((step) => step.id === currentStep);
  const progressPercent = Math.round((currentStep / steps.length) * 100);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium">
            Step {currentStep} of {steps.length}
            {current ? `: ${current.name}` : ""}
          </p>
          <span className="shrink-0 tabular-nums text-muted-foreground">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {steps.map((step) => {
            const isComplete = currentStep > step.id;
            const isActive = currentStep === step.id;
            const clickable = onStepClick && step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(step.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                  isActive && "border-primary bg-primary text-primary-foreground",
                  isComplete && !isActive && "border-primary/30 bg-primary/10 text-primary",
                  !isActive && !isComplete && "border-border text-muted-foreground",
                  clickable && "cursor-pointer",
                )}
              >
                {isComplete ? "Done" : step.id}. {step.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden items-center justify-center lg:flex">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isComplete = currentStep > step.id;
          const isActive = currentStep >= step.id;
          const clickable = onStepClick && step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                className={cn(
                  "flex max-w-[7rem] flex-col items-center",
                  clickable ? "cursor-pointer" : "cursor-default",
                )}
                onClick={() => clickable && onStepClick(step.id)}
                disabled={!clickable}
                aria-current={currentStep === step.id ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border-2 transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="size-5" aria-hidden="true" />
                  ) : Icon ? (
                    <Icon className="size-5" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 line-clamp-2 text-center text-xs font-medium sm:text-sm",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.name}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-10 transition-colors xl:mx-4 xl:w-16",
                    currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
