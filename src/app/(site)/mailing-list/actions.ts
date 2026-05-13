"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { mailingListSignup } from "@/db/schema";

export async function submitMailingListSignup(formData: FormData) {
  // Honeypot: leave empty; bots often fill hidden fields.
  const trap = String(formData.get("company") ?? "").trim();
  if (trap) {
    redirect("/mailing-list?ok=1");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/mailing-list?error=1");
  }

  await getDb()
    .insert(mailingListSignup)
    .values({
      id: nanoid(),
      name,
      email,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: mailingListSignup.email });

  redirect("/mailing-list?ok=1");
}
