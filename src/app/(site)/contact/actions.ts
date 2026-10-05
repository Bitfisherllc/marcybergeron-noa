"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { contactMessage } from "@/db/schema";
import { getDb } from "@/db";
import { isContactEmailConfigured, sendContactEmail } from "@/lib/contactEmail";
import { checkFormSubmission, createFormChallenge, formValues, logBlockedSubmission } from "@/lib/formGuard";
import type { GuardedFormError, GuardedFormState } from "@/lib/formGuardTypes";

function contactReturnHref(artwork: string, series: string, error?: string): string {
  const params = new URLSearchParams();
  if (artwork) params.set("artwork", artwork);
  if (series) params.set("series", series);
  if (error) params.set("error", error);
  const qs = params.toString();
  return qs ? `/contact?${qs}` : "/contact";
}

export async function submitContact(prev: GuardedFormState, formData: FormData): Promise<GuardedFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const artwork = String(formData.get("artwork") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();

  const retry = (error: GuardedFormError): GuardedFormState => ({
    attempt: prev.attempt + 1,
    challenge: createFormChallenge(),
    error,
    values: formValues(formData, ["name", "email", "message"]),
  });

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return retry("fields");

  const guard = await checkFormSubmission(formData, { form: "contact", name, text: [message, email] });
  if (guard === "spam") {
    logBlockedSubmission("contact", "spam");
    redirect("/contact?sent=1");
  }
  if (guard !== "ok") return retry(guard);

  await getDb().insert(contactMessage).values({
    id: nanoid(),
    name,
    email,
    message,
    createdAt: new Date(),
  });

  if (isContactEmailConfigured()) {
    try {
      await sendContactEmail({ name, email, message });
    } catch (err) {
      console.error("Contact email failed:", err);
      redirect(contactReturnHref(artwork, series, "send"));
    }
  }

  redirect("/contact?sent=1");
}
