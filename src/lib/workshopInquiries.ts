import { cache } from "react";
import { count, desc, isNull } from "drizzle-orm";
import { workshopInquiry } from "@/db/schema";
import { getDb } from "@/db";

export async function listWorkshopInquiries() {
  return getDb().select().from(workshopInquiry).orderBy(desc(workshopInquiry.createdAt));
}

/** Unread workshop interest notes — used for admin badge and menu counts. */
export const countWorkshopInquiries = cache(async (): Promise<number> => {
  const [row] = await getDb()
    .select({ value: count() })
    .from(workshopInquiry)
    .where(isNull(workshopInquiry.readAt));
  return Number(row?.value ?? 0);
});
