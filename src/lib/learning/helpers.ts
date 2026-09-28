import type { UserRole } from "@/types";
import { GUIDES, getGuide } from "./guides";
import { LEARNING_PATHS } from "./paths";
import { FAQS, GLOSSARY } from "./reference";
import { VIDEOS } from "./videos";
import type {
  AudienceFilter,
  FaqItem,
  GlossaryTerm,
  Guide,
  LearningAudience,
  LearningPath,
  VideoTutorial,
} from "./types";

export const AUDIENCE_LABEL: Record<LearningAudience, string> = {
  contributor: "Contributor",
  partner_admin: "Partner admin",
  viewer: "Public",
};

export function defaultAudienceForRole(role: UserRole | undefined | null): AudienceFilter {
  if (role === "admin") return "partner_admin";
  if (role === "contributor") return "contributor";
  return "all";
}

export function guideMatchesAudience(guide: Guide, audience: AudienceFilter): boolean {
  return audience === "all" || guide.audience.includes(audience);
}

export function pathForAudience(audience: AudienceFilter): LearningPath {
  if (audience === "partner_admin") return LEARNING_PATHS[1];
  if (audience === "viewer") return LEARNING_PATHS[2];
  return LEARNING_PATHS[0];
}

/** First guide in the path the reader has not completed yet. */
export function nextGuideInPath(path: LearningPath, completed: string[]): Guide | undefined {
  const slug = path.guides.find((s) => !completed.includes(s));
  return slug ? getGuide(slug) : undefined;
}

export function pathProgress(path: LearningPath, completed: string[]) {
  const total = path.guides.length;
  const done = path.guides.filter((s) => completed.includes(s)).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function remainingMinutes(path: LearningPath, completed: string[]): number {
  return path.guides
    .filter((s) => !completed.includes(s))
    .reduce((sum, s) => sum + (getGuide(s)?.minutes ?? 0), 0);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function learningHref(basePath: string, slug?: string, tab?: string): string {
  if (slug) return `${basePath}/${slug}`;
  return tab ? `${basePath}?tab=${tab}` : basePath;
}

/** Step content hard-codes `/learning/...` links; point them at the current surface. */
export function resolveLearningHref(href: string, basePath: string): string {
  if (href === "/learning" || href.startsWith("/learning/") || href.startsWith("/learning?")) {
    return `${basePath}${href.slice("/learning".length)}`;
  }
  return href;
}

// ── Search ────────────────────────────────────────────────────────────────

export interface LearningSearchResults {
  guides: Guide[];
  videos: VideoTutorial[];
  glossary: GlossaryTerm[];
  faqs: FaqItem[];
  total: number;
}

function normalise(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function scoreText(haystack: string, tokens: string[]): number {
  const text = normalise(haystack);
  let score = 0;
  for (const t of tokens) {
    if (!text.includes(t)) return 0;
    score += 1;
  }
  return score;
}

export function searchLearning(query: string, audience: AudienceFilter): LearningSearchResults {
  const tokens = normalise(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { guides: [], videos: [], glossary: [], faqs: [], total: 0 };
  }

  const guides = GUIDES.filter((g) => guideMatchesAudience(g, audience))
    .map((g) => {
      const title = scoreText(g.title, tokens) * 5;
      const summary = scoreText(g.summary, tokens) * 3;
      const body = scoreText(
        [...g.outcomes, ...g.steps.map((s) => `${s.title} ${s.body}`)].join(" "),
        tokens,
      );
      return { g, score: title + summary + body };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.g);

  const videos = VIDEOS.filter(
    (v) => scoreText(`${v.title} ${v.description} ${v.chapters.map((c) => c.label).join(" ")}`, tokens) > 0,
  );
  const glossary = GLOSSARY.filter((t) => scoreText(`${t.term} ${t.definition}`, tokens) > 0);
  const faqs = FAQS.filter((f) => scoreText(`${f.question} ${f.answer}`, tokens) > 0);

  return {
    guides,
    videos,
    glossary,
    faqs,
    total: guides.length + videos.length + glossary.length + faqs.length,
  };
}
