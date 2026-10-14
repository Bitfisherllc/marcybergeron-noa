import { Turnstile } from "@/components/Turnstile";
import { FORM_GUARD_FIELDS, GUARDED_FORM_ERRORS, type GuardedFormState } from "@/lib/formGuardTypes";

/** Hidden token, honeypot, and Cloudflare Turnstile for public forms. */
export function FormGuardFields({ state }: { state: GuardedFormState }) {
  return (
    <>
      <input type="hidden" name={FORM_GUARD_FIELDS.token} value={state.token} />
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input name={FORM_GUARD_FIELDS.honeypot} type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Turnstile />
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
