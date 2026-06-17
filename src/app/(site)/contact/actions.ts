"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { contactMessage } from "@/db/schema";
import { getDb } from "@/db";
import { isContactEmailConfigured, sendContactEmail } from "@/lib/contactEmail";

export async function submitContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/contact?error=1");
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
      redirect("/contact?error=send");
    }
  }

  redirect("/contact?sent=1");
}
