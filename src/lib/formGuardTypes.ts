export const FORM_GUARD_FIELDS = {
  token: "formToken",
  honeypot: "website",
} as const;

export type GuardedFormError = "fields" | "expired" | "rate" | "turnstile";

/** `useActionState` state for public forms protected by the spam guard. */
export type GuardedFormState = {
  /** Changes on each failed attempt so the form remounts with the returned values. */
  attempt: number;
  token: string;
  error?: GuardedFormError;
  values?: Record<string, string | string[]>;
};

export const GUARDED_FORM_ERRORS: Record<GuardedFormError, string> = {
  fields: "Please complete the required fields and try again.",
  expired: "This form was open for a long time, so it needs a quick refresh. Please send it again.",
  rate: "Too many messages were sent from your connection in a short time. Please wait a few minutes and try again, or email directly.",
  turnstile: "Please confirm you're not a robot and try again.",
};
