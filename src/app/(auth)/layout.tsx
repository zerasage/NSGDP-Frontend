import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Niger State Open Data Portal",
    default: "Authentication",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1">{children}</main>;
}
