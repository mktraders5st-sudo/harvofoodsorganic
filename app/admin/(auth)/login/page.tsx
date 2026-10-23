import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
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
          <p className="mt-1 text-sm text-muted">Sign in to manage products and orders.</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
