const formatter = new Intl.NumberFormat("en-US");

export function formatPrice(amount: number) {
  return `Rs. ${formatter.format(amount)}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-PK", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** A database timestamp shown in Pakistan time. */
export function formatDateTime(value: Date | string) {
  return dateTimeFormatter.format(value instanceof Date ? value : new Date(value));
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
