"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { contactMessage } from "@/db/schema";
import { getDb } from "@/db";
import { isContactEmailConfigured, sendContactEmail } from "@/lib/contactEmail";

function contactReturnHref(artwork: string, series: string, error?: string): string {
  const params = new URLSearchParams();
  if (artwork) params.set("artwork", artwork);
  if (series) params.set("series", series);
  if (error) params.set("error", error);
  const qs = params.toString();
  return qs ? `/contact?${qs}` : "/contact";
}

export async function submitContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const artwork = String(formData.get("artwork") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(contactReturnHref(artwork, series, "1"));
  }

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
