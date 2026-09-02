"use client";

import { useParams } from "next/navigation";
import { ProgramDetailView } from "@/components/programs/program-detail-view";

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ProgramDetailView slug={id} />;
}
