"use client";

import { updateOrderStatusAction } from "@/lib/actions/admin";
import type { OrderStatus } from "@/lib/server/admin-orders";
import { ActionForm, SubmitButton } from "./forms";

const labels: Record<OrderStatus, string> = {
  pending: "Mark pending",
  confirmed: "Confirm order",
  dispatched: "Mark dispatched",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};

/** One button per allowed next status. */
export function OrderStatusForm({ orderNumber, next }: { orderNumber: string; next: OrderStatus[] }) {
  if (next.length === 0) {
    return <p className="text-sm text-muted">This order is closed; its status can no longer change.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((status) => (
        <ActionForm key={status} action={updateOrderStatusAction}>
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="status" value={status} />
          <SubmitButton
            variant={status === "cancelled" ? "danger" : "primary"}
            confirm={
              status === "cancelled"
                ? "Cancel this order? Its items will be returned to stock. This can't be undone."
                : undefined
            }
          >
            {labels[status]}
          </SubmitButton>
        </ActionForm>
      ))}
    </div>
  );
}
