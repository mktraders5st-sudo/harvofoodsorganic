import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <Container className="pt-8 pb-12 sm:pt-12 sm:pb-16">
      <h1 className="mb-6 text-3xl font-bold sm:mb-8 sm:text-4xl">Your cart</h1>
      <CartView />
    </Container>
  );
}
