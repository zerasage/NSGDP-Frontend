import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { GeoHealthLogo } from "@/components/layout/geohealth-logo";
import { BRAND } from "@/lib/constants/brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <GeoHealthLogo className="[&_div]:text-primary-foreground" />
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Centralised geospatial and health data platform for Niger State — funded by Umbrella
              Fund, implemented by FACT Foundation.
            </p>
            {/* Logo pair in footer brand column */}
            <div className="flex items-center gap-3 pt-1">
              <Image
                src="/images/moh-logo.png"
                alt="Niger State Ministry of Health"
                width={44}
                height={44}
                className="size-11 rounded-full object-cover border border-white/30 shadow-sm bg-white/10"
              />
              <span className="h-8 w-px bg-primary-foreground/20" aria-hidden />
              <Image
                src={BRAND.logoPath}
                alt={BRAND.logoAlt}
                width={44}
                height={44}
                className="size-11 rounded-full object-cover border-2 border-teal shadow-sm"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-teal">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/85">
              <li><Link href="/dataportal" className="hover:text-white">Explore Data</Link></li>
              <li><Link href="/analytics" className="hover:text-white">Analytics Dashboard</Link></li>
              <li><Link href="/population-map" className="hover:text-white">Population & Facility Map</Link></li>
              <li><Link href="/facilities" className="hover:text-white">Facility Finder</Link></li>
              <li><Link href="/settlements" className="hover:text-white">Settlement Access Map</Link></li>
              <li><Link href="/programs" className="hover:text-white">Programs</Link></li>
              <li><Link href="/learning" className="hover:text-white">Tools & Learning</Link></li>
              <li><Link href="/documents" className="hover:text-white">Document Library</Link></li>
              <li><Link href="/partner-data" className="hover:text-white">Partner Data</Link></li>
              <li><Link href="/submit" className="hover:text-white">Submit Dataset</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-teal">Contact</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/85">
              <li className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 mt-0.5" aria-hidden />
                <span>NSPHCDA, Niger State Government Secretariat, Minna, Niger State</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden />
                <a href="mailto:healthdata@nsphcda.ng.gov.ng" className="hover:text-white">
                  healthdata@nsphcda.ng.gov.ng
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" aria-hidden />
                <span>+234 (0) 803 XXX XXXX</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-teal">Partners</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/85">
              <li><strong>Funded By:</strong> Umbrella Fund</li>
              <li><strong>Implemented By:</strong> FACT Foundation</li>
              <li><strong>Lead Agency:</strong> NSPHCDA</li>
              <li><strong>Supported By:</strong> Niger State Ministry of Health</li>
            </ul>
            <div className="flex gap-3 mt-4 text-sm">
              <a href="#" className="hover:text-teal">Facebook</a>
              <a href="#" className="hover:text-teal">Twitter</a>
              <a href="#" className="hover:text-teal">LinkedIn</a>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 text-sm text-primary-foreground/70">
          <span>© {new Date().getFullYear()} {BRAND.portalName}. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
