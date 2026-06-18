import { cache } from "react";
import { count, desc, isNull } from "drizzle-orm";
import { contactMessage } from "@/db/schema";
import { getDb } from "@/db";

export async function listContactMessages() {
  return getDb().select().from(contactMessage).orderBy(desc(contactMessage.createdAt));
}

/** Unread messages only — used for admin badge and menu counts. */
export const countContactMessages = cache(async (): Promise<number> => {
  const [row] = await getDb()
    .select({ value: count() })
    .from(contactMessage)
    .where(isNull(contactMessage.readAt));
  return Number(row?.value ?? 0);
});
