"use client";

import { useParams } from "next/navigation";
import { ProgramDetailView } from "@/components/programs/program-detail-view";

export default function MyProgramDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  return <ProgramDetailView slug={slug} orgScope />;
}
