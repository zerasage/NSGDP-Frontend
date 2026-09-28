import { cn } from "@/lib/utils";
import { LIFECYCLE_PIPELINE, LIFECYCLE_RATIONALE } from "@/lib/constants/dataset-lifecycle";

/** What a data contributor sees and should do at each stage (portal wording, not staff wording). */
const CONTRIBUTOR_VIEW: Record<string, { who: string; you: string }> = {
  draft: {
    who: "You",
    you: "Fill in the five steps and attach your file. Nothing is visible to reviewers yet, and you can leave and come back.",
  },
  submitted: {
    who: "Waiting in the queue",
    you: "Your dataset is with the review team. You can still retract it here without approval.",
  },
  under_review: {
    who: "Validator",
    you: "A validator checks it against the eight quality dimensions. If something needs fixing you'll get a revision request.",
  },
  validated: {
    who: "Validator",
    you: "Quality checks passed. A separate approver now decides. Nothing is public yet.",
  },
  approved: {
    who: "Approver",
    you: "Signed off, and you're notified. It's still not public until someone publishes it.",
  },
  published: {
    who: "Publisher",
    you: "Live in the catalogue, subject to the visibility you chose. New data means publishing a new version.",
  },
};

export function LifecycleExplainer() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{LIFECYCLE_RATIONALE.headline}</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Every dataset moves through the same stages. Knowing who holds it at each stage tells you
          when to wait and when to act.
        </p>
      </div>

      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {LIFECYCLE_PIPELINE.map((stage, i) => {
          const view = CONTRIBUTOR_VIEW[stage.stage];
          const isYou = stage.stage === "draft";
          return (
            <li
              key={stage.stage}
              className={cn(
                "rounded-xl border bg-card p-4",
                isYou && "border-primary/40 bg-primary/[0.03]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <span className="flex size-6 items-center justify-center rounded-full border bg-muted/50 text-xs tabular-nums">
                    {i + 1}
                  </span>
                  {stage.label}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {view?.who}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{view?.you}</p>
            </li>
          );
        })}
      </ol>

      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Other outcomes
        </p>
        <ul className="mt-2 space-y-1.5 text-[13px] text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Revision requested.</span> The dataset comes
            back to you with comments. Fix it and resubmit.
          </li>
          <li>
            <span className="font-medium text-foreground">Rejected.</span> The submission is closed and
            you are notified with a reason. It doesn&apos;t re-enter the queue by itself.
          </li>
          <li>
            <span className="font-medium text-foreground">Retracted or archived.</span> Removed from the
            catalogue. Published datasets need super-admin approval to retract.
          </li>
        </ul>
      </div>
    </div>
  );
}
