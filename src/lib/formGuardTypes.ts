export const FORM_GUARD_FIELDS = {
  token: "formToken",
  answer: "humanCheck",
  honeypot: "website",
} as const;

export type FormChallenge = { token: string; question: string };

export type GuardedFormError = "fields" | "challenge" | "rate";

/** `useActionState` state for public forms protected by the spam guard. */
export type GuardedFormState = {
  /** Changes on each failed attempt so the form remounts with the returned values. */
  attempt: number;
  challenge: FormChallenge;
  error?: GuardedFormError;
  values?: Record<string, string | string[]>;
};

export const GUARDED_FORM_ERRORS: Record<GuardedFormError, string> = {
  fields: "Please complete the required fields and try again.",
  challenge: "The answer to the quick check was not right. Please answer the new question below.",
  rate: "Too many messages were sent from your connection in a short time. Please wait a few minutes and try again, or email directly.",
};
