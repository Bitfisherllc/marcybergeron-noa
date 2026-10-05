"use client";

import { useActionState } from "react";
import { FormGuardFields, GuardedFormError } from "@/components/FormGuardFields";
import type { FormChallenge, GuardedFormState } from "@/lib/formGuardTypes";
import { WORKSHOP_MATERIALS_DEFAULT, WORKSHOP_PRICE_FLOOR_NOTE } from "@/lib/workshopCopy";

export type WorkshopInterestOption = {
  slug: string;
  title: string;
};

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function WorkshopInterestForm({
  workshopTitle,
  workshopSlug,
  otherWorkshops,
  challenge,
  action: submit,
}: {
  workshopTitle: string;
  workshopSlug: string;
  otherWorkshops: WorkshopInterestOption[];
  challenge: FormChallenge;
  action: (prev: GuardedFormState, formData: FormData) => Promise<GuardedFormState>;
}) {
  const [state, action, pending] = useActionState(submit, { attempt: 0, challenge });
  const values = state.values;
  const chosenOthers = asList(values?.otherWorkshops);

  return (
    <form key={state.attempt} action={action} className="space-y-10">
      <GuardedFormError state={state} />
      <input type="hidden" name="workshopSlug" value={workshopSlug} />

      <section className="space-y-4">
        <p className="text-base leading-relaxed text-muted">
          This note is for <span className="text-ink">{workshopTitle}</span>. Marcy will follow up when she has dates,
          or to talk through a private session.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          {WORKSHOP_MATERIALS_DEFAULT} {WORKSHOP_PRICE_FLOOR_NOTE}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl tracking-tight">First, a little about you</h2>
        <label className="block text-sm text-muted">
          Your name
          <input
            name="name"
            required
            defaultValue={String(values?.name ?? "")}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={String(values?.email ?? "")}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-muted">
          Phone <span className="normal-case tracking-normal text-muted/80">(optional)</span>
          <input
            name="phone"
            type="tel"
            defaultValue={String(values?.phone ?? "")}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl tracking-tight">This workshop</h2>
        <p className="text-sm leading-relaxed text-muted">
          All classes are currently TBA. If you send this form, Marcy will let you know when dates are posted and how to
          sign up for the workshops you choose.
        </p>
        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            name="confirmThis"
            type="checkbox"
            value="on"
            defaultChecked={values ? values.confirmThis === "on" : true}
            required
            className="mt-1 h-4 w-4"
          />
          <span>Yes — I am interested in {workshopTitle}.</span>
        </label>
      </section>

      {otherWorkshops.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl tracking-tight">Are you interested in other workshops or classes?</h2>
          <p className="text-sm leading-relaxed text-muted">
            Optional. Check any other workshops you would like to hear about.
          </p>
          <ul className="space-y-3">
            {otherWorkshops.map((w) => (
              <li key={w.slug}>
                <label className="flex items-start gap-3 text-sm text-ink">
                  <input
                    name="otherWorkshops"
                    type="checkbox"
                    value={w.title}
                    defaultChecked={chosenOthers.includes(w.title)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>{w.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-serif text-2xl tracking-tight">Anything else Marcy should know?</h2>
        <label className="block text-sm text-muted">
          A note, optional
          <textarea
            name="notes"
            rows={5}
            defaultValue={String(values?.notes ?? "")}
            className="mt-2 w-full border border-line bg-paper px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="space-y-4">
        <FormGuardFields state={state} />
      </section>

      <button
        className="border border-ink bg-ink px-5 py-3 text-xs tracking-[0.18em] text-paper uppercase hover:bg-ink/90 focus-ring disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Sending…" : "Send interest"}
      </button>
    </form>
  );
}
