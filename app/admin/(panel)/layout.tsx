import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/server/auth";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // First line of defence; each page and action checks again on its own.
  const admin = await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-30 bg-forest-900 text-white shadow">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-serif text-lg font-bold text-white">
            Harvo <span className="font-sans text-xs font-semibold tracking-widest text-forest-100">ADMIN</span>
          </Link>
          <div className="order-3 w-full sm:order-none sm:w-auto">
            <AdminNav />
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/" target="_blank" className="hidden text-forest-100/80 hover:text-white sm:inline">
              View store ↗
            </Link>
            <span className="hidden text-forest-100/60 md:inline">{admin.username}</span>
            <form action={logoutAction}>
              <button type="submit" className="rounded-lg border border-white/20 px-3 py-1.5 font-semibold hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </>
  );
}
