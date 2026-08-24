"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { statusPill } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useSubmitPartnerInterest } from "@/lib/hooks/usePartnerInterest";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileCheck, 
  Handshake, 
  Lock, 
  Users, 
  Upload,
  Loader2,
} from "lucide-react";

const STEPS = [
  {
    num: 1,
    title: "Submit Interest",
    description: "Complete the form below to express your organisation&apos;s interest in contributing data to the portal.",
    icon: Handshake,
  },
  {
    num: 2,
    title: "NSPHCDA Reviews",
    description: "The NSPHCDA team reviews your submission and assesses alignment with portal objectives.",
    icon: FileCheck,
  },
  {
    num: 3,
    title: "Receive Invitation",
    description: "If approved, you'll receive an email invitation to create an account and complete the Data Sharing Agreement.",
    icon: Users,
  },
  {
    num: 4,
    title: "Start Contributing",
    description: "Accept the invite, set up your account, and begin submitting datasets through the platform.",
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

const ORG_TYPE_LABELS: Record<string, string> = {
  government: "Government",
  ngo: "NGO",
  private: "Private",
  international: "International",
  academic: "Academic",
  community: "Community",
  healthcare: "Healthcare",
  other: "Other",
};

export default function PartnerDataPage() {
  const { user, isAuthenticated } = useAuth();
  const canUpload =
    isAuthenticated &&
    (user?.role === "contributor" || user?.role === "admin") &&
    Boolean(user?.organisationId);

  const [formData, setFormData] = useState({
    organisationName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    message: "",
    website: "", // Honeypot
  });

  const [submitted, setSubmitted] = useState(false);
  const mutation = useSubmitPartnerInterest();
  const { data: orgsData, isLoading: orgsLoading } = useOrganisations(1, 6);
  const partners = (orgsData?.data ?? []).filter((org) => org.acronym !== "NSPHCDA");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    mutation.mutate(formData, {
      onSuccess: () => {
        setSubmitted(true);
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-8">
          <div className="flex items-center gap-3 mb-2">
            <Handshake className="size-7 text-primary" />
            <h1 className="text-3xl font-bold">Contribute Data</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Want your organisation to share health or geospatial datasets with NSPHCDA?
            Start here to request access, get reviewed, and join the portal as a data partner.
          </p>
        </Container>
      </div>

      <Container className="py-12 space-y-12">
        {/* How it works */}
        <section>
          <h2 className="text-xl font-bold mb-6">How contributing works</h2>
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

        {/* Expression of Interest Form */}
        <section id="submit-interest">
          <Card>
            <CardHeader>
              <CardTitle>Express Your Interest</CardTitle>
              <CardDescription>
                Tell us about your organisation and what data you would like to contribute.
                NSPHCDA will review your submission and be in touch within 3-5 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="space-y-4 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                      <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Thank you for your interest!</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                      We&apos;ve received your submission. The NSPHCDA team will review it and reach out if there&apos;s a good fit.
                      You should receive a confirmation email shortly.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" onClick={() => setSubmitted(false)}>
                      Submit Another
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="organisationName" className="text-sm font-medium">
                      Organisation Name *
                    </label>
                    <Input
                      id="organisationName"
                      name="organisationName"
                      value={formData.organisationName}
                      onChange={handleChange}
                      placeholder="Niger State Primary Healthcare Board"
                      required
                      minLength={2}
                      maxLength={200}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="contactName" className="text-sm font-medium">
                        Contact Name *
                      </label>
                      <Input
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        placeholder="Dr. Amina Yusuf"
                        required
                        minLength={2}
                        maxLength={200}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contactEmail" className="text-sm font-medium">
                        Contact Email *
                      </label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="ayusuf@nsphcda.org"
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contactPhone" className="text-sm font-medium">
                      Contact Phone (Optional)
                    </label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="+234 803 123 4567"
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      What would your organisation contribute? *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="We collect quarterly immunization data across all 25 LGAs and would like to share this through the GeoHealth Data Portal..."
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={5}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.message.length}/1000 characters
                    </p>
                  </div>

                  {/* Honeypot field - hidden from real users */}
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      width: "1px",
                      height: "1px",
                    }}
                    aria-hidden="true"
                  />

                  {mutation.isError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {(mutation.error as Error)?.message || "Failed to submit. Please try again."}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={mutation.isPending} className="min-w-32">
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Interest
                          <ArrowRight className="size-4 ml-1.5" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        organisationName: "",
                        contactName: "",
                        contactEmail: "",
                        contactPhone: "",
                        message: "",
                        website: "",
                      })}
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
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
          {orgsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-lg border bg-muted/40" />
              ))}
            </div>
          ) : partners.length === 0 ? (
            <p className="text-sm text-muted-foreground">No partner organisations to show yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((org) => (
                <div key={org.id} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {org.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{org.acronym || org.name}</p>
                    <p className="text-xs text-muted-foreground">{ORG_TYPE_LABELS[org.type] ?? org.type}</p>
                  </div>
                  <Badge variant="secondary" className={cn("ml-auto shrink-0 text-xs", statusPill.emerald)}>
                    {org.isActive ? "active" : "inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Existing contributor CTA */}
        <section className="rounded-xl border bg-muted/40 p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">Already approved to contribute?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {canUpload
              ? "Your organisation account can submit datasets from the dashboard."
              : "If NSPHCDA has already invited your organisation, sign in with that account to open the upload wizard."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {canUpload ? (
              <Link href="/upload">
                <Button size="lg">
                  Submit a Dataset
                  <Upload className="size-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Link href={`/login?returnTo=${encodeURIComponent("/upload")}`}>
                <Button size="lg">
                  Sign in to submit data
                  <Upload className="size-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </Container>
    </main>
  );
}
