import { GraduationCap } from "lucide-react";
import type { Guide } from "@/lib/learning/types";
import { GuideArticle } from "./guide-article";
import { LEARNING_BASE_PATH, LearningShell, type LearningVariant } from "./learning-shell";

/** Server-renderable wrapper: shell + article for one guide on either surface. */
export function GuidePage({ guide, variant }: { guide: Guide; variant: LearningVariant }) {
  return (
    <LearningShell
      variant={variant}
      eyebrow="Learning hub"
      eyebrowIcon={GraduationCap}
      title="Learning hub"
      description="Follow the steps below, then mark the guide complete to track your progress."
    >
      <GuideArticle guide={guide} basePath={LEARNING_BASE_PATH[variant]} />
    </LearningShell>
  );
}
