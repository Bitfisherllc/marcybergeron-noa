"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { workshopInquiry } from "@/db/schema";
import { getDb } from "@/db";
import { isContactEmailConfigured, sendWorkshopInquiryEmail } from "@/lib/contactEmail";
import { checkFormSubmission, createFormChallenge, formValues, logBlockedSubmission } from "@/lib/formGuard";
import type { GuardedFormError, GuardedFormState } from "@/lib/formGuardTypes";
import { parsePostKind } from "@/lib/postKind";
import { getPostBySlug } from "@/lib/queries";
import { canViewWorkshops } from "@/lib/siteFeatures";
import { workshopInterestHref } from "@/lib/workshopCopy";

function interestReturnHref(slug: string, error?: string): string {
  const base = workshopInterestHref(slug);
  return error ? `${base}?error=${error}` : base;
}

export async function submitWorkshopInterest(prev: GuardedFormState, formData: FormData): Promise<GuardedFormState> {
  if (!(await canViewWorkshops())) redirect("/");

  const workshopSlug = String(formData.get("workshopSlug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const confirmThis = String(formData.get("confirmThis") ?? "") === "on";
  const otherWorkshops = formData
    .getAll("otherWorkshops")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const format = "scheduled";
  const groupDates: string[] = [];
  const soloDate = "";

  const retry = (error: GuardedFormError): GuardedFormState => ({
    attempt: prev.attempt + 1,
    challenge: createFormChallenge(),
    error,
    values: formValues(formData, ["name", "email", "phone", "notes", "confirmThis", "otherWorkshops"]),
  });

  if (!workshopSlug || !name || !email || !confirmThis || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return retry("fields");
  }

  const workshop = await getPostBySlug(workshopSlug);
  if (!workshop || !workshop.published || parsePostKind(workshop.kind) !== "workshop") {
    redirect("/workshops");
  }

  const guard = await checkFormSubmission(formData, { form: "workshop-interest", name, text: [notes, email, phone] });
  if (guard === "spam") {
    logBlockedSubmission("workshop-interest", "spam");
    redirect(`${workshopInterestHref(workshop.slug)}?sent=1`);
  }
  if (guard !== "ok") return retry(guard);

  await getDb().insert(workshopInquiry).values({
    id: nanoid(),
    workshopId: workshop.id,
    workshopSlug: workshop.slug,
    workshopTitle: workshop.title,
    name,
    email,
    phone,
    format,
    otherWorkshops: otherWorkshops.join("\n"),
    groupDates: groupDates.join("\n"),
    soloDate,
    notes,
    createdAt: new Date(),
  });

  if (isContactEmailConfigured()) {
    try {
      await sendWorkshopInquiryEmail({
        name,
        email,
        phone,
        workshopTitle: workshop.title,
        workshopSlug: workshop.slug,
        format,
        otherWorkshops,
        groupDates,
        soloDate,
        notes,
      });
    } catch (err) {
      console.error("Workshop inquiry email failed:", err);
      redirect(interestReturnHref(workshopSlug, "send"));
    }
  }

  redirect(`${workshopInterestHref(workshop.slug)}?sent=1`);
}
