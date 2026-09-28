import type { Metadata } from "next";
import { LearningHub } from "@/components/learning/learning-hub";

export const metadata: Metadata = {
  title: "Learning hub",
  description:
    "Guides, videos, templates and training for sharing data on the Niger State Geospatial Data Portal.",
};

export default function LearningPage() {
  return <LearningHub variant="portal" />;
}
