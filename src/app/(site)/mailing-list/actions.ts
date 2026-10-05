"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { mailingListSignup } from "@/db/schema";
import { isContactEmailConfigured, sendMailingListSignupEmail } from "@/lib/contactEmail";
import { checkFormSubmission, createFormChallenge, formValues, logBlockedSubmission } from "@/lib/formGuard";
import type { GuardedFormError, GuardedFormState } from "@/lib/formGuardTypes";

export async function submitMailingListSignup(prev: GuardedFormState, formData: FormData): Promise<GuardedFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const retry = (error: GuardedFormError): GuardedFormState => ({
    attempt: prev.attempt + 1,
    challenge: createFormChallenge(),
    error,
    values: formValues(formData, ["name", "email"]),
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return retry("fields");

  const guard = await checkFormSubmission(formData, { form: "mailing-list", name, text: [email] });
  if (guard === "spam") {
    logBlockedSubmission("mailing-list", "spam");
    redirect("/mailing-list?ok=1");
  }
  if (guard !== "ok") return retry(guard);

  await getDb()
    .insert(mailingListSignup)
    .values({
      id: nanoid(),
      name,
      email,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: mailingListSignup.email });

  if (isContactEmailConfigured()) {
    try {
      await sendMailingListSignupEmail({ name, email });
    } catch (err) {
      console.error("Mailing list email failed:", err);
      redirect("/mailing-list?error=send");
    }
  }

  redirect("/mailing-list?ok=1");
}
