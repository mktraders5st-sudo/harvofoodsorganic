"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions/admin";
import { cn } from "@/lib/format";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export const adminInput =
  "w-full rounded-lg border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-forest-500 aria-[invalid=true]:border-tomato-500";

/** Form wired to a server action, with pending state and a success / error message. */
export function ActionForm({
  action,
  children,
  className,
  render,
}: {
  action: Action;
  children?: React.ReactNode;
  className?: string;
  /** Use instead of children when fields need the error list. */
  render?: (state: ActionState) => React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      {render ? render(state) : children}
      <FormMessage state={state} />
    </form>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn("mt-2 text-xs font-medium", state.ok ? "text-forest-700" : "text-tomato-600")}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  confirm,
}: {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  className?: string;
  /** Ask before submitting (e.g. for destructive actions). */
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-forest-700 text-white hover:bg-forest-900",
    danger: "bg-tomato-600 text-white hover:bg-tomato-700",
    ghost: "border border-cream-200 bg-white text-forest-900 hover:border-forest-500",
  };
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
        styles[variant],
        className,
      )}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-tomato-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}
