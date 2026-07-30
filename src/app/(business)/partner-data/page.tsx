import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { statusPill } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle2, FileCheck, Handshake, Lock, Users, Upload } from "lucide-react";

const STEPS = [
  {
    num: 1,
    title: "Expression of Interest",
    description: "Submit a brief expression of interest including your organisation profile, data type, and intended contribution frequency.",
    icon: Handshake,
  },
  {
    num: 2,
    title: "Data Sharing Agreement",
    description: "NSPHCDA reviews your EOI and, if appropriate, issues a Data Sharing Agreement defining ownership, use, and attribution.",
    icon: FileCheck,
  },
  {
    num: 3,
    title: "Account & Onboarding",
    description: "Receive a Contributor account. Your organisation is registered in the portal with a dedicated profile.",
    icon: Users,
  },
  {
    num: 4,
    title: "Submit & Track",
    description: "Upload datasets via the Submit Dataset form. Track review status in your dashboard. NSPHCDA validates before publication.",
    icon: Upload,
  },
];

const REQUIREMENTS = [
  "Organisation must operate within or serve Niger State",
  "Data must relate to health, geospatial, or social determinants of health",
  "Data must not contain personally identifiable patient information (PII/PHI)",
  "Submitting organisation must hold rights to share the data",
  "A Data Sharing Agreement must be in place before any restricted data is shared",
];

const PARTNERS = [
  { name: "WHO Nigeria",              type: "UN Agency",          status: "active" as const },
  { name: "UNICEF Niger State",       type: "UN Agency",          status: "active" as const },
  { name: "GRID3 Nigeria",            type: "Research",           status: "active" as const },
  { name: "NPHCDA",                   type: "Federal Government", status: "active" as const },
  { name: "Federal Ministry of Health",type: "Federal Government",status: "active" as const },
  { name: "National Population Commission",type:"Federal Government",status:"active" as const},
];

export default function PartnerDataPage() {
  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-8">
          <div className="flex items-center gap-3 mb-2">
            <Handshake className="size-7 text-primary" />
            <h1 className="text-3xl font-bold">Partner Data Integration</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            A structured pathway for NGOs, development partners, research institutions, and government agencies to contribute and manage datasets on the NSPHCDA Data Portal.
          </p>
        </Container>
      </div>

      <Container className="py-12 space-y-12">
        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold mb-6">How the Partnership Process Works</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <Card key={step.num} className="relative overflow-hidden">
                <div className="absolute top-3 right-3 text-5xl font-black text-muted/30 select-none leading-none">
                  {step.num}
                </div>
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <step.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base mt-2">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="size-5 text-primary" />
                Partnership Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {REQUIREMENTS.map((req) => (
                <p key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                  {req}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-5 text-primary" />
                Data Governance Commitments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>All partner-contributed datasets are subject to the same 6-stage approval pipeline and QA checklist as internally generated data.</p>
              <p>Partners retain ownership of their contributed data. NSPHCDA holds publication rights for datasets accepted into the portal.</p>
              <p>Restricted datasets are only accessible to approved users under the terms of the Data Sharing Agreement.</p>
              <p>Partners receive automated notifications on download activity and access requests for their datasets.</p>
            </CardContent>
          </Card>
        </section>

        {/* Current partners */}
        <section>
          <h2 className="text-xl font-bold mb-4">Current Data Partners</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((p) => (
              <div key={p.name} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {p.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.type}</p>
                </div>
                <Badge variant="secondary" className={cn("ml-auto shrink-0 text-xs", statusPill.emerald)}>
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border bg-primary/5 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Interested in Becoming a Data Partner?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Contact the NSPHCDA Data Team to begin the partnership process. We will respond within 5 working days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:data@nsphcda.ng">
              <Button size="lg">
                Submit Expression of Interest
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </a>
            <Link href="/upload">
              <Button variant="outline" size="lg">Submit a Dataset</Button>
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}
