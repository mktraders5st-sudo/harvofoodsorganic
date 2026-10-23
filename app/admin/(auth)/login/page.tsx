import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin, isAdminPasswordConfigured } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // Already signed in, or on your own computer (no login needed there).
  if (await getAdmin()) redirect("/admin");
  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="relative h-16 w-16 overflow-hidden rounded-full bg-white shadow-sm">
            <Image src="/images/logo.png" alt="" fill sizes="64px" className="object-contain" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Harvo Admin</h1>
          <p className="mt-1 text-sm text-muted">Manage products, stock and orders.</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          {isAdminPasswordConfigured() ? (
            <LoginForm next={next} />
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-forest-900">Admin access isn&apos;t set up on this server yet.</p>
              <p className="text-muted">
                Set an <code className="rounded bg-cream-100 px-1">ADMIN_PASSWORD</code> (12 or more characters) in your
                hosting settings, then restart the site. Until then the admin panel stays locked.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
