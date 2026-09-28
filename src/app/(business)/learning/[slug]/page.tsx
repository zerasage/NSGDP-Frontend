import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "@/components/learning/guide-page";
import { GUIDES, getGuide } from "@/lib/learning/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return guide ? { title: guide.title, description: guide.summary } : { title: "Guide not found" };
}

export default async function LearningGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuidePage guide={guide} variant="portal" />;
}
