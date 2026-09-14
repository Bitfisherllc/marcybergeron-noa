"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { workshopInquiry } from "@/db/schema";
import { getDb } from "@/db";
import { isContactEmailConfigured, sendWorkshopInquiryEmail } from "@/lib/contactEmail";
import { parsePostKind } from "@/lib/postKind";
import { getPostBySlug } from "@/lib/queries";
import { workshopInterestHref } from "@/lib/workshopCopy";

function interestReturnHref(slug: string, error?: string): string {
  const base = workshopInterestHref(slug);
  return error ? `${base}?error=${error}` : base;
}

export async function submitWorkshopInterest(formData: FormData) {
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

  if (!workshopSlug || !name || !email || !confirmThis || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(interestReturnHref(workshopSlug || "workshop", "fields"));
  }

  const workshop = await getPostBySlug(workshopSlug);
  if (!workshop || !workshop.published || parsePostKind(workshop.kind) !== "workshop") {
    redirect("/workshops");
  }

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
