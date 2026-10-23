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

/** SQLite UTC timestamp ("2026-10-23 02:07:53") shown in Pakistan time. */
export function formatDateTime(sqlUtc: string) {
  return dateTimeFormatter.format(new Date(`${sqlUtc.replace(" ", "T")}Z`));
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
