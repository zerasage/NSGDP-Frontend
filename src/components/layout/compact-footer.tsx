import Link from "next/link";
import { Mail } from "lucide-react";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { BRAND } from "@/lib/constants/brand";

/**
 * Footer for pages with their own side navigation (docs, learning hub) — a
 * trimmed version of the full site footer's four columns. Lives inside the
 * page's content column (not a full-width page footer), so a fixed or
 * sticky sidebar never sits under or over it.
 */
export function CompactFooter() {
  return (
    <footer className="mt-8 border-t bg-primary text-primary-foreground">
      <div className="px-4 py-8 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <GeoHealthLogo className="[&_div]:text-primary-foreground" />
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Centralised geospatial and health data platform for Niger State.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-teal">Quick links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/85">
              <li>
                <Link href="/dataportal" className="hover:text-white">
                  Explore data
                </Link>
              </li>
              <li>
                <Link href="/learning" className="hover:text-white">
                  Learning hub
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-white">
                  Architecture docs
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-white">
                  Document library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-teal">Contact</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/85">
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden />
                <a href="mailto:healthdata@nsphcda.ng.gov.ng" className="hover:text-white">
                  healthdata@nsphcda.ng.gov.ng
                </a>
              </li>
              <li>
                <Link href="/" className="hover:text-white">
                  Back to portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-primary-foreground/20 pt-6 text-sm text-primary-foreground/70 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND.portalName}
          </span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
