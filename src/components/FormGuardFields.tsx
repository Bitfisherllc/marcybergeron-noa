import { FORM_GUARD_FIELDS, GUARDED_FORM_ERRORS, type GuardedFormState } from "@/lib/formGuardTypes";

/** Hidden token, honeypot, and the quick-check question for public forms. */
export function FormGuardFields({ state }: { state: GuardedFormState }) {
  return (
    <>
      <input type="hidden" name={FORM_GUARD_FIELDS.token} value={state.challenge.token} />
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input name={FORM_GUARD_FIELDS.honeypot} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="block text-sm text-muted">
        Quick check (this keeps out spam): <span className="text-ink">{state.challenge.question}</span>
        <input
          name={FORM_GUARD_FIELDS.answer}
          required
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          aria-invalid={state.error === "challenge" ? true : undefined}
          className={`mt-2 block w-24 border bg-paper px-3 py-2 text-sm ${
            state.error === "challenge" ? "border-red-600" : "border-line"
          }`}
        />
      </label>
    </>
  );
}

export function GuardedFormError({ state, className = "text-sm text-red-700" }: { state: GuardedFormState; className?: string }) {
  if (!state.error) return null;
  return (
    <p role="alert" className={className}>
      {GUARDED_FORM_ERRORS[state.error]}
    </p>
  );
}
