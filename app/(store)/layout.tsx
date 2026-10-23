import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartProvider } from "@/lib/cart-context";
import { getCatalog } from "@/lib/server/catalog";

// Prices and stock change from the admin panel, so always render with fresh data.
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();

  return (
    <CartProvider catalog={catalog}>
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}
