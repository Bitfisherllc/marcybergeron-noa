"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/(site)/contact/actions";
import { FormGuardFields, GuardedFormError } from "@/components/FormGuardFields";
import type { FormChallenge } from "@/lib/formGuardTypes";

const fieldClass = "mt-2 w-full border border-line bg-paper px-3 py-2 text-sm";

export function ContactForm({
  challenge,
  artworkId,
  seriesSlug,
  defaultMessage,
}: {
  challenge: FormChallenge;
  artworkId?: string;
  seriesSlug?: string;
  defaultMessage: string;
}) {
  const [state, action, pending] = useActionState(submitContact, { attempt: 0, challenge });
  const values = state.values ?? {};

  return (
    <form key={state.attempt} action={action} className="mt-6 space-y-4">
      <GuardedFormError state={state} />
      {artworkId ? <input type="hidden" name="artwork" value={artworkId} /> : null}
      {seriesSlug ? <input type="hidden" name="series" value={seriesSlug} /> : null}
      <label className="block text-sm text-muted">
        Name
        <input name="name" required defaultValue={String(values.name ?? "")} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Email
        <input name="email" type="email" required defaultValue={String(values.email ?? "")} className={fieldClass} />
      </label>
      <label className="block text-sm text-muted">
        Message
        <textarea
          name="message"
          required
          rows={6}
          defaultValue={values.message !== undefined ? String(values.message) : defaultMessage}
          className={fieldClass}
        />
      </label>
      <FormGuardFields state={state} />
      <button
        className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
