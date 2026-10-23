import type { Metadata } from "next";
import { CheckoutView } from "@/components/CheckoutView";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Container className="pt-8 pb-12 sm:pt-12 sm:pb-16">
      <CheckoutView />
    </Container>
  );
}
