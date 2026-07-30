import { redirect } from "next/navigation";

// Superseded by /upload (the real, API-wired submission wizard) — this page
// never actually submitted anything, it just faked a 1.5s delay.
export default function SubmitDatasetRedirect() {
  redirect("/upload");
}
