"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitMailingListSignup } from "@/app/(site)/mailing-list/actions";
import { FormGuardFields, GuardedFormError } from "@/components/FormGuardFields";
import type { FormChallenge } from "@/lib/formGuardTypes";

const fieldClass = "mt-2 w-full border border-line bg-paper px-3 py-2 text-sm";

export function MailingListForm({ challenge }: { challenge: FormChallenge }) {
  const [state, action, pending] = useActionState(submitMailingListSignup, { attempt: 0, challenge });
  const values = state.values ?? {};

  return (
    <form key={state.attempt} action={action} className="mt-2 space-y-4">
      <GuardedFormError state={state} />
      <label className="block text-sm text-muted">
        Name <span className="text-muted/70">(optional)</span>
        <input name="name" defaultValue={String(values.name ?? "")} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={String(values.email ?? "")}
          className={fieldClass}
        />
      </label>
      <FormGuardFields state={state} />
      <button
        className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Joining…" : "Join the list"}
      </button>
      <p className="text-xs leading-relaxed text-muted">
        We do not share your information. Unsubscribe at any time.{" "}
        <Link className="link-quiet" href="/privacy">
          Privacy Policy
        </Link>
      </p>
    </form>
  );
}
