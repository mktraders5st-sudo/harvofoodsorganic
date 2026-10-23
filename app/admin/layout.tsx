import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Harvo Admin" },
  robots: { index: false, follow: false },
};

// Admin pages always read fresh data and are never cached.
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-cream-50">{children}</div>;
}
