const formatter = new Intl.NumberFormat("en-US");

export function formatPrice(amount: number) {
  return `Rs. ${formatter.format(amount)}`;
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
