import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <main className="flex-1">
      <div className="border-b bg-muted/40">
        <Container className="py-8">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">
            Last updated: June 2026
          </p>
        </Container>
      </div>

      <Container className="py-12">
        <Card>
          <CardContent className="pt-6 prose prose-slate max-w-none">
            <section className="space-y-4">
              <h2 className="text-xl font-bold">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                When you register an account, we collect:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Full name and email address</li>
                <li>Development Partner affiliation (for contributors)</li>
                <li>Phone number (optional, for account recovery)</li>
                <li>Usage data (datasets viewed, downloaded, and uploaded)</li>
              </ul>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide access to the portal and its datasets</li>
                <li>Verify access to restricted datasets</li>
                <li>Communicate portal updates and notifications</li>
                <li>Monitor usage and improve the portal</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">3. Data Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell or share your personal information with third parties,
                except:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>When required by Nigerian law or legal process</li>
                <li>With your explicit consent</li>
                <li>In aggregated, anonymized form for statistical reporting</li>
              </ul>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">4. Cookies and Tracking</h2>
              <p className="text-muted-foreground">
                We use essential cookies to maintain your session. No third-party tracking
                or advertising cookies are used. You can disable cookies in your browser,
                but this may limit portal functionality.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">5. Data Security</h2>
              <p className="text-muted-foreground">
                We implement industry-standard security measures to protect your personal
                information, including encrypted connections (HTTPS), secure password
                hashing, and regular security audits. However, no internet transmission
                is completely secure.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">6. Your Rights</h2>
              <p className="text-muted-foreground">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your account</li>
                <li>Withdraw consent for data processing</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, contact us at{" "}
                <a href="mailto:opendata@niger.gov.ng" className="text-primary hover:underline">
                  opendata@niger.gov.ng
                </a>
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">7. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your account information for as long as your account is active.
                If you request account deletion, we will remove your personal information
                within 30 days, except where retention is required by law.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">8. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                The portal is not intended for users under 18 years of age. We do not
                knowingly collect personal information from children.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">9. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify
                registered users of significant changes via email.
              </p>
            </section>

            <section className="space-y-4 mt-6">
              <h2 className="text-xl font-bold">10. Contact</h2>
              <p className="text-muted-foreground">
                For privacy-related questions or concerns, contact:{" "}
                <a href="mailto:opendata@niger.gov.ng" className="text-primary hover:underline">
                  opendata@niger.gov.ng
                </a>
              </p>
            </section>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
