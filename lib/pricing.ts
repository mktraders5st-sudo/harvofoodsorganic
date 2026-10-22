// Shared by the cart (browser) and the order system (server), so both
// always agree on delivery charges and totals.

export const FREE_DELIVERY_MIN = 3000;
export const DELIVERY_FEE = 250;

export function deliveryFor(subtotal: number) {
  return subtotal === 0 || subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
}

export function totalsFor(subtotal: number) {
  const delivery = deliveryFor(subtotal);
  return { subtotal, delivery, total: subtotal + delivery };
}
