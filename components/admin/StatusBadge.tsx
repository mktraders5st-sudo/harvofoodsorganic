import type { OrderStatus } from "@/lib/server/admin-orders";
import { cn } from "@/lib/format";

const styles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  dispatched: "bg-violet-100 text-violet-800",
  delivered: "bg-forest-100 text-forest-900",
  cancelled: "bg-cream-200 text-muted line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", styles[status])}>
      {status}
    </span>
  );
}
