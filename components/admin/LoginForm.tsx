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
          <Field label="Username" name="username" error={state.errors?.username}>
            <input
              id="username"
              name="username"
              autoComplete="username"
              defaultValue={state.values?.username}
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={50}
              aria-invalid={!!state.errors?.username}
              className={adminInput}
            />
          </Field>
          <Field label="Password" name="password" error={state.errors?.password}>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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
