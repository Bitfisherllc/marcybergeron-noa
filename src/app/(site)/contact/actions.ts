"use server";

import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { contactMessage } from "@/db/schema";
import { getDb } from "@/db";

export async function submitContact(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!name || !email || !message) {
    redirect("/contact?error=1");
  }

  await getDb().insert(contactMessage).values({
    id: nanoid(),
    name,
    email,
    message,
    createdAt: new Date(),
  });

  redirect("/contact?sent=1");
}
