import type { Metadata } from "next";
import { LearningHub } from "@/components/learning/learning-hub";

export const metadata: Metadata = { title: "Learning hub" };

export default function DashboardLearningPage() {
  return <LearningHub variant="dashboard" />;
}
