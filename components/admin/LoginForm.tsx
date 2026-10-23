"use client";

import { loginAction } from "@/lib/actions/admin";
import { ActionForm, adminInput, Field, SubmitButton } from "./forms";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm
      action={loginAction}
      className="space-y-4"
      render={(state) => (
        <>
          {next && <input type="hidden" name="next" value={next} />}
          <Field label="Admin password" name="password" error={state.errors?.password}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              maxLength={200}
              aria-invalid={!!state.errors?.password}
              className={adminInput}
            />
          </Field>
          <SubmitButton className="w-full py-2.5">Sign in</SubmitButton>
        </>
      )}
    />
  );
}
